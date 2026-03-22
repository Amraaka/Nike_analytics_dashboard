import { ServiceTimeChart } from '@/components/charts/ServiceTimeChart';
import { UtilizationChart } from '@/components/charts/UtilizationChart';
import { CounterStaffingDaysSummary } from '@/components/charts/CounterStaffingDaysSummary';
import { CounterStaffingHourlyChart } from '@/components/charts/CounterStaffingHourlyChart';
import { TimeFilter } from '@/components/layout/TimeFilter';

export function AnalyticsSection() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Статистик
        </h2>
        <TimeFilter />
      </div>

      <div className="space-y-6">
        <h3 className="text-lg font-medium text-slate-900 dark:text-white">
          Касс: өдөр болон цагийн хуваарь
        </h3>
        <CounterStaffingDaysSummary />
        <CounterStaffingHourlyChart />
      </div>

      <div>
        <h3 className="mb-4 text-lg font-medium text-slate-900 dark:text-white">
          Үйлчлэх хугацаа ба ашиглалт
        </h3>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ServiceTimeChart />
          <UtilizationChart />
        </div>
      </div>
    </div>
  );
}
