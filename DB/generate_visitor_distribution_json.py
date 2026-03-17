import argparse
import csv
import json
import re
from collections import defaultdict
from pathlib import Path


def parse_hour_bucket(value: str) -> str | None:
    """Extract HH:00 from a time string like HH:MM:SS(.fraction)."""
    text = (value or "").strip()
    if not text:
        return None

    match = re.search(r"(\d{1,2}):(\d{2}):(\d{2})", text)
    if not match:
        return None

    hour = int(match.group(1))
    if hour < 0 or hour > 23:
        return None
    return f"{hour:02d}:00"


def parse_non_negative_number(value: str) -> float:
    """Parse CSV numeric cell; invalid/negative values are treated as 0."""
    try:
        number = float((value or "").strip())
    except (TypeError, ValueError):
        return 0.0
    return number if number > 0 else 0.0


def to_natural(value: float) -> int:
    """Round non-negative numbers to nearest natural number (0, 1, 2, ...)."""
    if value <= 0:
        return 0
    return int(value + 0.5)


def sort_hours(hours: set[str]) -> list[str]:
    return sorted(hours, key=lambda hour: int(hour.split(":")[0]))


def aggregate_distribution(csv_path: Path, metric_column: str) -> tuple[list[str], list[str], dict, dict, dict]:
    by_zone_hour = defaultdict(lambda: defaultdict(lambda: {"sum": 0.0, "samples": 0}))
    by_hour = defaultdict(lambda: {"sum": 0.0, "samples": 0})
    by_zone = defaultdict(lambda: {"sum": 0.0, "samples": 0})

    zones: set[str] = set()
    hours: set[str] = set()

    with csv_path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        required = {"time", "camera_id", metric_column}
        missing = required - set(reader.fieldnames or [])
        if missing:
            missing_cols = ", ".join(sorted(missing))
            raise ValueError(f"CSV is missing required columns: {missing_cols}")

        for row in reader:
            zone = (row.get("camera_id") or "").strip()
            hour = parse_hour_bucket(row.get("time") or "")
            if not zone or not hour:
                continue

            value = parse_non_negative_number(row.get(metric_column) or "0")

            zones.add(zone)
            hours.add(hour)

            zone_hour_bucket = by_zone_hour[zone][hour]
            zone_hour_bucket["sum"] += value
            zone_hour_bucket["samples"] += 1

            hour_bucket = by_hour[hour]
            hour_bucket["sum"] += value
            hour_bucket["samples"] += 1

            zone_bucket = by_zone[zone]
            zone_bucket["sum"] += value
            zone_bucket["samples"] += 1

    sorted_zones = sorted(zones)
    sorted_hours = sort_hours(hours)
    return sorted_zones, sorted_hours, by_zone_hour, by_hour, by_zone


