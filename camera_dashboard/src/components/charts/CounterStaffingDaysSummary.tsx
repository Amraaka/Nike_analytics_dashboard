"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCounterStaffingDaySummaries } from "@/lib/analyticsBundle";
import { formatDurationHuman, formatPercentage } from "@/lib/utils";

export function CounterStaffingDaysSummary() {
  const { days, overall } = useMemo(() => getCounterStaffingDaySummaries(), []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Өдрөөр: касс хүнтэй / хүнгүй</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">
          Сегментийн нийлбэр — өдөр тус бүр болон бүх хугацааны нийлбэр
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border border-slate-200 dark:border-slate-700">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                <th className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-200">
                  Өдөр
                </th>
                <th className="px-3 py-2 font-semibold text-emerald-700 dark:text-emerald-400">
                  Хүнтэй
                </th>
                <th className="px-3 py-2 font-semibold text-slate-600 dark:text-slate-400">
                  Хүнгүй
                </th>
                <th className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-200">
                  Нийт сегмент
                </th>
                <th className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-200">
                  Хүнтэй %
                </th>
                <th className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-200">
                  Хүнгүй %
                </th>
              </tr>
            </thead>
            <tbody>
              {days.map((row) => (
                <tr
                  key={row.referenceDate}
                  className="border-b border-slate-100 dark:border-slate-800"
                >
                  <td className="px-3 py-2.5 text-slate-900 dark:text-slate-100">
                    {row.label}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums text-emerald-700 dark:text-emerald-400">
                    {formatDurationHuman(row.staffedSeconds)}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums text-slate-600 dark:text-slate-400">
                    {formatDurationHuman(row.unstaffedSeconds)}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums text-slate-800 dark:text-slate-200">
                    {formatDurationHuman(row.totalSegmentSeconds)}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums">
                    {formatPercentage(row.staffedPct)}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums">
                    {formatPercentage(row.unstaffedPct)}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-slate-300 bg-slate-50/80 font-medium dark:border-slate-600 dark:bg-slate-800/80">
                <td className="px-3 py-2.5 text-slate-900 dark:text-slate-100">
                  {overall.label}
                </td>
                <td className="px-3 py-2.5 tabular-nums text-emerald-700 dark:text-emerald-400">
                  {formatDurationHuman(overall.staffedSeconds)}
                </td>
                <td className="px-3 py-2.5 tabular-nums text-slate-600 dark:text-slate-400">
                  {formatDurationHuman(overall.unstaffedSeconds)}
                </td>
                <td className="px-3 py-2.5 tabular-nums text-slate-800 dark:text-slate-200">
                  {formatDurationHuman(overall.totalSegmentSeconds)}
                </td>
                <td className="px-3 py-2.5 tabular-nums">
                  {formatPercentage(overall.staffedPct)}
                </td>
                <td className="px-3 py-2.5 tabular-nums">
                  {formatPercentage(overall.unstaffedPct)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
