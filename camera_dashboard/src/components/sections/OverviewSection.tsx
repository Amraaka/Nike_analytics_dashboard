import { useMemo } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';
import { StatCard } from '@/components/cards/StatCard';
import { CustomerFlowChart } from '@/components/charts/CustomerFlowChart';
import { MetricAlert } from '@/components/alerts/MetricAlert';
import { Users, UserCheck, Clock, Activity } from 'lucide-react';
import { formatTime } from '@/lib/utils';

export function OverviewSection() {
  const { tellers, hallMetrics } = useDashboardStore();

  const stats = useMemo(() => {
    const activeTellers = tellers.filter((t) => t.isActive).length;
    const totalCustomers = tellers.reduce((sum, t) => sum + t.customersServed, 0);
    const avgServiceTime = Math.round(
      tellers.reduce((sum, t) => sum + t.averageServiceTime, 0) / tellers.length
    );
    const avgUtilization = Math.round(
      tellers.reduce((sum, t) => sum + t.utilization, 0) / tellers.length
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
        type: 'warning' as const,
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
        type: 'warning' as const,
        message: `${overworkedTellers.length} ажилтны ачаалал 95%+ байна — ачааллыг тэнцвэржүүлэхийг зөвлөе`,
      });
    }

    return alertsList;
  }, [hallMetrics, tellers]);

  return (
    <div className="space-y-8">
      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
              Идэвхтэй анхааруулгууд
            </h2>
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <MetricAlert key={index} type={alert.type} message={alert.message} />
            ))}
          </div>
        </div>
      )}

      {/* Overview Stats */}
      <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            Тойм мэдээлэл
          </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
              title="Касс хүнтэй байсан хувь"
            value={stats.activeTellers}
            icon={UserCheck}
            iconColor="text-emerald-600 dark:text-emerald-400"
            iconBgColor="bg-emerald-100 dark:bg-emerald-900/20"
              subtitle={`Нийт ${tellers.length}-с`}
          />
          <StatCard
              title="Үйлчлүүлсэн харилцагчид"
            value={stats.totalCustomers}
            icon={Users}
            iconColor="text-blue-600 dark:text-blue-400"
            iconBgColor="bg-blue-100 dark:bg-blue-900/20"
              subtitle="Өнөөдрийн нийт"
          />
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
        </div>
      </div>

      {/* Customer Flow */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
          Харилцагчдын идэвхтэй цаг
        </h2>
        <CustomerFlowChart />
      </div>

      {/* Quick Insights */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
          Шуурхай мэдээлэл
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* <div className="rounded-lg border bg-white dark:bg-slate-800 p-6">
            <p className="text-sm text-slate-600 dark:text-slate-400">Дундаж ашиглалт</p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
              {stats.avgUtilization}%
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {stats.avgUtilization >= 85 ? 'Онцгой' : stats.avgUtilization >= 70 ? 'Сайн' : 'Сайжруулах шаардлагатай'}
            </p>
          </div> */}
          <div className="rounded-lg border bg-white dark:bg-slate-800 p-6">
            <p className="text-sm text-slate-600 dark:text-slate-400">Хамгийн ачаалалтай ажилтан</p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
              {tellers.reduce((max, t) => (t.customersServed > max.customersServed ? t : max), tellers[0])?.id}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {tellers.reduce((max, t) => (t.customersServed > max.customersServed ? t : max), tellers[0])?.customersServed} харилцагч
            </p>
          </div>
          <div className="rounded-lg border bg-white dark:bg-slate-800 p-6">
            <p className="text-sm text-slate-600 dark:text-slate-400">Одоогоор үйлчилж буй</p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
              {tellers.filter((t) => t.currentCustomer).length}
            </p>
            <p className="mt-1 text-xs text-slate-500">Идэвхтэй гүйлгээ</p>
          </div>
        </div>
      </div>
    </div>
  );
}
