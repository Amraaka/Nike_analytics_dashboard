import { Activity,  Menu } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { NotificationBell } from './NotificationBell';
import { UserMenu } from './UserMenu';
import { Button } from '@/components/ui/button';

interface AppHeaderProps {
  onMenuClick: () => void;
}

export function AppHeader({ onMenuClick }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white dark:bg-slate-900 shadow-sm">
      <div className="flex h-16 items-center gap-4 px-4 lg:px-6">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo and app name */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              Хяналтын самбар
            </h1>
            
          </div>
        </div>

        {/* Search bar - centered */}
        <div className="hidden md:flex flex-1 justify-center max-w-2xl mx-auto">
          <SearchBar />
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Notifications */}
          <NotificationBell />

          {/* User menu */}
          <UserMenu />
        </div>
      </div>

      {/* Mobile search bar */}
      <div className="md:hidden border-t px-4 py-3">
        <SearchBar />
      </div>
    </header>
  );
}
