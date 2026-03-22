import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

const mockNotifications = [
  {
    id: 2,
    title: 'Танхимын багтаамжийн анхааруулга',
    message: 'Танхимд 42 хүн байна - хязгаараас давсан',
    time: '5 минутын өмнө',
    type: 'alert',
  },
  {
    id: 3,
    title: 'Ашиглалт бага байна',
    message: 'Дундаж ашиглалт 70%-аас доош боллоо',
    time: '15 минутын өмнө',
    type: 'info',
  },
];

export function NotificationBell() {
  const unreadCount = mockNotifications.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          <Badge variant="secondary">{unreadCount} new</Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {mockNotifications.map((notification) => (
          <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-3 cursor-pointer">
            <div className="flex w-full items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium">{notification.title}</p>
                <p className="text-xs text-slate-500 mt-1">{notification.message}</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">{notification.time}</p>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-center text-sm text-emerald-600 cursor-pointer justify-center">
          Бүгдийг үзэх
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
