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
import { formatDurationHuman } from "@/lib/utils";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export function CounterStaffingHourlyChart() {
  const dayOptions = useMemo(() => getOverviewDayOptions(), []);
  const [dayKey, setDayKey] = useState<OverviewDayKey>("overall");

  const hourly = useMemo(() => getCounterStaffingHourly(dayKey), [dayKey]);

  const data = useMemo(
    () => ({
      labels: hourly.map((h) => h.label),
      datasets: [
        {
          label: "Хүнтэй (касс)",
          data: hourly.map((h) => h.staffedSeconds),
          backgroundColor: "rgba(16, 185, 129, 0.85)",
          borderRadius: 4,
          stack: "seg",
        },
        {
          label: "Хүнгүй (касс)",
          data: hourly.map((h) => h.unstaffedSeconds),
          backgroundColor: "rgba(148, 163, 184, 0.85)",
          borderRadius: 4,
          stack: "seg",
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
        callbacks: {
          label: function (ctx: TooltipItem<"bar">) {
            const v = ctx.parsed.y;
            if (v == null) return "";
            return `${ctx.dataset.label ?? ""}: ${formatDurationHuman(v)}`;
          },
          footer: function (items: TooltipItem<"bar">[]) {
            const sum = items.reduce(
              (acc, i) =>
                acc + (typeof i.parsed.y === "number" ? i.parsed.y : 0),
              0,
            );
            return `Нийт: ${formatDurationHuman(sum)}`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
        title: {
          display: true,
          text: "Цагийн интервал",
        },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        title: {
          display: true,
          text: "Сегментийн хугацаа (сек)",
        },
        ticks: {
          callback: function (value: string | number) {
            return formatDurationHuman(Number(value));
          },
        },
      },
    },
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Цагийн касс: хүнтэй / хүнгүй</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Сегментийн нийлбэр хугацаа (цаг бүрт) — нэмэлт хугацаа
          </p>
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
