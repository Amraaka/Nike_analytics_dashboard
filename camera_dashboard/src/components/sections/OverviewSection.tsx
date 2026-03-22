import { useMemo, useState } from "react";
import { StatCard } from "@/components/cards/StatCard";
import { CustomerFlowChart } from "@/components/charts/CustomerFlowChart";
import { Users, UserCheck, Clock, Activity } from "lucide-react";
import { formatTime, formatPercentage } from "@/lib/utils";
import {
  getOverviewDayOptions,
  getHourlyPeopleMaxSeries,
  getOverviewKpis,
  type OverviewDayKey,
} from "@/lib/analyticsBundle";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function OverviewSection() {
  const dayOptions = useMemo(() => getOverviewDayOptions(), []);
  const [dayKey, setDayKey] = useState<OverviewDayKey>("overall");

  const kpis = useMemo(() => getOverviewKpis(dayKey), [dayKey]);

  const hourlyChartPoints = useMemo(() => {
    const series = getHourlyPeopleMaxSeries(dayKey);
    return series.map((p) => ({ label: p.label, count: p.maxPeople }));
  }, [dayKey]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Тойм мэдээлэл
        </h2>
        <Tabs
          value={dayKey}
          onValueChange={(v) => setDayKey(v as OverviewDayKey)}
          className="w-full sm:w-auto"
        >
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-muted/80 p-1">
            {dayOptions.map((opt) => (
              <TabsTrigger
                key={opt.key}
                value={opt.key}
                className="shrink-0 px-3 text-xs sm:text-sm"
              >
                {opt.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        {kpis.referenceNote}
      </p>

      {/* Overview Stats — analytics.json (өдөр / нийт) */}
      <div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Оргил цаг"
            value={kpis.peakPeopleMax}
            icon={Activity}
            iconColor="text-purple-600 dark:text-purple-400"
            iconBgColor="bg-purple-100 dark:bg-purple-900/20"
            subtitle={`Снапшот: ${kpis.peakHourLabel} (цагийн хамгийн их)`}
          />
          <StatCard
            title="Дундаж үйлчлүүлсэн хугацаа"
            value={formatTime(kpis.avgCustomerDwellSeconds)}
            icon={Clock}
            iconColor="text-amber-600 dark:text-amber-400"
            iconBgColor="bg-amber-100 dark:bg-amber-900/20"
            subtitle="Сегментийн дундаж (zone events)"
          />
          <StatCard
            title="Танхимд байгаа хүмүүс"
            value={kpis.storeHallUniqueVisitors}
            icon={Users}
            iconColor="text-blue-600 dark:text-blue-400"
            iconBgColor="bg-blue-100 dark:bg-blue-900/20"
            subtitle={
              dayKey === "overall"
                ? "Дэлгүүр танхим — өдрийн дундаж (давхцуулахгүй/өдөр)"
                : "Дэлгүүр танхим — өдрийн давхцуулахгүй"
            }
          />
          <StatCard
            title="Касс хүнтэй байсан хувь"
            value={formatPercentage(kpis.counterStaffedPct)}
            icon={UserCheck}
            iconColor="text-emerald-600 dark:text-emerald-400"
            iconBgColor="bg-emerald-100 dark:bg-emerald-900/20"
            subtitle="Counter staffing (сегментийн хувь)"
          />
        </div>
      </div>

      {/* Customer Flow — snapshot hourly max */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
          Харилцагчдын идэвхтэй цаг
        </h2>
        <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
          Снапшот CSV-аас: цаг бүрт хамгийн их хүний тоо
          {dayKey === "overall"
            ? " (өдөр бүрийн ижил цагийн дээд утгуудын дээд). "
            : ". "}
          Үзүүлэлт: харилцагчдын идэвхтэй цагийг илэрхийлнэ.
        </p>
        <CustomerFlowChart hourlySnapshotPoints={hourlyChartPoints} />
      </div>
    </div>
  );
}
