import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricAlertProps {
  type: 'critical' | 'warning' | 'info';
  message: string;
  className?: string;
}

export function MetricAlert({ type, message, className }: MetricAlertProps) {
  const config = {
    critical: {
      icon: AlertCircle,
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      textColor: 'text-red-700 dark:text-red-400',
      iconColor: 'text-red-600 dark:text-red-500',
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      borderColor: 'border-amber-200 dark:border-amber-800',
      textColor: 'text-amber-700 dark:text-amber-400',
      iconColor: 'text-amber-600 dark:text-amber-500',
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-700 dark:text-blue-400',
      iconColor: 'text-blue-600 dark:text-blue-500',
    },
  };

  const { icon: Icon, bgColor, borderColor, textColor, iconColor } = config[type];

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border p-4',
        bgColor,
        borderColor,
        className
      )}
    >
      <Icon className={cn('h-5 w-5 flex-shrink-0', iconColor)} />
      <p className={cn('text-sm font-medium', textColor)}>{message}</p>
    </div>
  );
}
