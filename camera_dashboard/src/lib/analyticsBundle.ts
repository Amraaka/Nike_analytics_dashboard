import analyticsJson from "@/data/analytics.json";

export type OverviewDayKey = "overall" | string;

const bundle = analyticsJson;

export function getOverviewDayOptions(): { key: OverviewDayKey; label: string }[] {
  const overall: { key: OverviewDayKey; label: string } = {
    key: "overall",
    label: "Нийт",
  };
  const days = bundle.snapshots.days.map((d) => ({
    key: d.referenceDate as OverviewDayKey,
    label: formatDayTabLabel(d.referenceDate),
  }));
  return [overall, ...days];
}

function formatDayTabLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  return new Intl.DateTimeFormat("mn-MN", {
    month: "short",
    day: "numeric",
  }).format(d);
}

export interface HourlyPeoplePoint {
  hour: number;
  label: string;
  maxPeople: number;
}

/** Per-hour series from snapshot CSV aggregates: `people.max` per slot; overall = max of that slot across days. */
export function getHourlyPeopleMaxSeries(dayKey: OverviewDayKey): HourlyPeoplePoint[] {
  const days = bundle.snapshots.days;
  if (dayKey === "overall") {
    const template = days[0]?.hourly;
    if (!template?.length) return [];
    return template.map((slot, idx) => {
      const maxPeople = Math.max(
        ...days.map((day) => day.hourly[idx]?.people.max ?? 0),
      );
      return { hour: slot.hour, label: slot.label, maxPeople };
    });
  }
  const day = days.find((d) => d.referenceDate === dayKey);
  if (!day) return [];
  return day.hourly.map((h) => ({
    hour: h.hour,
    label: h.label,
    maxPeople: h.people.max,
  }));
}

export function getPeakFromHourlySeries(series: HourlyPeoplePoint[]): HourlyPeoplePoint {
  return series.reduce((best, cur) =>
    cur.maxPeople > best.maxPeople ? cur : best,
  );
}

export interface OverviewKpis {
  peakHourLabel: string;
  peakPeopleMax: number;
  avgCustomerDwellSeconds: number;
  storeHallUniqueVisitors: number;
  counterStaffedPct: number;
  referenceNote: string;
}

export function getOverviewKpis(dayKey: OverviewDayKey): OverviewKpis {
  const series = getHourlyPeopleMaxSeries(dayKey);
  const peak = series.length ? getPeakFromHourlySeries(series) : null;

  if (dayKey === "overall") {
    const snap = bundle.periodSummaries.last7Days.snapshots.aggregateAcrossDays;
    const ze = bundle.periodSummaries.last7Days.zoneEvents;
    const cs = bundle.periodSummaries.last7Days.counterStaffing.summary;
    const hallDays = bundle.zoneEvents.days.map((d) =>
      d.zones.find((z) => z.zone === "store_hall")?.uniqueVisitorsCustomers ?? 0,
    );
    const avgDailyHallVisitors =
      hallDays.length > 0
        ? hallDays.reduce((a, b) => a + b, 0) / hallDays.length
        : 0;
    return {
      peakHourLabel: peak?.label ?? "—",
      peakPeopleMax: Math.round(peak?.maxPeople ?? 0),
      avgCustomerDwellSeconds: Math.round(
        ze.customerSegmentDwellSeconds.mean,
      ),
      storeHallUniqueVisitors: Math.round(avgDailyHallVisitors),
      counterStaffedPct: cs.staffedPct,
      referenceNote: `${bundle.meta.referenceDateRange.start} – ${bundle.meta.referenceDateRange.end} (нийт ${snap.dayCount} өдөр)`,
    };
  }

  const zoneDay = bundle.zoneEvents.days.find((d) => d.referenceDate === dayKey);
  const counterDay = bundle.counterStaffing.perDay.find(
    (d) => d.referenceDate === dayKey,
  );
  const hallZone = zoneDay?.zones.find((z) => z.zone === "store_hall");

  return {
    peakHourLabel: peak?.label ?? "—",
    peakPeopleMax: Math.round(peak?.maxPeople ?? 0),
    avgCustomerDwellSeconds: Math.round(
      zoneDay?.customerSegmentDwellSeconds.mean ?? 0,
    ),
    storeHallUniqueVisitors: hallZone?.uniqueVisitorsCustomers ?? 0,
    counterStaffedPct: counterDay?.summary.staffedPct ?? 0,
    referenceNote: dayKey,
  };
}
