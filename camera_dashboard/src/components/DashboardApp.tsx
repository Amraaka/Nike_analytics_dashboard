'use client';

import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { LoginPage } from '@/components/auth/LoginPage';
import { OverviewSection } from '@/components/sections/OverviewSection';
import { useAuthStore } from '@/store/authStore';
import { TellersSection } from '@/components/sections/TellersSection';
import { AnalyticsSection } from '@/components/sections/AnalyticsSection';
import { ReportsSection } from '@/components/sections/ReportsSection';
export function DashboardApp() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [activeSection, setActiveSection] = useState('overview');
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    void Promise.resolve(useAuthStore.persist.rehydrate()).then(() =>
      setAuthReady(true)
    );
  }, []);

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p className="text-sm text-slate-500 dark:text-slate-400">Ачааллаж байна…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return <OverviewSection />;
      case 'tellers':
        return <TellersSection />;
      case 'analytics':
        return <AnalyticsSection />;
      case 'reports':
        return <ReportsSection />;
      case 'settings':
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
              Тохиргоо
            </h2>
            <p className="mt-2 text-slate-600 dark:text-slate-400">хоосон</p>
          </div>
        );
      default:
        return <OverviewSection />;
    }
  };

  return (
    <MainLayout activeSection={activeSection} onSectionChange={setActiveSection}>
      {renderSection()}
    </MainLayout>
  );
}
