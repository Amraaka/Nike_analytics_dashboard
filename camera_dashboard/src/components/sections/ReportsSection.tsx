import { TellerMetricsTable } from '@/components/tables/TellerMetricsTable';
import { TimeFilter } from '@/components/layout/TimeFilter';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

export function ReportsSection() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      {/* Header with actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Дэлгэрэнгүй тайлан
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Ажилтнуудын гүйцэтгэлийн мэдээллийг экспортолж, шинжилнэ үү
          </p>
        </div>
        <div className="flex items-center gap-3">
          <TimeFilter />
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Хэвлэх
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-white dark:bg-slate-800 p-6">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Нийт үүсгэсэн тайлан
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            247
          </p>
          <p className="mt-1 text-xs text-slate-500">Энэ сар</p>
        </div>
        <div className="rounded-lg border bg-white dark:bg-slate-800 p-6">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Дундаж хариу өгөх хугацаа
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            4.2м
          </p>
          <p className="mt-1 text-xs text-slate-500">Бүх ажилтнуудын дунд</p>
        </div>
        <div className="rounded-lg border bg-white dark:bg-slate-800 p-6">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Харилцагчийн сэтгэл ханамж
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            92%
          </p>
          <p className="mt-1 text-xs text-slate-500">Санал хүсэлтэд үндэслэв</p>
        </div>
      </div>

      {/* Metrics Table */}
      <div>
        <TellerMetricsTable />
      </div>
    </div>
  );
}
