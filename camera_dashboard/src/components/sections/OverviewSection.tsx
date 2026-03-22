import { useMemo } from "react";
import { useDashboardStore } from "@/store/dashboardStore";
import { StatCard } from "@/components/cards/StatCard";
import { CustomerFlowChart } from "@/components/charts/CustomerFlowChart";
import { MetricAlert } from "@/components/alerts/MetricAlert";
import { Users, UserCheck, Clock, Activity } from "lucide-react";
import { formatTime } from "@/lib/utils";

export function OverviewSection() {
  const { tellers, hallMetrics } = useDashboardStore();

  const stats = useMemo(() => {
    const activeTellers = tellers.filter((t) => t.isActive).length;
    const totalCustomers = tellers.reduce(
      (sum, t) => sum + t.customersServed,
      0,
    );
    const avgServiceTime = Math.round(
      tellers.reduce((sum, t) => sum + t.averageServiceTime, 0) /
        tellers.length,
    );
    const avgUtilization = Math.round(
      tellers.reduce((sum, t) => sum + t.utilization, 0) / tellers.length,
    );

    return {
      activeTellers,
      totalCustomers,
      avgServiceTime,
      avgUtilization,
    };
  }, [tellers]);

  const alerts = useMemo(() => {
    const alertsList = [];

    if (hallMetrics.peopleInHall > 40) {
      alertsList.push({
        type: "warning" as const,
        message: `Танхимд нийт ${hallMetrics.peopleInHall} хүн байна`,
      });
    }

    // if (stats.avgUtilization < 70) {
    //   alertsList.push({
    //     type: 'critical' as const,
    //     message: `Low average utilization: ${stats.avgUtilization}% (target: 70%+)`,
    //   });
    // }

    const overworkedTellers = tellers.filter((t) => t.utilization >= 95);
    if (overworkedTellers.length > 0) {
      alertsList.push({
        type: "warning" as const,
        message: `${overworkedTellers.length} ажилтны ачаалал 95%+ байна — ачааллыг тэнцвэржүүлэхийг зөвлөе`,
      });
    }

    return alertsList;
  }, [hallMetrics, tellers]);

  return (
    <div className="space-y-8">
      {/* Overview Stats */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
          Тойм мэдээлэл
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Оргил цаг"
            value={hallMetrics.peopleInHall}
            icon={Activity}
            iconColor="text-purple-600 dark:text-purple-400"
            iconBgColor="bg-purple-100 dark:bg-purple-900/20"
            subtitle="Одоогийн тоо"
          />
          <StatCard
            title="Дундаж үйлчлүүлсэн хугацаа"
            value={formatTime(stats.avgServiceTime)}
            icon={Clock}
            iconColor="text-amber-600 dark:text-amber-400"
            iconBgColor="bg-amber-100 dark:bg-amber-900/20"
            subtitle="Бүх ажилтнуудын дунд"
          />
          <StatCard
            title="Танхимд байгаа хүмүүс"
            value={stats.totalCustomers}
            icon={Users}
            iconColor="text-blue-600 dark:text-blue-400"
            iconBgColor="bg-blue-100 dark:bg-blue-900/20"
            subtitle="Өнөөдрийн хамгийн өндөр"
          />
          <StatCard
            title="Касс хүнтэй байсан хувь"
            value={stats.activeTellers}
            icon={UserCheck}
            iconColor="text-emerald-600 dark:text-emerald-400"
            iconBgColor="bg-emerald-100 dark:bg-emerald-900/20"
            subtitle={`Нийт ${tellers.length}-с`}
          />
        </div>
      </div>

      {/* Customer Flow */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
          Харилцагчдын идэвхтэй цаг
        </h2>
        <CustomerFlowChart />
      </div>
    </div>
  );
}
