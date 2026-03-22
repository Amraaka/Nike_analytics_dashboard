"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import type { TooltipItem } from "chart.js";
import {
  getCounterStaffingHourly,
  getOverviewDayOptions,
  type OverviewDayKey,
} from "@/lib/analyticsBundle";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

/** Short x-axis label so each slot is one calendar hour (avoids Chart.js category quirks). */
function hourSlotLabel(hour: number): string {
  const h = String(hour).padStart(2, "0");
  return `${h}:00`;
}

export function CounterStaffingHourlyChart() {
  const dayOptions = useMemo(() => getOverviewDayOptions(), []);
  const [dayKey, setDayKey] = useState<OverviewDayKey>("overall");

  const hourly = useMemo(() => getCounterStaffingHourly(dayKey), [dayKey]);

  const data = useMemo(
    () => ({
      labels: hourly.map((row) => hourSlotLabel(row.hour)),
      datasets: [
        {
          label: "Хүнтэй (касс)",
          data: hourly.map((h) => h.staffedPct),
          backgroundColor: "rgba(16, 185, 129, 0.88)",
          borderRadius: 4,
          stack: "pct",
        },
        {
          label: "Хүнгүй (касс)",
          data: hourly.map((h) => h.unstaffedPct),
          backgroundColor: "rgba(148, 163, 184, 0.88)",
          borderRadius: 4,
          stack: "pct",
        },
      ],
    }),
    [hourly],
  );

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: false,
      },
      tooltip: {
        enabled: true,
        mode: "index" as const,
        intersect: false,
        callbacks: {
          title: function (items: TooltipItem<"bar">[]) {
            const idx = items[0]?.dataIndex;
            if (idx === undefined || !hourly[idx]) return "";
            const row = hourly[idx];
            return `${hourSlotLabel(row.hour)} · ${row.label}`;
          },
          label: function (ctx: TooltipItem<"bar">) {
            const v = ctx.parsed.y;
            if (v == null) return "";
            const pct = Number(v);
            return `${ctx.dataset.label ?? ""}: ${pct.toFixed(1)}%`;
          },
        },
      },
    },
    datasets: {
      bar: {
        categoryPercentage: 0.75,
        barPercentage: 0.9,
      },
    },
    scales: {
      x: {
        stacked: false,
        offset: true,
        ticks: {
          maxRotation: 45,
          minRotation: 0,
        },
        title: {
          display: true,
          text: "Цаг (эхлэл)",
        },
      },
      y: {
        stacked: true,
        min: 0,
        max: 100,
        title: {
          display: true,
          text: "Сегментийн хувь (%)",
        },
        ticks: {
          callback: function (value: string | number) {
            return `${Number(value)}%`;
          },
        },
      },
    },
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Цаг тутам: хүнтэй / хүнгүй</CardTitle>
        </div>
        <Tabs
          value={dayKey}
          onValueChange={(v) => setDayKey(v as OverviewDayKey)}
          className="w-full sm:w-auto"
        >
          <TabsList className="flex h-auto w-full flex-wrap justify-end gap-1 bg-muted/80 p-1">
            {dayOptions.map((opt) => (
              <TabsTrigger
                key={opt.key}
                value={opt.key}
                className="shrink-0 px-2 text-xs sm:px-3 sm:text-sm"
              >
                {opt.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="h-[340px]">
          <Bar data={data} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}
