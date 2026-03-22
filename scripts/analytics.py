#!/usr/bin/env python3
"""
Read retail / camera analytics CSV exports and write a single structured analytics.json.

Default inputs (same calendar day, under project output/):
  output/counter_staffing_YYYYMMDD.csv
  output/snapshots_YYYYMMDD.csv
  output/zone_events_YYYYMMDD.csv

Default is four consecutive input days (20260301–20260304). Override with --dates YYYYMMDD,YYYYMMDD,...

Writes analytics.json schema v2 (camelCase keys) for frontend use; methodology strings live under definitions.

  python3 scripts/analytics.py
  python3 scripts/analytics.py --dates 20260301,20260302 --output output/analytics.json
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import re
from collections import defaultdict
from datetime import date, datetime, time, timedelta, timezone
from pathlib import Path
from typing import Any

# Default calendar-day CSV suffixes (counter_staffing, snapshots, zone_events per day)
DEFAULT_DATE_SUFFIXES: tuple[str, ...] = (
    "20260301",
    "20260302",
    "20260303",
    "20260304",
)


def parse_args() -> argparse.Namespace:
    root = Path(__file__).resolve().parent.parent
    default_out = root / "output" / "analytics.json"
    p = argparse.ArgumentParser(description="Build analytics.json from sample CSV exports.")
    p.add_argument(
        "--dates",
        type=str,
        default=",".join(DEFAULT_DATE_SUFFIXES),
        metavar="YYYYMMDD,...",
        help=(
            "Comma-separated date suffixes for output/*.csv (default: four days "
            f"{','.join(DEFAULT_DATE_SUFFIXES)})"
        ),
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

# Day-boundary / closing rows — not used for staffing KPIs
STAFFING_EXCLUDE_NEW_STATES = frozenset({"end"})


def dedupe_counter_staffing_rows(rows: list[dict[str, str]]) -> list[dict[str, str]]:
    """Drop exact duplicate rows (common export bug)."""
    seen: set[tuple[str, ...]] = set()
    out: list[dict[str, str]] = []
    for row in rows:
        key = (
            row.get("time_start", ""),
            row.get("time_end", ""),
            row.get("camera_id", ""),
            row.get("previous_state", ""),
            row.get("new_state", ""),
            row.get("duration_seconds", ""),
        )
        if key in seen:
            continue
        seen.add(key)
        out.append(row)
    return out


def prorate_segment_seconds_to_hours(dt_start: datetime, dt_end: datetime) -> dict[int, float]:
    """Split [dt_start, dt_end) across clock hours 0–23 (seconds per hour bucket)."""
    acc: dict[int, float] = defaultdict(float)
    if dt_end <= dt_start:
        return acc
    t = dt_start
    while t < dt_end:
        hour_floor = t.replace(minute=0, second=0, microsecond=0)
        next_hour = hour_floor + timedelta(hours=1)
        chunk_end = min(dt_end, next_hour)
        chunk_sec = (chunk_end - t).total_seconds()
        acc[t.hour] += chunk_sec
        t = chunk_end
    return acc


def analyze_counter_staffing(path: Path, d: date) -> dict[str, Any]:
    staffed_by_hour: dict[int, float] = defaultdict(float)
    unstaffed_by_hour: dict[int, float] = defaultdict(float)

    with path.open(newline="", encoding="utf-8") as f:
        rows = dedupe_counter_staffing_rows(list(csv.DictReader(f)))

    staffed_total = 0.0
    unstaffed_total = 0.0

    for row in rows:
        prev = (row.get("previous_state") or "").strip().lower()
        new_s = (row.get("new_state") or "").strip().lower()
        if new_s in STAFFING_EXCLUDE_NEW_STATES:
            continue
        if prev not in ("staffed", "unstaffed"):
            continue
        try:
            dur = float(row["duration_seconds"])
        except (KeyError, ValueError):
            continue
        try:
            dt_start = combine_date_time(d, row["time_start"])
        except (KeyError, ValueError):
            continue

        dt_end = dt_start + timedelta(seconds=dur)

        if prev == "staffed":
            staffed_total += dur
        else:
            unstaffed_total += dur

        for h, sec in prorate_segment_seconds_to_hours(dt_start, dt_end).items():
            if prev == "staffed":
                staffed_by_hour[h] += sec
            else:
                unstaffed_by_hour[h] += sec

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
            "duration_seconds is attributed to previous_state. Duplicate rows removed. "
            "Rows with new_state 'end' are excluded. Hourly buckets prorate each segment across "
            "clock hours using time_start + duration_seconds."
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
        "reference_date": d.isoformat(),
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


def _dwell_seconds_distribution(vals: list[float]) -> dict[str, float | int | None]:
    if not vals:
        return {
            "segment_count": 0,
            "min": None,
            "mean": None,
            "p50": None,
            "p90": None,
            "p95": None,
            "max": None,
        }
    s = sorted(vals)
    return {
        "segment_count": len(vals),
        "min": round(min(s), 3),
        "mean": round(mean(s), 3),
        "p50": round(percentile_nearest_rank(s, 50), 3),
        "p90": round(percentile_nearest_rank(s, 90), 3),
        "p95": round(percentile_nearest_rank(s, 95), 3),
        "max": round(max(s), 3),
    }


def analyze_zone_events(path: Path, d: date) -> dict[str, Any]:
    by_zone_dwell: dict[str, float] = defaultdict(float)
    by_zone_events: dict[str, int] = defaultdict(int)
    by_zone_visitors: dict[str, set[str]] = defaultdict(set)
    by_zone_durations: dict[str, list[float]] = defaultdict(list)
    customer_duration_seconds: list[float] = []

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

            if role == "customer":
                customer_duration_seconds.append(dur)

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
        "reference_date": d.isoformat(),
        "source_file": path.name,
        "totals": {
            "unique_visitors_customers": len(total_unique_customers),
            "note": "Union of distinct customer person_id across all zones.",
            "dwell_seconds_distribution": {
                **_dwell_seconds_distribution(customer_duration_seconds),
                "scope": "rows where role == customer; duration_seconds per event segment",
            },
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
    }


# --- JSON schema v2 (frontend-oriented camelCase) ---

SCHEMA_VERSION = "2.0"

DEFINITIONS: dict[str, str] = {
    "counterStaffingDuration": (
        "Time in previous_state before each transition; duplicate rows dropped; new_state 'end' excluded. "
        "Summary totals sum full duration_seconds. Hourly series prorates each segment across clock hours."
    ),
    "snapshotsPeopleColumn": (
        "Only the people column. max and min include all readings; avgExcludingZeros is the mean "
        "where people is not 0."
    ),
    "zoneEventsUniqueVisitors": (
        "Distinct person_id where role is customer, union across all zones for the day (one count per person)."
    ),
    "zoneEventsCustomerDwell": (
        "Per event segment duration_seconds for customer rows (multiple segments per person possible)."
    ),
}


def format_counter_staffing(
    raw: dict[str, Any] | None, *, include_per_day: bool = True
) -> dict[str, Any] | None:
    if not raw:
        return None
    days = raw["by_date"]
    summary = raw["combined_summary"]
    hourly = raw["combined_by_hour"]

    def map_summary(s: dict[str, Any]) -> dict[str, Any]:
        return {
            "staffedSeconds": s["staffed_seconds"],
            "unstaffedSeconds": s["unstaffed_seconds"],
            "totalSegmentSeconds": s["total_segment_seconds"],
            "staffedPct": s["staffed_pct"],
            "unstaffedPct": s["unstaffed_pct"],
        }

    def map_hour(row: dict[str, Any]) -> dict[str, Any]:
        return {
            "hour": row["hour"],
            "label": row["hour_label"],
            "staffedSeconds": row["staffed_seconds"],
            "unstaffedSeconds": row["unstaffed_seconds"],
            "staffedPct": row["staffed_pct"],
            "unstaffedPct": row["unstaffed_pct"],
        }

    out: dict[str, Any] = {
        "summary": map_summary(summary),
        "hourly": [map_hour(r) for r in hourly],
    }
    if include_per_day and len(days) > 1:
        out["perDay"] = []
        for day in days:
            out["perDay"].append(
                {
                    "referenceDate": day["reference_date"],
                    "summary": map_summary(day["summary"]),
                    "hourly": [map_hour(r) for r in day["by_hour"]],
                }
            )
    return out


def format_snapshots(raw: dict[str, Any] | None) -> dict[str, Any] | None:
    if not raw:
        return None
    ds = raw["day_summary"]
    peak = raw.get("peak_hour_by_max_people")

    def map_people_block(p: dict[str, Any]) -> dict[str, Any]:
        return {
            "max": p["max"],
            "min": p["min"],
            "avgExcludingZeros": p["avg_excluding_zeros"],
            "readingsCount": p["readings_count"],
            "nonzeroCount": p["nonzero_count"],
        }

    hourly_out = []
    for row in raw["by_hour"]:
        hourly_out.append(
            {
                "hour": row["hour"],
                "label": row["hour_label"],
                "people": map_people_block(row["people"]),
            }
        )

    out: dict[str, Any] = {
        "referenceDate": raw.get("reference_date"),
        "metric": {
            "sourceColumn": raw["column"],
            "note": raw["metrics_note"],
        },
        "day": {
            "totalReadings": ds["total_snapshot_rows"],
            "peopleMax": ds["people_max"],
            "peopleMin": ds["people_min"],
            "peopleAvgExcludingZeros": ds["people_avg_excluding_zeros"],
            "nonzeroReadings": ds["nonzero_readings_count"],
        },
        "hourly": hourly_out,
    }
    if peak:
        out["peakHour"] = {
            "hour": peak["hour"],
            "label": peak["hour_label"],
            "maxPeople": peak["max_people"],
            "avgPeopleExcludingZeros": peak["avg_people_excluding_zeros"],
        }
    else:
        out["peakHour"] = None
    return out


def format_zone_events(raw: dict[str, Any] | None) -> dict[str, Any] | None:
    if not raw:
        return None
    t = raw["totals"]
    dist = t["dwell_seconds_distribution"]
    dist_clean = {
        "segmentCount": dist["segment_count"],
        "min": dist["min"],
        "mean": dist["mean"],
        "p50": dist["p50"],
        "p90": dist["p90"],
        "p95": dist["p95"],
        "max": dist["max"],
    }

    zones = []
    for z in raw["by_zone"]:
        zones.append(
            {
                "zone": z["zone"],
                "totalEvents": z["total_events"],
                "totalDwellSeconds": z["total_dwell_seconds"],
                "uniqueVisitorsCustomers": z["unique_visitors_customers"],
                "avgDurationSeconds": z["avg_duration_seconds"],
                "dwellP50Seconds": z["dwell_p50_seconds"],
            }
        )

    ranking = []
    for row in raw["zone_popularity_ranking"]:
        ranking.append(
            {
                "rank": row["rank"],
                "zone": row["zone"],
                "uniqueCustomers": row["score_by_unique_customers"],
                "totalEvents": row["total_events"],
            }
        )

    pa = raw["peak_activity_hours"]
    peak_evt = pa.get("by_event_count")
    peak_uni = pa.get("by_unique_people")

    return {
        "referenceDate": raw.get("reference_date"),
        "visitors": {
            "uniqueCustomers": t["unique_visitors_customers"],
        },
        "customerSegmentDwellSeconds": dist_clean,
        "zones": zones,
        "zoneRanking": ranking,
        "peakActivity": {
            "byEventCount": (
                {
                    "hour": peak_evt["hour"],
                    "label": peak_evt["hour_label"],
                    "events": peak_evt["event_count"],
                }
                if peak_evt
                else None
            ),
            "byUniquePeople": (
                {
                    "hour": peak_uni["hour"],
                    "label": peak_uni["hour_label"],
                    "uniquePeople": peak_uni["unique_people"],
                }
                if peak_uni
                else None
            ),
        },
    }


def format_snapshots_multi(raws: list[dict[str, Any]]) -> dict[str, Any] | None:
    if not raws:
        return None
    days = [format_snapshots(r) for r in raws]
    if len(days) == 1:
        return days[0]
    ref_dates = [d["referenceDate"] for d in days if d.get("referenceDate")]
    return {
        "dayCount": len(days),
        "referenceDateRange": {
            "start": min(ref_dates) if ref_dates else None,
            "end": max(ref_dates) if ref_dates else None,
        },
        "days": days,
    }


def format_zone_events_multi(raws: list[dict[str, Any]]) -> dict[str, Any] | None:
    if not raws:
        return None
    days = [format_zone_events(r) for r in raws]
    if len(days) == 1:
        return days[0]
    ref_dates = [d["referenceDate"] for d in days if d.get("referenceDate")]
    return {
        "dayCount": len(days),
        "referenceDateRange": {
            "start": min(ref_dates) if ref_dates else None,
            "end": max(ref_dates) if ref_dates else None,
        },
        "days": days,
    }


def parse_date_suffix_list(s: str) -> list[str]:
    out: list[str] = []
    for part in s.split(","):
        part = re.sub(r"\D", "", part.strip())
        if not part:
            continue
        if len(part) != 8:
            raise SystemExit(f"Invalid date suffix in --dates (need 8 digits): {part!r}")
        out.append(part)
    if not out:
        raise SystemExit("--dates must list at least one YYYYMMDD")
    return out


def take_last_n_suffixes(suffixes: list[str], n: int) -> list[str]:
    """Calendar-order suffixes, keep only the last n (for rolling windows)."""
    if not suffixes or n <= 0:
        return []
    dated: list[tuple[date, str]] = []
    for s in suffixes:
        d = parse_yyyymmdd(s)
        if d:
            dated.append((d, s))
    dated.sort(key=lambda x: x[0])
    tail = dated[-min(n, len(dated)) :]
    return [s for _, s in tail]


def zone_events_union_customer_metrics(paths: list[Path]) -> tuple[int, list[float]]:
    """Distinct customer person_id across files; all customer segment durations for distribution."""
    ids: set[str] = set()
    durations: list[float] = []
    for path in paths:
        if not path.is_file():
            continue
        if infer_date_from_stem(path.stem) is None:
            continue
        with path.open(newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                role = (row.get("role") or "").strip().lower()
                if role != "customer":
                    continue
                try:
                    durations.append(float(row.get("duration_seconds") or 0))
                except ValueError:
                    pass
                pid = (row.get("person_id") or "").strip()
                if pid:
                    ids.add(pid)
    return len(ids), durations


def aggregate_snapshots_day_raw(sn_raws: list[dict[str, Any]]) -> dict[str, Any] | None:
    """Mean/sum stats from per-day snapshot `day_summary` blocks."""
    if not sn_raws:
        return None
    rows = []
    for r in sn_raws:
        ds = r.get("day_summary")
        if not ds:
            continue
        rows.append(ds)
    if not rows:
        return None
    totals = [float(x["total_snapshot_rows"]) for x in rows]
    mx = [float(x["people_max"]) for x in rows]
    avg_ez = [float(x["people_avg_excluding_zeros"]) for x in rows if x.get("people_avg_excluding_zeros") is not None]
    nz = [float(x["nonzero_readings_count"]) for x in rows]
    return {
        "dayCount": len(rows),
        "sumTotalReadings": int(sum(totals)),
        "avgDailyTotalReadings": round(mean(totals), 3) if totals else None,
        "maxPeopleMaxAcrossDays": round(max(mx), 3) if mx else None,
        "avgPeopleMaxPerDay": round(mean(mx), 3) if mx else None,
        "avgPeopleAvgExcludingZerosPerDay": round(mean(avg_ez), 3) if avg_ez else None,
        "avgNonzeroReadingsPerDay": round(mean(nz), 3) if nz else None,
    }


def build_period_summary_last7_days(
    root: Path,
    all_suffixes: list[str],
    sn_raws: list[dict[str, Any]],
) -> dict[str, Any] | None:
    """
    Rolling slot shaped like a 7-day window: uses the last min(7, N) calendar days
    present in `all_suffixes`. With only 4 days of exports, daysIncluded is 4.
    """
    sel = take_last_n_suffixes(all_suffixes, 7)
    if not sel:
        return None

    d_start = parse_yyyymmdd(sel[0])
    d_end = parse_yyyymmdd(sel[-1])
    if not d_start or not d_end:
        return None

    sel_iso = {parse_yyyymmdd(s).isoformat() for s in sel if parse_yyyymmdd(s)}
    sn_win = [r for r in sn_raws if r.get("reference_date") in sel_iso]

    cs_paths = [root / "output" / f"counter_staffing_{s}.csv" for s in sel]
    cs_paths = [p for p in cs_paths if p.is_file()]
    cs_raw_win = analyze_counter_staffing_files(cs_paths) if cs_paths else None

    ze_paths = [root / "output" / f"zone_events_{s}.csv" for s in sel]
    ze_paths = [p for p in ze_paths if p.is_file()]
    n_unique, durs = zone_events_union_customer_metrics(ze_paths)
    dist = _dwell_seconds_distribution(durs)

    agg_sn = aggregate_snapshots_day_raw(sn_win)

    out: dict[str, Any] = {
        "windowDaysCap": 7,
        "daysIncluded": len(sel),
        "referenceDateRange": {
            "start": d_start.isoformat(),
            "end": d_end.isoformat(),
        },
        "bundleDateSuffixesIncluded": sel,
        "note": (
            "Uses the last up to 7 calendar days present in --dates. "
            "If you have fewer than 7 days of CSVs, this summarizes all available days in that tail."
        ),
        "counterStaffing": format_counter_staffing(cs_raw_win, include_per_day=False),
        "snapshots": {
            "aggregateAcrossDays": agg_sn,
        },
        "zoneEvents": {
            "uniqueCustomersAcrossPeriod": n_unique,
            "customerSegmentDwellSeconds": {
                "segmentCount": dist["segment_count"],
                "min": dist["min"],
                "mean": dist["mean"],
                "p50": dist["p50"],
                "p90": dist["p90"],
                "p95": dist["p95"],
                "max": dist["max"],
            },
            "note": (
                "uniqueCustomersAcrossPeriod counts distinct person_id on customer rows "
                "across the selected zone_events files (one person once for the whole period)."
            ),
        },
    }
    return out


def build_analytics_document(
    date_suffixes: list[str],
    reference_start: date,
    reference_end: date,
    cs_paths: list[Path],
    snapshot_basenames: list[str],
    zone_basenames: list[str],
    cs_raw: dict[str, Any] | None,
    sn_raws: list[dict[str, Any]],
    ze_raws: list[dict[str, Any]],
    period_summaries: dict[str, Any] | None,
) -> dict[str, Any]:
    doc: dict[str, Any] = {
        "meta": {
            "schemaVersion": SCHEMA_VERSION,
            "referenceDateRange": {
                "start": reference_start.isoformat(),
                "end": reference_end.isoformat(),
            },
            "bundleDateSuffixes": date_suffixes,
            "inputs": {
                "counterStaffing": [p.name for p in cs_paths],
                "snapshots": snapshot_basenames,
                "zoneEvents": zone_basenames,
            },
            "generatedAtUtc": datetime.now(timezone.utc)
            .replace(microsecond=0)
            .isoformat()
            .replace("+00:00", "Z"),
        },
        "definitions": DEFINITIONS.copy(),
        "counterStaffing": format_counter_staffing(cs_raw),
        "snapshots": format_snapshots_multi(sn_raws),
        "zoneEvents": format_zone_events_multi(ze_raws),
    }
    if period_summaries:
        doc["periodSummaries"] = period_summaries
    return doc


def main() -> None:
    args = parse_args()
    root = Path(__file__).resolve().parent.parent

    date_suffixes = parse_date_suffix_list(args.dates)

    if args.counter_staffing is not None and len(args.counter_staffing) > 0:
        cs_paths = [Path(p) for p in args.counter_staffing]
    else:
        cs_paths = [
            root / "output" / f"counter_staffing_{s}.csv" for s in date_suffixes
        ]

    ref_start = parse_yyyymmdd(date_suffixes[0]) or date.today()
    ref_end = parse_yyyymmdd(date_suffixes[-1]) or ref_start
    if args.date and len(date_suffixes) == 1:
        d_override = datetime.strptime(args.date, "%Y-%m-%d").date()
        ref_start = ref_end = d_override

    snapshot_basenames = [f"snapshots_{s}.csv" for s in date_suffixes]
    zone_basenames = [f"zone_events_{s}.csv" for s in date_suffixes]

    cs_raw = analyze_counter_staffing_files(cs_paths)

    sn_raws: list[dict[str, Any]] = []
    ze_raws: list[dict[str, Any]] = []
    for suffix in date_suffixes:
        d = parse_yyyymmdd(suffix)
        if not d:
            continue
        sp = root / "output" / f"snapshots_{suffix}.csv"
        zp = root / "output" / f"zone_events_{suffix}.csv"
        if sp.is_file():
            sn_raws.append(analyze_snapshots(sp, d))
        if zp.is_file():
            ze_raws.append(analyze_zone_events(zp, d))

    period_block: dict[str, Any] | None = None
    ps = build_period_summary_last7_days(root, date_suffixes, sn_raws)
    if ps:
        period_block = {"last7Days": ps}

    out = build_analytics_document(
        date_suffixes,
        ref_start,
        ref_end,
        cs_paths,
        snapshot_basenames,
        zone_basenames,
        cs_raw,
        sn_raws,
        ze_raws,
        period_block,
    )

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"Wrote {args.output}")


if __name__ == "__main__":
    main()
