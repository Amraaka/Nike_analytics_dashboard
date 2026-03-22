import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
import { TellerData } from '@/types/camera.types';
import { formatTime } from '@/lib/utils';
import { User, Clock, Users } from 'lucide-react';

interface TellerCardProps {
  teller: TellerData;
}

export function TellerCard({ teller }: TellerCardProps) {
  const statusColor = teller.currentCustomer
    ? 'bg-emerald-500'
    : 'bg-slate-400';
  
  // const utilizationColor = getUtilizationColor(teller.utilization);

  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-md">
      {teller.currentCustomer && (
        <div className="absolute right-0 top-0 h-full w-1 bg-emerald-500 animate-pulse"></div>
      )}
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${statusColor} ${teller.currentCustomer ? 'animate-pulse' : ''}`}></div>
            <CardTitle className="text-base font-semibold">{teller.id}</CardTitle>
          </div>
          {/* <Badge
            variant={
              teller.utilization >= 85
                ? 'success'
                : teller.utilization >= 70
                ? 'warning'
                : 'error'
            }
          >
            {formatPercentage(teller.utilization)}
          </Badge> */}
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{teller.name}</p>
      </CardHeader>
      <CardContent className="space-y-3 pb-6">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
            <User className="h-4 w-4" />
            Төлөв
          </span>
          <span className="font-medium text-slate-900 dark:text-white">
            {teller.currentCustomer ? 'Serving' : 'Idle'}
          </span>
        </div>
        
        {teller.currentCustomer && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
              <Clock className="h-4 w-4" />
            Хугацаа
            </span>
            <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
              {formatTime(teller.currentServiceTime)}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
            <Users className="h-4 w-4" />
            Харилцагч
          </span>
          <span className="font-medium text-slate-900 dark:text-white">
            {teller.customersServed}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">Дундаж хугацаа</span>
          <span className="font-medium text-slate-900 dark:text-white">
            {formatTime(teller.averageServiceTime)}
          </span>
        </div>

        {/* <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Utilization</span>
            <span className={`font-semibold ${utilizationColor}`}>
              {formatPercentage(teller.utilization)}
            </span>
          </div>
        </div> */}
      </CardContent>
    </Card>
  );
}
