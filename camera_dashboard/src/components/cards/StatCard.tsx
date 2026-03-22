import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
  iconColor?: string;
  iconBgColor?: string;
  trend?: ReactNode;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
  iconColor = 'text-blue-600',
  iconBgColor = 'bg-blue-100 dark:bg-blue-900/20',
  trend,
}: StatCardProps) {
  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          {title}
        </CardTitle>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBgColor}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent className="pb-6">
        <div className="text-4xl font-bold text-slate-900 dark:text-white">{value}</div>
        {subtitle && (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        )}
        {trend && <div className="mt-3">{trend}</div>}
      </CardContent>
    </Card>
  );
}
