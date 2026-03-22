import { useDashboardStore } from '@/store/dashboardStore';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TimeFilter as TimeFilterType } from '@/types/camera.types';

export function TimeFilter() {
  const { timeFilter, setTimeFilter } = useDashboardStore();

  const handleFilterChange = (value: string) => {
    setTimeFilter(value as TimeFilterType);
  };

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Хугацаа:
      </span>
      <Tabs value={timeFilter} onValueChange={handleFilterChange}>
        <TabsList>
          <TabsTrigger value="1h">1 Өдөр</TabsTrigger>
          <TabsTrigger value="1d">7 Хоног</TabsTrigger>
          <TabsTrigger value="1w">1 сар</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