def build_output(
    source_file: str,
    metric_column: str,
    zones: list[str],
    hours: list[str],
    by_zone_hour: dict,
    by_hour: dict,
    by_zone: dict,
) -> dict:
    zone_hour = []
    zone_hour_lookup: dict[tuple[str, str], dict] = {}
    for zone in zones:
        for hour in hours:
            bucket = by_zone_hour.get(zone, {}).get(hour, {"sum": 0.0, "samples": 0})
            samples = int(bucket["samples"])
            total = float(bucket["sum"])
            avg_raw = (total / samples) if samples > 0 else 0.0

            item = {
                "zone": zone,
                "hour": hour,
                "avg_count": to_natural(avg_raw),
                "avg_count_raw": round(avg_raw, 4),
                "sample_count": samples,
                "total_count": round(total, 4),
            }
            zone_hour.append(item)
            zone_hour_lookup[(zone, hour)] = item

    hourly_average = []
    for hour in hours:
        bucket = by_hour.get(hour, {"sum": 0.0, "samples": 0})
        samples = int(bucket["samples"])
        total = float(bucket["sum"])
        avg_raw = (total / samples) if samples > 0 else 0.0

        hourly_average.append(
            {
                "hour": hour,
                "avg_count": to_natural(avg_raw),
                "avg_count_raw": round(avg_raw, 4),
                "sample_count": samples,
                "total_count": round(total, 4),
            }
        )

    zone_average = []
    zone_average_lookup = {}
    for zone in zones:
        bucket = by_zone.get(zone, {"sum": 0.0, "samples": 0})
        samples = int(bucket["samples"])
        total = float(bucket["sum"])
        avg_raw = (total / samples) if samples > 0 else 0.0

        item = {
            "zone": zone,
            "avg_count": to_natural(avg_raw),
            "avg_count_raw": round(avg_raw, 4),
            "sample_count": samples,
            "total_count": round(total, 4),
        }
        zone_average.append(item)
        zone_average_lookup[zone] = item

    by_camera_hour = [
        {
            "camera_id": item["zone"],
            "hour": item["hour"],
            "avg_count": item["avg_count"],
            "avg_count_raw": item["avg_count_raw"],
            "sample_count": item["sample_count"],
            "total_count": item["total_count"],
        }
        for item in zone_hour
    ]

    by_hour = []
    for hour in hours:
        hour_item = next((entry for entry in hourly_average if entry["hour"] == hour), None)
        if hour_item is None:
            continue

        by_camera = []
        for zone in zones:
            zone_hour_item = zone_hour_lookup.get(
                (zone, hour),
                {
                    "avg_count": 0,
                    "avg_count_raw": 0.0,
                    "sample_count": 0,
                    "total_count": 0.0,
                },
            )
            by_camera.append(
                {
                    "camera_id": zone,
                    "avg_count": zone_hour_item["avg_count"],
                    "avg_count_raw": zone_hour_item["avg_count_raw"],
                    "sample_count": zone_hour_item["sample_count"],
                    "total_count": zone_hour_item["total_count"],
                }
            )

        by_hour.append(
            {
                "hour": hour,
                "avg_count": hour_item["avg_count"],
                "avg_count_raw": hour_item["avg_count_raw"],
                "sample_count": hour_item["sample_count"],
                "total_count": hour_item["total_count"],
                "by_camera": by_camera,
            }
        )

    by_camera = []
    for zone in zones:
        zone_item = zone_average_lookup.get(
            zone,
            {
                "avg_count": 0,
                "avg_count_raw": 0.0,
                "sample_count": 0,
                "total_count": 0.0,
            },
        )

        zone_by_hour = []
        for hour in hours:
            zone_hour_item = zone_hour_lookup.get(
                (zone, hour),
                {
                    "avg_count": 0,
                    "avg_count_raw": 0.0,
                    "sample_count": 0,
                    "total_count": 0.0,
                },
            )
            zone_by_hour.append(
                {
                    "hour": hour,
                    "avg_count": zone_hour_item["avg_count"],
                    "avg_count_raw": zone_hour_item["avg_count_raw"],
                    "sample_count": zone_hour_item["sample_count"],
                    "total_count": zone_hour_item["total_count"],
                }
            )

        by_camera.append(
            {
                "camera_id": zone,
                "avg_count": zone_item["avg_count"],
                "avg_count_raw": zone_item["avg_count_raw"],
                "sample_count": zone_item["sample_count"],
                "total_count": zone_item["total_count"],
                "by_hour": zone_by_hour,
            }
        )

    total_samples = sum(item["sample_count"] for item in hourly_average)
    total_count = sum(item["total_count"] for item in hourly_average)
    overall_avg_raw = (total_count / total_samples) if total_samples > 0 else 0.0

    return {
        "source_file": source_file,
        "metric": metric_column,
        "zones": zones,
        "camera_ids": zones,
        "hours": hours,
        "by_camera_hour": by_camera_hour,
        "by_hour": by_hour,
        "by_camera": by_camera,
        "zone_hour": zone_hour,
        "hourly_average": hourly_average,
        "zone_average": zone_average,
        "summary": {
            "overall_avg_count": to_natural(overall_avg_raw),
            "overall_avg_count_raw": round(overall_avg_raw, 4),
            "total_samples": total_samples,
            "total_count": round(total_count, 4),
        },
    }


def default_output_path(input_path: Path) -> Path:
    match = re.search(r"(\d{8})", input_path.stem)
    date_suffix = f"_{match.group(1)}" if match else ""
    return Path("client/DB") / f"visitor_distribution_hourly{date_suffix}.json"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Generate visitor distribution JSON by hour and camera zone from snapshots CSV. "
            "Averages are stored as natural numbers for chart display."
        )
    )
    parser.add_argument(
        "--input",
        default="DB/snapshots_20260316.csv",
        help="Path to snapshots CSV file",
    )
    parser.add_argument(
        "--output",
        default=None,
        help="Output JSON path (default: client/DB/visitor_distribution_hourly_<date>.json)",
    )
    parser.add_argument(
        "--metric",
        default="customers",
        help="Numeric CSV column to aggregate (e.g., customers, people, workers)",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    input_path = Path(args.input)
    output_path = Path(args.output) if args.output else default_output_path(input_path)

    if not input_path.exists():
        raise FileNotFoundError(f"Input CSV not found: {input_path}")

    zones, hours, by_zone_hour, by_hour, by_zone = aggregate_distribution(input_path, args.metric)
    payload = build_output(
        source_file=str(input_path),
        metric_column=args.metric,
        zones=zones,
        hours=hours,
        by_zone_hour=by_zone_hour,
        by_hour=by_hour,
        by_zone=by_zone,
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2)

    print(f"Generated {output_path}")


if __name__ == "__main__":
    main()