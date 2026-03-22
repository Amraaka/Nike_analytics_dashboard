#!/usr/bin/env python3
"""
Read retail / camera analytics CSV exports and write a single structured analytics.json.

Default inputs (same calendar day, under project output/):
  output/counter_staffing_YYYYMMDD.csv
  output/dwell_YYYYMMDD.csv
  output/snapshots_YYYYMMDD.csv
  output/zone_events_YYYYMMDD.csv

Default YYYYMMDD is 20260301; override with --bundle-date 20260302.

  python3 scripts/analytics.py
  python3 scripts/analytics.py --bundle-date 20260304 --output output/analytics.json
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import re
from collections import defaultdict
from datetime import date, datetime, time, timezone
from pathlib import Path
from typing import Any


def default_bundle_paths(root: Path, date_suffix: str) -> dict[str, Path]:
    """date_suffix: YYYYMMDD (e.g. 20260301)."""
    out = root / "output"
    return {
        "counter_staffing": out / f"counter_staffing_{date_suffix}.csv",
        "dwell": out / f"dwell_{date_suffix}.csv",
        "snapshots": out / f"snapshots_{date_suffix}.csv",
        "zone_events": out / f"zone_events_{date_suffix}.csv",
    }


def parse_args() -> argparse.Namespace:
    root = Path(__file__).resolve().parent.parent
    default_out = root / "output" / "analytics.json"
    p = argparse.ArgumentParser(description="Build analytics.json from sample CSV exports.")
    p.add_argument(
        "--bundle-date",
        type=str,
        default="20260301",
        metavar="YYYYMMDD",
        help="Date suffix for default output/*.csv bundle (default: 20260301)",
    )
    p.add_argument(
        "--counter-staffing",
        type=Path,
        nargs="*",
        default=None,
        metavar="PATH",
        help=(
            "Optional: counter staffing CSV paths only (replaces bundle counter file; "
            "can pass multiple files for multi-day staffing stats)"
        ),
    )
    p.add_argument(
        "--output",
        type=Path,
        default=default_out,
        help=f"Output JSON path (default: {default_out})",
    )
    p.add_argument(
        "--date",
        type=str,
        default=None,
        help="Calendar date YYYY-MM-DD for time-only CSV columns (default: infer from filenames)",
    )
    return p.parse_args()


def parse_yyyymmdd(s: str) -> date | None:
    if len(s) != 8 or not s.isdigit():
        return None
    return date(int(s[:4]), int(s[4:6]), int(s[6:8]))


def infer_date_from_stem(stem: str) -> date | None:
    m = re.search(r"_(\d{8})$", stem)
    if not m:
        return None
    return parse_yyyymmdd(m.group(1))


def combine_date_time(d: date, t_str: str) -> datetime:
    """Parse 'HH:MM:SS.xx' or 'HH:MM:SS' into datetime on d."""
    parts = t_str.strip().split(":")
    h, m = int(parts[0]), int(parts[1])
    sec_part = parts[2]
    if "." in sec_part:
        s_str, frac = sec_part.split(".", 1)
        s = int(s_str)
        micro = int((frac + "000000")[:6])
    else:
        s = int(sec_part)
        micro = 0
    return datetime.combine(d, time(h, m, s, micro))


def percentile_nearest_rank(sorted_vals: list[float], p: float) -> float | None:
    if not sorted_vals:
        return None
    if p <= 0:
        return float(sorted_vals[0])
    if p >= 100:
        return float(sorted_vals[-1])
    k = math.ceil((p / 100.0) * len(sorted_vals)) - 1
    k = max(0, min(k, len(sorted_vals) - 1))
    return float(sorted_vals[k])


def mean(vals: list[float]) -> float | None:
    return sum(vals) / len(vals) if vals else None


# --- counter_staffing ---


def analyze_counter_staffing(path: Path, d: date) -> dict[str, Any]:
    staffed_by_hour: dict[int, float] = defaultdict(float)
    unstaffed_by_hour: dict[int, float] = defaultdict(float)

    with path.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                dur = float(row["duration_seconds"])
            except (KeyError, ValueError):
                continue
            prev = (row.get("previous_state") or "").strip().lower()
            try:
                ts = combine_date_time(d, row["time_start"])
            except (KeyError, ValueError):
                continue
            hour = ts.hour
            if prev == "staffed":
                staffed_by_hour[hour] += dur
            elif prev == "unstaffed":
                unstaffed_by_hour[hour] += dur

    staffed_total = sum(staffed_by_hour.values())
    unstaffed_total = sum(unstaffed_by_hour.values())
    denom = staffed_total + unstaffed_total

    hours = sorted(set(staffed_by_hour) | set(unstaffed_by_hour))
    by_hour = []
    for h in hours:
        s = staffed_by_hour[h]
        u = unstaffed_by_hour[h]
        t = s + u
        by_hour.append(
            {
                "hour": h,
                "hour_label": f"{h:02d}:00–{h:02d}:59",
                "staffed_seconds": round(s, 3),
                "unstaffed_seconds": round(u, 3),
                "staffed_pct": round(100.0 * s / t, 2) if t > 0 else None,
                "unstaffed_pct": round(100.0 * u / t, 2) if t > 0 else None,
            }
        )

    return {
        "reference_date": d.isoformat(),
        "source_file": path.name,
        "interpretation": (
            "duration_seconds is attributed to previous_state (time spent in that state before transition)."
        ),
        "summary": {
            "staffed_seconds": round(staffed_total, 3),
            "unstaffed_seconds": round(unstaffed_total, 3),
            "total_segment_seconds": round(denom, 3),
            "staffed_pct": round(100.0 * staffed_total / denom, 2) if denom > 0 else None,
            "unstaffed_pct": round(100.0 * unstaffed_total / denom, 2) if denom > 0 else None,
        },
        "by_hour": by_hour,
    }


def analyze_counter_staffing_files(paths: list[Path]) -> dict[str, Any] | None:
    """Load one or more counter_staffing CSVs (date from filename)."""
    daily: list[dict[str, Any]] = []
    for path in paths:
        path = path.resolve()
        if not path.is_file():
            continue
        d = infer_date_from_stem(path.stem)
        if d is None:
            continue
        daily.append(analyze_counter_staffing(path, d))

    if not daily:
        return None

    interpretation = daily[0]["interpretation"]
    staffed_total = sum(day["summary"]["staffed_seconds"] for day in daily)
    unstaffed_total = sum(day["summary"]["unstaffed_seconds"] for day in daily)
    denom = staffed_total + unstaffed_total

    hour_staffed: dict[int, float] = defaultdict(float)
    hour_unstaffed: dict[int, float] = defaultdict(float)
    for day in daily:
        for row in day["by_hour"]:
            hour_staffed[row["hour"]] += row["staffed_seconds"]
            hour_unstaffed[row["hour"]] += row["unstaffed_seconds"]

    hours = sorted(set(hour_staffed) | set(hour_unstaffed))
    combined_by_hour = []
    for h in hours:
        s = hour_staffed[h]
        u = hour_unstaffed[h]
        t = s + u
        combined_by_hour.append(
            {
                "hour": h,
                "hour_label": f"{h:02d}:00–{h:02d}:59",
                "staffed_seconds": round(s, 3),
                "unstaffed_seconds": round(u, 3),
                "staffed_pct": round(100.0 * s / t, 2) if t > 0 else None,
                "unstaffed_pct": round(100.0 * u / t, 2) if t > 0 else None,
            }
        )

    return {
        "source_files": [day["source_file"] for day in daily],
        "reference_dates": [day["reference_date"] for day in daily],
        "interpretation": interpretation,
        "by_date": daily,
        "combined_summary": {
            "staffed_seconds": round(staffed_total, 3),
            "unstaffed_seconds": round(unstaffed_total, 3),
            "total_segment_seconds": round(denom, 3),
            "staffed_pct": round(100.0 * staffed_total / denom, 2) if denom > 0 else None,
            "unstaffed_pct": round(100.0 * unstaffed_total / denom, 2) if denom > 0 else None,
        },
        "combined_by_hour": combined_by_hour,
    }


# --- dwell ---


def analyze_dwell(path: Path, d: date) -> dict[str, Any]:
    rows: list[dict[str, Any]] = []
    with path.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            role = (row.get("role") or "").strip().lower()
            if role != "customer":
                continue
            try:
                dwell = float(row["dwell_seconds"])
            except (KeyError, ValueError):
                continue
            try:
                t_enter = combine_date_time(d, row["time_enter"])
            except (KeyError, ValueError):
                continue
            pid = (row.get("person_id") or "").strip()
            rows.append(
                {
                    "person_id": pid,
                    "dwell_seconds": dwell,
                    "hour": t_enter.hour,
                    "camera_id": (row.get("camera_id") or "").strip(),
                }
            )

    dwell_vals = sorted(r["dwell_seconds"] for r in rows)
    unique_ids = {r["person_id"] for r in rows if r["person_id"]}

    by_hour_unique: dict[int, set[str]] = defaultdict(set)
    for r in rows:
        by_hour_unique[r["hour"]].add(r["person_id"])

    hour_counts = [(h, len(by_hour_unique[h])) for h in sorted(by_hour_unique)]
    peak = max(hour_counts, key=lambda x: x[1]) if hour_counts else None

    return {
        "source_file": path.name,
        "scope": "rows where role == customer",
        "visit_segments": len(rows),
        "unique_visitors": len(unique_ids),
        "dwell_seconds_distribution": {
            "min": round(min(dwell_vals), 3) if dwell_vals else None,
            "mean": round(mean(dwell_vals), 3) if dwell_vals else None,
            "p50": round(percentile_nearest_rank(dwell_vals, 50), 3) if dwell_vals else None,
            "p90": round(percentile_nearest_rank(dwell_vals, 90), 3) if dwell_vals else None,
            "p95": round(percentile_nearest_rank(dwell_vals, 95), 3) if dwell_vals else None,
            "max": round(max(dwell_vals), 3) if dwell_vals else None,
        },
        "peak_hour_by_unique_visitors": (
            {
                "hour": peak[0],
                "hour_label": f"{peak[0]:02d}:00–{peak[0]:02d}:59",
                "unique_visitors": peak[1],
            }
            if peak
            else None
        ),
        "by_hour_unique_visitors": [
            {
                "hour": h,
                "hour_label": f"{h:02d}:00–{h:02d}:59",
                "unique_visitors": c,
            }
            for h, c in hour_counts
        ],
    }


# --- snapshots ---


def _people_stats(values: list[float]) -> dict[str, float | int | None]:
    """max/min over all readings; avg only over values != 0."""
    if not values:
        return {
            "max": None,
            "min": None,
            "avg_excluding_zeros": None,
            "readings_count": 0,
            "nonzero_count": 0,
        }
    nonzero = [v for v in values if v != 0]
    return {
        "max": round(max(values), 3),
        "min": round(min(values), 3),
        "avg_excluding_zeros": round(sum(nonzero) / len(nonzero), 3) if nonzero else None,
        "readings_count": len(values),
        "nonzero_count": len(nonzero),
    }


def analyze_snapshots(path: Path, d: date) -> dict[str, Any]:
    """Aggregate only the `people` column by clock hour."""
    people_by_hour: dict[int, list[float]] = defaultdict(list)
    all_people: list[float] = []

    with path.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                ts = combine_date_time(d, row["time"])
            except (KeyError, ValueError):
                continue
            try:
                pe = float(row.get("people", "") or 0)
            except ValueError:
                continue
            h = ts.hour
            people_by_hour[h].append(pe)
            all_people.append(pe)

    hours = sorted(people_by_hour.keys())
    by_hour = []
    for hour in hours:
        vals = people_by_hour[hour]
        by_hour.append(
            {
                "hour": hour,
                "hour_label": f"{hour:02d}:00–{hour:02d}:59",
                "people": _people_stats(vals),
            }
        )

    day_stats = _people_stats(all_people)
    peak_row = max(by_hour, key=lambda x: x["people"]["max"] or -1) if by_hour else None

    return {
        "source_file": path.name,
        "column": "people",
        "metrics_note": (
            "Only the `people` column is used. max/min include all readings; "
            "avg_excluding_zeros is the mean of values where people != 0."
        ),
        "day_summary": {
            "total_snapshot_rows": day_stats["readings_count"],
            "people_max": day_stats["max"],
            "people_min": day_stats["min"],
            "people_avg_excluding_zeros": day_stats["avg_excluding_zeros"],
            "nonzero_readings_count": day_stats["nonzero_count"],
        },
        "by_hour": by_hour,
        "peak_hour_by_max_people": (
            {
                "hour": peak_row["hour"],
                "hour_label": peak_row["hour_label"],
                "max_people": peak_row["people"]["max"],
                "avg_people_excluding_zeros": peak_row["people"]["avg_excluding_zeros"],
            }
            if peak_row and peak_row["people"]["max"] is not None
            else None
        ),
    }


# --- zone_events ---


def analyze_zone_events(path: Path, d: date) -> dict[str, Any]:
    by_zone_dwell: dict[str, float] = defaultdict(float)
    by_zone_events: dict[str, int] = defaultdict(int)
    by_zone_visitors: dict[str, set[str]] = defaultdict(set)
    by_zone_durations: dict[str, list[float]] = defaultdict(list)

    by_hour_activity: dict[int, int] = defaultdict(int)
    by_hour_unique: dict[int, set[str]] = defaultdict(set)

    with path.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            zone = (row.get("zone") or "").strip() or "unknown"
            try:
                dur = float(row.get("duration_seconds") or 0)
            except ValueError:
                dur = 0.0
            pid = (row.get("person_id") or "").strip()
            role = (row.get("role") or "").strip().lower()

            by_zone_dwell[zone] += dur
            by_zone_events[zone] += 1
            by_zone_durations[zone].append(dur)
            if role == "customer" and pid:
                by_zone_visitors[zone].add(pid)

            try:
                ts = combine_date_time(d, row["time_start"])
            except (KeyError, ValueError):
                continue
            hr = ts.hour
            by_hour_activity[hr] += 1
            if pid:
                by_hour_unique[hr].add(pid)

    zones = sorted(by_zone_events.keys())
    zone_summaries = []
    for z in zones:
        durs = sorted(by_zone_durations[z])
        zone_summaries.append(
            {
                "zone": z,
                "total_events": by_zone_events[z],
                "total_dwell_seconds": round(by_zone_dwell[z], 3),
                "unique_visitors_customers": len(by_zone_visitors[z]),
                "avg_duration_seconds": round(mean(by_zone_durations[z]), 3)
                if by_zone_durations[z]
                else None,
                "dwell_p50_seconds": round(percentile_nearest_rank(durs, 50), 3) if durs else None,
            }
        )

    zone_summaries.sort(key=lambda x: x["unique_visitors_customers"], reverse=True)
    total_unique_customers = set()
    for s in by_zone_visitors.values():
        total_unique_customers |= s

    hour_activity = sorted(by_hour_activity.items())
    peak_act = max(hour_activity, key=lambda x: x[1]) if hour_activity else None
    hour_unique = sorted((h, len(by_hour_unique[h])) for h in sorted(by_hour_unique))
    peak_unique_h = max(hour_unique, key=lambda x: x[1]) if hour_unique else None

    return {
        "source_file": path.name,
        "totals": {
            "unique_visitors_customers": len(total_unique_customers),
            "note": "Union of distinct customer person_id across all zones.",
        },
        "by_zone": zone_summaries,
        "zone_popularity_ranking": [
            {
                "rank": i + 1,
                "zone": x["zone"],
                "score_by_unique_customers": x["unique_visitors_customers"],
                "total_events": x["total_events"],
            }
            for i, x in enumerate(zone_summaries)
        ],
        "peak_activity_hours": {
            "by_event_count": (
                {
                    "hour": peak_act[0],
                    "hour_label": f"{peak_act[0]:02d}:00–{peak_act[0]:02d}:59",
                    "event_count": peak_act[1],
                }
                if peak_act
                else None
            ),
            "by_unique_people": (
                {
                    "hour": peak_unique_h[0],
                    "hour_label": f"{peak_unique_h[0]:02d}:00–{peak_unique_h[0]:02d}:59",
                    "unique_people": peak_unique_h[1],
                }
                if peak_unique_h
                else None
            ),
        },
        "by_hour": [
            {
                "hour": h,
                "hour_label": f"{h:02d}:00–{h:02d}:59",
                "event_count": by_hour_activity[h],
                "unique_people": len(by_hour_unique[h]),
            }
            for h in sorted(set(by_hour_activity) | set(by_hour_unique))
        ],
    }


def main() -> None:
    args = parse_args()
    root = Path(__file__).resolve().parent.parent

    suffix = re.sub(r"\D", "", args.bundle_date)
    if len(suffix) != 8:
        raise SystemExit(f"--bundle-date must be YYYYMMDD (got {args.bundle_date!r})")

    bundle = default_bundle_paths(root, suffix)

    if args.counter_staffing is not None and len(args.counter_staffing) > 0:
        cs_paths = [Path(p) for p in args.counter_staffing]
    else:
        cs_paths = [bundle["counter_staffing"]]

    if args.date:
        ref_date = datetime.strptime(args.date, "%Y-%m-%d").date()
    else:
        ref_date = parse_yyyymmdd(suffix) or date.today()

    out: dict[str, Any] = {
        "meta": {
            "schema_version": "1.0",
            "reference_date": ref_date.isoformat(),
            "bundle_date_suffix": suffix,
            "source_csv": {k: str(v.resolve()) for k, v in bundle.items()},
            "counter_staffing_paths": [str(p.resolve()) for p in cs_paths],
            "generated_at_utc": datetime.now(timezone.utc)
            .replace(microsecond=0)
            .isoformat()
            .replace("+00:00", "Z"),
        },
        "counter_staffing": None,
        "dwell": None,
        "snapshots": None,
        "zone_events": None,
    }

    out["counter_staffing"] = analyze_counter_staffing_files(cs_paths)

    dw = bundle["dwell"]
    if dw.is_file():
        out["dwell"] = analyze_dwell(dw, ref_date)

    sn = bundle["snapshots"]
    if sn.is_file():
        out["snapshots"] = analyze_snapshots(sn, ref_date)

    ze = bundle["zone_events"]
    if ze.is_file():
        out["zone_events"] = analyze_zone_events(ze, ref_date)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"Wrote {args.output}")


if __name__ == "__main__":
    main()
