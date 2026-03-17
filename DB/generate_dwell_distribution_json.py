import argparse
import csv
import json
import re
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path


def parse_time_of_day(value: str) -> datetime:
    """Parse HH:MM:SS(.fraction) to fixed-date datetime with leap-second clamp."""
    text = value.strip()
    hms, frac = (text.split(".", 1) + ["0"])[:2]
    hour_str, minute_str, second_str = hms.split(":")

    hour = int(hour_str)
    minute = int(minute_str)
    second = int(second_str)
    if second > 59:
        second = 59

    microsecond = int((frac + "000000")[:6])
    return datetime(2000, 1, 1, hour, minute, second, microsecond)


def duration_from_times(time_enter: str, time_exit: str) -> float:
    start = parse_time_of_day(time_enter)
    end = parse_time_of_day(time_exit)
    seconds = (end - start).total_seconds()
    if seconds < 0:
        seconds += 24 * 3600
    return seconds


def quantile(values: list[float], p: float) -> float:
    if not values:
        return 0.0
    vals = sorted(values)
    idx = (len(vals) - 1) * p
    lo = int(idx)
    hi = min(lo + 1, len(vals) - 1)
    frac = idx - lo
    return vals[lo] * (1 - frac) + vals[hi] * frac


def summarize(values: list[float]) -> dict:
    if not values:
        return {
            "count": 0,
            "min_seconds": 0.0,
            "p50_seconds": 0.0,
            "p90_seconds": 0.0,
            "p95_seconds": 0.0,
            "max_seconds": 0.0,
        }

    vals = sorted(values)
    return {
        "count": len(vals),
        "min_seconds": round(vals[0], 2),
        "p50_seconds": round(quantile(vals, 0.50), 2),
        "p90_seconds": round(quantile(vals, 0.90), 2),
        "p95_seconds": round(quantile(vals, 0.95), 2),
        "max_seconds": round(vals[-1], 2),
    }


def default_output_path(input_path: Path) -> Path:
    match = re.search(r"(\d{8})", input_path.stem)
    date_suffix = f"_{match.group(1)}" if match else ""
    return Path("client/DB") / f"dwell_distribution_clean{date_suffix}.json"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate cleaned dwell distribution JSON for graphing"
    )
    parser.add_argument(
        "--input",
        default="DB/dwell_20260316.csv",
        help="Path to dwell CSV file",
    )
    parser.add_argument(
        "--output",
        default=None,
        help="Output JSON path (default: client/DB/dwell_distribution_clean_<date>.json)",
    )
    parser.add_argument(
        "--min-dwell-sec",
        type=float,
        default=3.0,
        help="Drop very short detections below this duration",
    )
    parser.add_argument(
        "--max-dwell-sec",
        type=float,
        default=3600.0,
        help="Drop suspiciously long detections above this duration",
    )
    parser.add_argument(
        "--mismatch-tolerance-sec",
        type=float,
        default=5.0,
        help="If |reported - recomputed| is above this, use recomputed duration",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    input_path = Path(args.input)
    output_path = Path(args.output) if args.output else default_output_path(input_path)

    if not input_path.exists():
        raise FileNotFoundError(f"Input CSV not found: {input_path}")

    buckets = [
        {"label": "0-30s", "min": 0.0, "max": 30.0},
        {"label": "30-60s", "min": 30.0, "max": 60.0},
        {"label": "1-2min", "min": 60.0, "max": 120.0},
        {"label": "2-3min", "min": 120.0, "max": 180.0},
        {"label": "3-5min", "min": 180.0, "max": 300.0},
        {"label": "5-10min", "min": 300.0, "max": 600.0},
        {"label": "10-15min", "min": 600.0, "max": 900.0},
        {"label": "15-30min", "min": 900.0, "max": 1800.0},
        {"label": "30-60min", "min": 1800.0, "max": 3600.0},
        {"label": "60min+", "min": 3600.0, "max": None},
    ]

    counts = {
        bucket["label"]: {"customer": 0, "worker": 0, "total": 0}
        for bucket in buckets
    }

    removed_by_reason = {
        "invalid_role": 0,
        "time_parse_error": 0,
        "non_positive_duration": 0,
        "below_min_dwell": 0,
        "above_max_dwell": 0,
    }

    durations_by_role: dict[str, list[float]] = {"customer": [], "worker": []}
    recomputed_duration_rows = 0
    input_rows = 0

    with input_path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            input_rows += 1
            role = (row.get("role") or "").strip().lower()
            if role not in {"customer", "worker"}:
                removed_by_reason["invalid_role"] += 1
                continue

            try:
                recomputed = duration_from_times(
                    row.get("time_enter", ""),
                    row.get("time_exit", ""),
                )
            except Exception:
                removed_by_reason["time_parse_error"] += 1
                continue

            if recomputed <= 0:
                removed_by_reason["non_positive_duration"] += 1
                continue

            reported_raw = (row.get("dwell_seconds") or "").strip()
            reported = None
            if reported_raw:
                try:
                    reported = float(reported_raw)
                except ValueError:
                    reported = None

            if reported is None or abs(reported - recomputed) > args.mismatch_tolerance_sec:
                dwell = recomputed
                recomputed_duration_rows += 1
            else:
                dwell = reported

            if dwell < args.min_dwell_sec:
                removed_by_reason["below_min_dwell"] += 1
                continue

            if dwell > args.max_dwell_sec:
                removed_by_reason["above_max_dwell"] += 1
                continue

            durations_by_role[role].append(dwell)

            for bucket in buckets:
                lower = float(bucket["min"])
                upper = bucket["max"]
                in_bucket = dwell >= lower and (upper is None or dwell < float(upper))
                if in_bucket:
                    label = str(bucket["label"])
                    counts[label][role] += 1
                    counts[label]["total"] += 1
                    break

    used_rows = len(durations_by_role["customer"]) + len(durations_by_role["worker"])
    removed_rows = input_rows - used_rows

    bucket_payload = []
    for bucket in buckets:
        label = str(bucket["label"])
        entry = counts[label]
        bucket_payload.append(
            {
                "bucket": label,
                "min_seconds": bucket["min"],
                "max_seconds": bucket["max"],
                "customer_count": entry["customer"],
                "worker_count": entry["worker"],
                "total_count": entry["total"],
                "pct_of_used_rows": round((entry["total"] / used_rows * 100), 2) if used_rows else 0.0,
            }
        )

    all_durations = durations_by_role["customer"] + durations_by_role["worker"]

    payload = {
        "source_file": str(input_path),
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "filters": {
            "duration_source": "reported_dwell_seconds_if_close_else_recomputed_from_times",
            "mismatch_tolerance_seconds": args.mismatch_tolerance_sec,
            "min_dwell_seconds": args.min_dwell_sec,
            "max_dwell_seconds": args.max_dwell_sec,
        },
        "quality": {
            "input_rows": input_rows,
            "rows_used_for_distribution": used_rows,
            "rows_removed": removed_rows,
            "recomputed_duration_rows": recomputed_duration_rows,
            "removed_by_reason": removed_by_reason,
        },
        "summary_by_role": {
            "customer": summarize(durations_by_role["customer"]),
            "worker": summarize(durations_by_role["worker"]),
            "all": summarize(all_durations),
        },
        "buckets": bucket_payload,
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2)

    print(f"Generated {output_path}")


if __name__ == "__main__":
    main()
