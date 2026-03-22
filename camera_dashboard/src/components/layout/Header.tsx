import { useDashboardStore } from '@/store/dashboardStore';
import { format } from 'date-fns';
import { Activity } from 'lucide-react';

export function Header() {
  const lastUpdate = useDashboardStore((state) => state.lastUpdate);

  return (
    <header className="border-b bg-white dark:bg-slate-900">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/20">
              <Activity className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Teller Activity Dashboard
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Real-time monitoring and analytics
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Live
              </span>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 dark:text-slate-400">Last update</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {format(lastUpdate, 'HH:mm:ss')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
