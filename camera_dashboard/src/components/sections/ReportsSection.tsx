import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { getReportPeriodSummary } from '@/lib/analyticsBundle';
import { formatDurationHuman, formatPercentage } from '@/lib/utils';

function formatUtc(iso: string): string {
  try {
    return new Date(iso).toLocaleString('mn-MN', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'UTC',
    });
  } catch {
    return iso;
  }
}

export function ReportsSection() {
  const report = getReportPeriodSummary();

  const handlePrint = () => {
    window.print();
  };

  if (!report) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Тайлан
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          analytics.json-д periodSummaries.last7Days олдсонгүй.
        </p>
      </div>
    );
  }

  const { meta, period, counterStaffing, snapshots } = report;

  return (
    <div className="space-y-8 print:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between print:flex-row">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Тайлан
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {meta.referenceDateRange.start} – {meta.referenceDateRange.end} ·{' '}
            {period.daysIncluded} өдөр · schema {meta.schemaVersion}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Үүсгэсэн (UTC): {formatUtc(meta.generatedAtUtc)}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          className="print:hidden shrink-0"
        >
          <Printer className="mr-2 h-4 w-4" />
          Хэвлэх
        </Button>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900/40">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Касс 
        </h3>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-sm text-slate-500 dark:text-slate-400">Хүнтэй цаг</dt>
            <dd className="text-lg font-medium tabular-nums text-slate-900 dark:text-white">
              {formatDurationHuman(counterStaffing.staffedSeconds)} ·{' '}
              {formatPercentage(counterStaffing.staffedPct)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500 dark:text-slate-400">Хүнгүй цаг</dt>
            <dd className="text-lg font-medium tabular-nums text-slate-900 dark:text-white">
              {formatDurationHuman(counterStaffing.unstaffedSeconds)} ·{' '}
              {formatPercentage(counterStaffing.unstaffedPct)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500 dark:text-slate-400">Нийт цаг</dt>
            <dd className="text-lg font-medium tabular-nums text-slate-900 dark:text-white">
              {formatDurationHuman(counterStaffing.totalSegmentSeconds)}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900/40">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
        Үйлчлүүлэгч
        </h3>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-sm text-slate-500 dark:text-slate-400">Өдөр (тоо)</dt>
            <dd className="text-lg font-medium tabular-nums text-slate-900 dark:text-white">
              {snapshots.dayCount}
            </dd>
          </div>
          
          
          <div>
            <dt className="text-sm text-slate-500 dark:text-slate-400">
              Өдрүүдийн хамгийн их хүн (max)
            </dt>
            <dd className="text-lg font-medium tabular-nums text-slate-900 dark:text-white">
              {snapshots.maxPeopleMaxAcrossDays}
            </dd>
          </div>
         
        </dl>
      </section>

      <section className="rounded-lg border border-dashed border-slate-200 p-4 text-xs text-slate-500 dark:border-slate-600 dark:text-slate-400">
        <p className="font-medium text-slate-600 dark:text-slate-300">Оролтын файлууд</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          {meta.bundleDateSuffixes.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
