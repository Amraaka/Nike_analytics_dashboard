import { create } from 'zustand';
import {
  DashboardState,
  TimeFilter,
  CustomDateRange,
} from '@/types/camera.types';
import { getDashboardSnapshot } from '@/services/dashboardDb';

interface DashboardStore extends DashboardState {
  setTimeFilter: (filter: TimeFilter) => void;
  setCustomDateRange: (range: CustomDateRange | null) => void;
}

const initial = getDashboardSnapshot('1h');

export const useDashboardStore = create<DashboardStore>((set) => ({
  tellers: initial.tellers,
  hallMetrics: initial.hallMetrics,
  peakHours: initial.peakHours,
  customerFlow: initial.customerFlow,
  timeFilter: '1h',
  customDateRange: null,
  lastUpdate: initial.dataAsOf,

  setTimeFilter: (filter: TimeFilter) => {
    if (filter === 'custom') {
      set({ timeFilter: 'custom', customDateRange: null });
      return;
    }
    const snap = getDashboardSnapshot(filter);
    set({
      tellers: snap.tellers,
      hallMetrics: snap.hallMetrics,
      peakHours: snap.peakHours,
      customerFlow: snap.customerFlow,
      timeFilter: filter,
      customDateRange: null,
      lastUpdate: snap.dataAsOf,
    });
  },

  setCustomDateRange: (range: CustomDateRange | null) => {
    set({
      customDateRange: range,
      timeFilter: 'custom',
    });
  },
}));
