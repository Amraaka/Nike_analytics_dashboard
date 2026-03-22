export interface TellerData {
  id: string;
  name: string;
  isActive: boolean;
  customersServed: number;
  currentCustomer: boolean;
  currentServiceTime: number; // in seconds
  averageServiceTime: number; // in seconds
  minServiceTime: number; // in seconds
  maxServiceTime: number; // in seconds
  utilization: number; // percentage (0-100)
  activeServingTime: number; // in seconds
  totalShiftTime: number; // in seconds
}

export interface HallMetrics {
  peopleInHall: number;
  timestamp: Date;
}

export interface PeakHour {
  hour: number;
  day: string;
  activityLevel: number;
}

export interface CustomerFlowData {
  timestamp: Date;
  count: number;
}

export type TimeFilter = '1h' | '1d' | '1w' | 'custom';

export interface CustomDateRange {
  from: Date;
  to: Date;
}

export interface DashboardState {
  tellers: TellerData[];
  hallMetrics: HallMetrics;
  peakHours: PeakHour[];
  customerFlow: CustomerFlowData[];
  timeFilter: TimeFilter;
  customDateRange: CustomDateRange | null;
  lastUpdate: Date;
}
