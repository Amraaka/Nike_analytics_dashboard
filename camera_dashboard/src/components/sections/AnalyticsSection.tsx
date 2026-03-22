import { ServiceTimeChart } from '@/components/charts/ServiceTimeChart';
import { UtilizationChart } from '@/components/charts/UtilizationChart';
// import { PeakHoursHeatmap } from '@/components/charts/PeakHoursHeatmap';
import { TimeFilter } from '@/components/layout/TimeFilter';

export function AnalyticsSection() {
  return (
    <div className="space-y-8">
      {/* Header with time filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Статистик
        </h2>
        <TimeFilter />
      </div>

      {/* Performance Charts */}
      <div>
        {/* <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">
          Үйлчлэх хугацааны шинжилгээ
        </h3> */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ServiceTimeChart />
          <UtilizationChart />
        </div>
      </div>

      {/* Peak Hours */}
      {/* <div>
        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">
          Ачааллын оргил цагийн шинжилгээ
        </h3>
        <PeakHoursHeatmap />
      </div> */}
    </div>
  );
}
