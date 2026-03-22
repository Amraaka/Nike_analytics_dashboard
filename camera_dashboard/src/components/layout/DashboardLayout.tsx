import { ReactNode } from 'react';
import { Header } from './Header';
import { TimeFilter } from './TimeFilter';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <TimeFilter />
        </div>
        {children}
      </div>
    </div>
  );
}
