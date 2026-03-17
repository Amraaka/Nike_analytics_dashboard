"use client";

import { useState } from "react";

type HourEntry = {
  hour: string;
  staffed_seconds: number;
  unstaffed_seconds: number;
  staffed_percent: number;
  unstaffed_percent: number;
};

type StaffingData = {
  hours: HourEntry[];
  summary: {
    total_staffed_seconds: number;
    total_unstaffed_seconds: number;
    staffed_percent: number;
    unstaffed_percent: number;
  };
};

type Props = { staffing: StaffingData };

const STAFFED_COLOR = "#10b981"; // emerald-500
const UNSTAFFED_COLOR = "#f43f5e"; // rose-500

export default function StaffingPieChart({ staffing }: Props) {
  const [mode, setMode] = useState<"summary" | "hour">("summary");
  const [selectedHour, setSelectedHour] = useState("");

  const activeHours = staffing.hours.filter(
    (h) => h.staffed_seconds > 0 || h.unstaffed_seconds > 0
  );
  const hour =
    selectedHour && activeHours.some((h) => h.hour === selectedHour)
      ? selectedHour
      : activeHours[0]?.hour ?? "09:00";

  const data =
    mode === "summary"
      ? {
          staffed: staffing.summary.staffed_percent,
          unstaffed: staffing.summary.unstaffed_percent,
          label: "Нийт",
        }
      : (() => {
          const h = staffing.hours.find((x) => x.hour === hour);
          if (!h) return { staffed: 0, unstaffed: 0, label: hour };
          return {
            staffed: h.staffed_percent,
            unstaffed: h.unstaffed_percent,
            label: hour,
          };
        })();

  const total = data.staffed + data.unstaffed;
  const staffedPct = total > 0 ? (data.staffed / total) * 100 : 0;
  const unstaffedPct = total > 0 ? (data.unstaffed / total) * 100 : 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">
        Касс
      </h2>
      <p className="mb-4 text-xs text-slate-500">
        Ажилтантай / ажилтангүй хугацааны хувь.
      </p>

      {/* Filter tabs */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-slate-200 p-0.5">
          <button
            type="button"
            onClick={() => setMode("summary")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === "summary"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Хураангуй
          </button>
          <button
            type="button"
            onClick={() => setMode("hour")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === "hour"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Цагаар
          </button>
        </div>
        {mode === "hour" && (
          <select
            value={hour}
            onChange={(e) => setSelectedHour(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            {activeHours.map((h) => (
              <option key={h.hour} value={h.hour}>
                {h.hour}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Pie chart */}
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <div
          className="h-48 w-48 shrink-0 rounded-full"
          style={{
            background: `conic-gradient(
              ${STAFFED_COLOR} 0deg ${staffedPct * 3.6}deg,
              ${UNSTAFFED_COLOR} ${staffedPct * 3.6}deg 360deg
            )`,
          }}
        />
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: STAFFED_COLOR }}
            />
            <span className="text-sm text-slate-700">
              Ажилтантай: <strong>{data.staffed.toFixed(1)}%</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: UNSTAFFED_COLOR }}
            />
            <span className="text-sm text-slate-700">
              Ажилтангүй: <strong>{data.unstaffed.toFixed(1)}%</strong>
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {mode === "summary"
              ? "Бүх үйл ажиллагааны цагийн нийт"
              : `${data.label} цагийн хураангуй`}
          </p>
        </div>
      </div>
    </section>
  );
}
