import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function formatTimeShort(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 1) return `${seconds}s`;
  return `${minutes}m`;
}

/** Long durations (e.g. counter segment seconds) — Mongolian-style units. */
export function formatDurationHuman(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}ц ${m}м`;
  if (m > 0) return `${m}м ${sec}с`;
  return `${sec}с`;
}

export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

export function getUtilizationColor(utilization: number): string {
  if (utilization < 70) return 'text-red-500';
  if (utilization < 85) return 'text-amber-500';
  return 'text-emerald-500';
}

export function getUtilizationBgColor(utilization: number): string {
  if (utilization < 70) return 'bg-red-100 dark:bg-red-900/20';
  if (utilization < 85) return 'bg-amber-100 dark:bg-amber-900/20';
  return 'bg-emerald-100 dark:bg-emerald-900/20';
}
