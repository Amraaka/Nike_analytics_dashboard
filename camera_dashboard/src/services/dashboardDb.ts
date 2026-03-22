import dashboardDb from '@/data/dashboard-db.json';
import type {
  CustomerFlowData,
  HallMetrics,
  PeakHour,
  TellerData,
  TimeFilter,
} from '@/types/camera.types';

type SnapshotKey = Exclude<TimeFilter, 'custom'>;

interface RawHallMetrics {
  peopleInHall: number;
  timestamp: string;
}

interface RawCustomerFlowPoint {
  timestamp: string;
  count: number;
}

interface RawSnapshot {
  tellers: TellerData[];
  hallMetrics: RawHallMetrics;
  peakHours: PeakHour[];
  customerFlow: RawCustomerFlowPoint[];
}

interface RawDashboardDb {
  dataAsOf: string;
  snapshots: Record<SnapshotKey, RawSnapshot>;
}

const db = dashboardDb as RawDashboardDb;

function parseHallMetrics(raw: RawHallMetrics): HallMetrics {
  return {
    peopleInHall: raw.peopleInHall,
    timestamp: new Date(raw.timestamp),
  };
}

function parseCustomerFlow(raw: RawCustomerFlowPoint[]): CustomerFlowData[] {
  return raw.map((cf) => ({
    timestamp: new Date(cf.timestamp),
    count: cf.count,
  }));
}

export interface ParsedDashboardSnapshot {
  tellers: TellerData[];
  hallMetrics: HallMetrics;
  peakHours: PeakHour[];
  customerFlow: CustomerFlowData[];
  dataAsOf: Date;
}

export function getDashboardSnapshot(filter: SnapshotKey): ParsedDashboardSnapshot {
  const snap = db.snapshots[filter];
  if (!snap) {
    throw new Error(`dashboard-db: missing snapshot "${filter}"`);
  }
  return {
    tellers: snap.tellers,
    hallMetrics: parseHallMetrics(snap.hallMetrics),
    peakHours: snap.peakHours,
    customerFlow: parseCustomerFlow(snap.customerFlow),
    dataAsOf: new Date(db.dataAsOf),
  };
}
