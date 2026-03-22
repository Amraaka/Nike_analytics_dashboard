"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  getCustomerDwellShareByPeople,
  getOverviewDayOptions,
  type OverviewDayKey,
} from "@/lib/analyticsBundle";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const commonTooltip = {
  callbacks: {
    label: function (ctx: TooltipItem<"bar">) {
      const v = ctx.parsed.y;
      if (v == null) return "";
      return `${ctx.dataset.label ?? ""}: ${Number(v).toFixed(2)}%`;
    },
  },
};

export function CustomerDwellShareCharts() {
  const dayOptions = useMemo(() => getOverviewDayOptions(), []);
  const [dayKey, setDayKey] = useState<OverviewDayKey>("overall");

  const dwell = useMemo(
    () => getCustomerDwellShareByPeople(dayKey),
    [dayKey],
  );

  const atLeastData = useMemo(() => {
    if (!dwell) return null;
    const rows = dwell.pctAtLeastSeconds;
    return {
      labels: rows.map((r) => r.label),
      datasets: [
        {
          label: "Хүмүүсийн хувь (≥)",
          data: rows.map((r) => r.pctOfPeople),
          backgroundColor: "rgba(16, 185, 129, 0.75)",
          borderRadius: 4,
        },
      ],
    };
  }, [dwell]);

  const barOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index" as const, intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: commonTooltip,
      },
      scales: {
        x: {
          ticks: { maxRotation: 45, minRotation: 35 },
          title: { display: true, text: "Доод хязгаар (дор хаяж)" },
        },
        y: {
          min: 0,
          max: 100,
          title: { display: true, text: "Хувь (%)" },
          ticks: {
            callback: (v: string | number) => `${Number(v)}%`,
          },
        },
      },
    }),
    [],
  );

  if (!dwell || !atLeastData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Үйлчлүүлэгчийн давхцах хугацаа (хүмүүсийн хувь)</CardTitle>
          <CardDescription>
            customerDwellShareByPeople өгөгдөл analytics.json-д олдсонгүй.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle>Үйлчлүүлэгчдийн хугацаа</CardTitle>
         
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
        <h4 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          Доод хязгаар (≥): дор хаяж энэ хугацаа
        </h4>
        <div className="h-[280px]">
          <Bar data={atLeastData} options={barOptions} />        </div>
      </CardContent>
    </Card>
  );
}
