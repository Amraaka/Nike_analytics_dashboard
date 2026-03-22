import { Home, Users, BarChart3, FileText, Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const navigationItems = [
  { id: 'overview', label: 'Тойм', icon: Home },
  { id: 'tellers', label: 'Ажилтнууд', icon: Users },
  { id: 'analytics', label: 'Статистик', icon: BarChart3 },
  { id: 'reports', label: 'Тайлан', icon: FileText },
  { id: 'settings', label: 'Тохиргоо', icon: Settings },
];

export function Sidebar({ activeSection, onSectionChange, isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r bg-white dark:bg-slate-900 transition-transform duration-300 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Close button for mobile */}
          <div className="flex items-center justify-between border-b p-4 lg:hidden">
            <h2 className="font-semibold text-slate-900 dark:text-white">Цэс</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSectionChange(item.id);
                    onClose();
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                  {isActive && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          {/* <div className="border-t p-4">
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-4">
              <p className="text-xs font-medium text-slate-900 dark:text-white">
                Системийн төлөв
              </p>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Бүх систем хэвийн ажиллаж байна
                </p>
              </div>
            </div>
          </div> */}
        </div>
      </aside>
    </>
  );
}
