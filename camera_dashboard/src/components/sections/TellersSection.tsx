import { useState } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';
import { TellerCard } from '@/components/cards/TellerCard';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';

type StatusFilter = 'all' | 'active' | 'idle';

export function TellersSection() {
  const { tellers, lastUpdate } = useDashboardStore();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filteredTellers = tellers.filter((teller) => {
    if (statusFilter === 'active') return teller.currentCustomer;
    if (statusFilter === 'idle') return !teller.currentCustomer;
    return true;
  });

  const activeCount = tellers.filter((t) => t.currentCustomer).length;
  const idleCount = tellers.filter((t) => !t.currentCustomer).length;

  return (
    <div className="space-y-8">
      {/* Header with live indicator */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Шууд ажилтнуудын төлөв
          </h2>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></div>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Сүүлд шинэчилсэн: {format(lastUpdate, 'HH:mm:ss')}
            </span>
          </div>
        </div>

        {/* Status Filter */}
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <TabsList>
            <TabsTrigger value="all">
              Бүгд ({tellers.length})
            </TabsTrigger>
            <TabsTrigger value="active">
              Идэвхтэй ({activeCount})
            </TabsTrigger>
            <TabsTrigger value="idle">
              Идэвхгүй ({idleCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Teller Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredTellers.map((teller) => (
          <TellerCard key={teller.id} teller={teller} />
        ))}
      </div>

      {filteredTellers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Одоогийн шүүлтүүрт тохирох ажилтан алга
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Өөр төлөвийн шүүлтүүр сонгож үзнэ үү
          </p>
        </div>
      )}
    </div>
  );
}
