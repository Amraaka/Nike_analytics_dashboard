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

/** Tab label: `3/1` from `2026-03-01` (month/day, no leading zeros). */
function formatDayTabLabel(isoDate: string): string {
  const parts = isoDate.split("-");
  if (parts.length >= 3) {
    const month = Number(parts[1]);
    const day = Number(parts[2]);
    if (Number.isFinite(month) && Number.isFinite(day)) {
      return `${month}/${day}`;
    }
  }
  return isoDate;
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

export interface CounterStaffHourlyPoint {
  hour: number;
  label: string;
  staffedSeconds: number;
  unstaffedSeconds: number;
  staffedPct: number;
  unstaffedPct: number;
}

/** Counter staffing: staffed vs unstaffed per hour (aggregated or one day). */
export function getCounterStaffingHourly(
  dayKey: OverviewDayKey,
): CounterStaffHourlyPoint[] {
  if (dayKey === "overall") {
    return bundle.counterStaffing.hourly.map((h) => ({
      hour: h.hour,
      label: h.label,
      staffedSeconds: h.staffedSeconds,
      unstaffedSeconds: h.unstaffedSeconds,
      staffedPct: h.staffedPct,
      unstaffedPct: h.unstaffedPct,
    }));
  }
  const day = bundle.counterStaffing.perDay.find(
    (d) => d.referenceDate === dayKey,
  );
  if (!day) return [];
  return day.hourly.map((h) => ({
    hour: h.hour,
    label: h.label,
    staffedSeconds: h.staffedSeconds,
    unstaffedSeconds: h.unstaffedSeconds,
    staffedPct: h.staffedPct,
    unstaffedPct: h.unstaffedPct,
  }));
}

export interface CounterStaffingDaySummaryRow {
  referenceDate: string;
  label: string;
  staffedSeconds: number;
  unstaffedSeconds: number;
  totalSegmentSeconds: number;
  staffedPct: number;
  unstaffedPct: number;
}

export function getCounterStaffingDaySummaries(): {
  days: CounterStaffingDaySummaryRow[];
  overall: CounterStaffingDaySummaryRow;
} {
  const days = bundle.counterStaffing.perDay.map((d) => ({
    referenceDate: d.referenceDate,
    label: formatDayTabLabel(d.referenceDate),
    staffedSeconds: d.summary.staffedSeconds,
    unstaffedSeconds: d.summary.unstaffedSeconds,
    totalSegmentSeconds: d.summary.totalSegmentSeconds,
    staffedPct: d.summary.staffedPct,
    unstaffedPct: d.summary.unstaffedPct,
  }));
  const s = bundle.counterStaffing.summary;
  const overall: CounterStaffingDaySummaryRow = {
    referenceDate: "",
    label: "Нийт (бүх өдөр)",
    staffedSeconds: s.staffedSeconds,
    unstaffedSeconds: s.unstaffedSeconds,
    totalSegmentSeconds: s.totalSegmentSeconds,
    staffedPct: s.staffedPct,
    unstaffedPct: s.unstaffedPct,
  };
  return { days, overall };
}

export interface DwellShareThresholdPoint {
  seconds: number;
  label: string;
  pctOfPeople: number;
}

export interface CustomerDwellShareByPeople {
  peopleCount: number;
  sampleBasis: string;
  scope: string;
  cumulativePctAtMostSeconds: DwellShareThresholdPoint[];
  pctAtLeastSeconds: DwellShareThresholdPoint[];
}

type ZoneEventsDay = (typeof bundle.zoneEvents.days)[number] & {
  customerDwellShareByPeople?: CustomerDwellShareByPeople;
};

/** Dwell distribution by person (customer rows); per calendar day or period aggregate in `periodSummaries`. */
export function getCustomerDwellShareByPeople(
  dayKey: OverviewDayKey,
): CustomerDwellShareByPeople | null {
  if (dayKey === "overall") {
    const ze = bundle.periodSummaries.last7Days.zoneEvents as {
      customerDwellShareByPeople?: CustomerDwellShareByPeople;
    };
    return ze.customerDwellShareByPeople ?? null;
  }
  const day = bundle.zoneEvents.days.find(
    (d) => d.referenceDate === dayKey,
  ) as ZoneEventsDay | undefined;
  return day?.customerDwellShareByPeople ?? null;
}

/** Full-period aggregates for the report page (`periodSummaries.last7Days`). */
export interface ReportPeriodSummary {
  meta: {
    schemaVersion: string;
    referenceDateRange: { start: string; end: string };
    bundleDateSuffixes: string[];
    generatedAtUtc: string;
  };
  period: {
    windowDaysCap: number;
    daysIncluded: number;
    note: string;
  };
  counterStaffing: {
    staffedSeconds: number;
    unstaffedSeconds: number;
    totalSegmentSeconds: number;
    staffedPct: number;
    unstaffedPct: number;
  };
  snapshots: {
    dayCount: number;
    sumTotalReadings: number;
    avgDailyTotalReadings: number;
    maxPeopleMaxAcrossDays: number;
    avgPeopleMaxPerDay: number;
    avgPeopleAvgExcludingZerosPerDay: number;
    avgNonzeroReadingsPerDay: number;
  };
  zoneEvents: {
    uniqueCustomersAcrossPeriod: number;
    segmentCount: number;
    dwellMin: number;
    dwellMean: number;
    dwellP50: number;
    dwellP90: number;
    dwellP95: number;
    dwellMax: number;
    dwellSharePeopleCount: number | null;
    note: string | null;
  };
}

export function getReportPeriodSummary(): ReportPeriodSummary | null {
  const ps = bundle.periodSummaries?.last7Days;
  if (!ps) return null;
  const ze = ps.zoneEvents;
  const dwell = ze.customerSegmentDwellSeconds;
  const share = ze.customerDwellShareByPeople as { peopleCount?: number } | undefined;
  return {
    meta: {
      schemaVersion: bundle.meta.schemaVersion,
      referenceDateRange: bundle.meta.referenceDateRange,
      bundleDateSuffixes: bundle.meta.bundleDateSuffixes,
      generatedAtUtc: bundle.meta.generatedAtUtc,
    },
    period: {
      windowDaysCap: ps.windowDaysCap,
      daysIncluded: ps.daysIncluded,
      note: ps.note,
    },
    counterStaffing: { ...ps.counterStaffing.summary },
    snapshots: { ...ps.snapshots.aggregateAcrossDays },
    zoneEvents: {
      uniqueCustomersAcrossPeriod: ze.uniqueCustomersAcrossPeriod,
      segmentCount: dwell.segmentCount,
      dwellMin: dwell.min,
      dwellMean: dwell.mean,
      dwellP50: dwell.p50,
      dwellP90: dwell.p90,
      dwellP95: dwell.p95,
      dwellMax: dwell.max,
      dwellSharePeopleCount: share?.peopleCount ?? null,
      note: "note" in ze ? (ze as { note?: string }).note ?? null : null,
    },
  };
}
