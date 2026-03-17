import argparse
import csv
import json
import re
from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path


def parse_time_of_day(value: str) -> datetime:
    """Parse HH:MM:SS(.fraction) into a fixed-date datetime."""
    text = value.strip()
    hms, frac = (text.split(".", 1) + ["0"])[:2]
    hour_str, minute_str, second_str = hms.split(":")

    hour = int(hour_str)
    minute = int(minute_str)
    second = int(second_str)

    # Some camera systems emit leap-second style values (e.g. 60).
    if second > 59:
        second = 59

    microsecond = int((frac + "000000")[:6])
    return datetime(2000, 1, 1, hour, minute, second, microsecond)


def add_interval(by_hour: dict[int, dict[str, float]], start: datetime, end: datetime, state: str) -> None:
    """Split an interval across hour boundaries and accumulate seconds by state."""
    if end <= start:
        end += timedelta(days=1)

    current = start
    while current < end:
        next_hour = current.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)
        segment_end = min(end, next_hour)
        by_hour[current.hour][state] += (segment_end - current).total_seconds()
        current = segment_end


def aggregate_staffing(csv_path: Path) -> dict[int, dict[str, float]]:
    by_hour: dict[int, dict[str, float]] = defaultdict(lambda: {"staffed": 0.0, "unstaffed": 0.0})

    with csv_path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        required = {"time_start", "time_end", "new_state"}
        missing = required - set(reader.fieldnames or [])
        if missing:
            missing_cols = ", ".join(sorted(missing))
            raise ValueError(f"CSV is missing required columns: {missing_cols}")

        for row in reader:
            start_text = (row.get("time_start") or "").strip()
            end_text = (row.get("time_end") or "").strip()
            state = (row.get("new_state") or "").strip().lower()

            if not start_text or not end_text or state not in {"staffed", "unstaffed"}:
                continue

            start = parse_time_of_day(start_text)
            end = parse_time_of_day(end_text)
            add_interval(by_hour, start, end, state)

    return by_hour


def build_output(by_hour: dict[int, dict[str, float]], source_file: str) -> dict:
    hours = []
    total_staffed = 0.0
    total_unstaffed = 0.0

    for hour in range(24):
        bucket = by_hour.get(hour, {})
        staffed_sec = float(bucket.get("staffed", 0.0))
        unstaffed_sec = float(bucket.get("unstaffed", 0.0))
        total = staffed_sec + unstaffed_sec

        staffed_pct = (staffed_sec / total * 100) if total > 0 else 0.0
        unstaffed_pct = (unstaffed_sec / total * 100) if total > 0 else 0.0

        total_staffed += staffed_sec
        total_unstaffed += unstaffed_sec

        hours.append(
            {
                "hour": f"{hour:02d}:00",
                "staffed_seconds": round(staffed_sec, 2),
                "unstaffed_seconds": round(unstaffed_sec, 2),
                "staffed_percent": round(staffed_pct, 2),
                "unstaffed_percent": round(unstaffed_pct, 2),
            }
        )

    total_seconds = total_staffed + total_unstaffed
    summary = {
        "total_staffed_seconds": round(total_staffed, 2),
        "total_unstaffed_seconds": round(total_unstaffed, 2),
        "staffed_percent": round((total_staffed / total_seconds * 100), 2) if total_seconds > 0 else 0.0,
        "unstaffed_percent": round((total_unstaffed / total_seconds * 100), 2) if total_seconds > 0 else 0.0,
    }

    return {
        "source_file": source_file,
        "hours": hours,
        "summary": summary,
    }


def default_output_path(input_path: Path) -> Path:
    match = re.search(r"(\d{8})", input_path.stem)
    date_suffix = f"_{match.group(1)}" if match else ""
    return Path("client/DB") / f"staffing_hourly_percent{date_suffix}.json"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate hourly staffed/unstaffed percentages from counter_staffing CSV"
    )
    parser.add_argument(
        "--input",
        default="DB/counter_staffing_20260316.csv",
        help="Path to counter_staffing CSV file",
    )
    parser.add_argument(
        "--output",
        default=None,
        help="Output JSON file path (default: client/DB/staffing_hourly_percent_<date>.json)",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    input_path = Path(args.input)
    output_path = Path(args.output) if args.output else default_output_path(input_path)

    if not input_path.exists():
        raise FileNotFoundError(f"Input CSV not found: {input_path}")

    by_hour = aggregate_staffing(input_path)
    payload = build_output(by_hour, source_file=str(input_path))

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2)

    print(f"Generated {output_path}")


if __name__ == "__main__":
    main()
