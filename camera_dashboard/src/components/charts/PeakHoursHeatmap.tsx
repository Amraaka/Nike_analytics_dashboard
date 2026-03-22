import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardStore } from '@/store/dashboardStore';
import { useMemo } from 'react';

export function PeakHoursHeatmap() {
  const peakHours = useDashboardStore((state) => state.peakHours);

  const days = ['Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба'];
  const hours = Array.from({ length: 9 }, (_, i) => i + 9); // 9am to 5pm

  const heatmapData = useMemo(() => {
    const dataMap = new Map<string, number>();
    peakHours.forEach((ph) => {
      const key = `${ph.day}-${ph.hour}`;
      dataMap.set(key, ph.activityLevel);
    });
    return dataMap;
  }, [peakHours]);

  const getColor = (level: number) => {
    if (level >= 80) return 'bg-emerald-600 dark:bg-emerald-500';
    if (level >= 70) return 'bg-emerald-500 dark:bg-emerald-600';
    if (level >= 60) return 'bg-amber-500 dark:bg-amber-600';
    if (level >= 50) return 'bg-amber-400 dark:bg-amber-500';
    if (level >= 40) return 'bg-orange-400 dark:bg-orange-500';
    return 'bg-slate-300 dark:bg-slate-700';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Оргил цагийн дулааны зураг</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <div className="flex gap-1 mb-2">
              <div className="w-20"></div>
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="flex-1 min-w-[40px] text-center text-xs font-medium text-slate-600 dark:text-slate-400"
                >
                  {hour}:00
                </div>
              ))}
            </div>
            {days.map((day) => (
              <div key={day} className="flex gap-1 mb-1">
                <div className="w-20 text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center">
                  {day.slice(0, 3)}
                </div>
                {hours.map((hour) => {
                  const key = `${day}-${hour}`;
                  const level = heatmapData.get(key) || 0;
                  return (
                    <div
                      key={key}
                      className={`flex-1 min-w-[40px] h-10 rounded ${getColor(level)} transition-all hover:ring-2 hover:ring-slate-400 cursor-pointer`}
                      title={`${day} ${hour}:00 - Activity: ${level}%`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-center gap-4 text-xs">
            <span className="text-slate-600 dark:text-slate-400">Бага</span>
            <div className="flex gap-1">
              <div className="w-4 h-4 rounded bg-slate-300 dark:bg-slate-700"></div>
              <div className="w-4 h-4 rounded bg-orange-400 dark:bg-orange-500"></div>
              <div className="w-4 h-4 rounded bg-amber-400 dark:bg-amber-500"></div>
              <div className="w-4 h-4 rounded bg-amber-500 dark:bg-amber-600"></div>
              <div className="w-4 h-4 rounded bg-emerald-500 dark:bg-emerald-600"></div>
              <div className="w-4 h-4 rounded bg-emerald-600 dark:bg-emerald-500"></div>
            </div>
            <span className="text-slate-600 dark:text-slate-400">Их</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
