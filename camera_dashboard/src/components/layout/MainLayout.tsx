import { ReactNode, useState } from 'react';
import { AppHeader } from './AppHeader';
import { Sidebar } from './Sidebar';

interface MainLayoutProps {
  children: ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function MainLayout({ children, activeSection, onSectionChange }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <AppHeader onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar
        activeSection={activeSection}
        onSectionChange={onSectionChange}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="lg:pl-64 pt-0">
        <div className="container mx-auto p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
