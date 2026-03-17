"use client";

import { useEffect, useState } from "react";
import { Clock3, Eye, UserRoundCog } from "lucide-react";

/* ── Types ─────────────────────────────────────────────────────── */

type DwellData = {
  source_file: string;
  quality: Record<string, unknown>;
  summary_by_role: Record<
    "customer" | "worker" | "all",
    {
      count: number;
      min_seconds: number;
      p50_seconds: number;
      p90_seconds: number;
      p95_seconds: number;
      max_seconds: number;
    }
  >;
  buckets: {
    bucket: string;
    customer_count: number;
    worker_count: number;
    total_count: number;
  }[];
};

type StaffingData = {
  hours: {
    hour: string;
    staffed_seconds: number;
    unstaffed_seconds: number;
    staffed_percent: number;
    unstaffed_percent: number;
  }[];
  summary: {
    total_staffed_seconds: number;
    total_unstaffed_seconds: number;
    staffed_percent: number;
    unstaffed_percent: number;
  };
};

type VisitorData = {
  zones: string[];
  camera_ids: string[];
  hours: string[];
  by_camera_hour: { camera_id: string; hour: string; avg_count_raw: number }[];
  zone_hour: { zone: string; hour: string; avg_count_raw: number }[];
  hourly_average: {
    hour: string;
    avg_count_raw: number;
    total_count: number;
  }[];
};

type DashboardData = {
  dwell: DwellData;
  staffing: StaffingData;
  visitors: VisitorData;
};

/* ── Helpers ───────────────────────────────────────────────────── */

const numFmt = new Intl.NumberFormat("mn-MN");

function fmtDur(s: number) {
  if (s >= 3600) return `${(s / 3600).toFixed(1)}ц`;
  if (s >= 60) return `${(s / 60).toFixed(1)}мин`;
  return `${s.toFixed(0)}сек`;
}

const STAFFED_COLOR = "#10b981";
const UNSTAFFED_COLOR = "#f43f5e";
const CAM_HEX: Record<string, string> = {
  cam1: "#38bdf8",
  cam2: "#fbbf24",
  cam3: "#0e7490",
};
const CAM_LABEL: Record<string, string> = {
  cam1: "Дотор заал",
  cam2: "Касс",
  cam3: "Зүүн урд камер",
};
const CHART_H = 192;
const roleLabels = {
  customer: "Үйлчлүүлэгч",
  worker: "Ажилтан",
  all: "Нийт",
} as const;

/* ── Page ──────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [staffingMode, setStaffingMode] = useState<"summary" | "hour">(
    "summary",
  );
  const [staffingHour, setStaffingHour] = useState("");

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

  if (!data) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-slate-500">
        Ачааллаж байна...
      </div>
    );
  }

  const { dwell, staffing, visitors } = data;
  const peakHour = visitors.hourly_average.reduce((a, b) =>
    b.avg_count_raw > a.avg_count_raw ? b : a,
  );
  const maxCustomerBucket = Math.max(
    ...dwell.buckets.map((b) => b.customer_count),
    1,
  );
  const maxZoneHour = Math.max(
    ...visitors.zone_hour.map((e) => e.avg_count_raw),
    1,
  );
  const heatMap = new Map(
    visitors.zone_hour.map((e) => [`${e.zone}:${e.hour}`, e.avg_count_raw]),
  );
  const camHourMap = new Map(
    visitors.by_camera_hour.map((e) => [
      `${e.camera_id}:${e.hour}`,
      e.avg_count_raw,
    ]),
  );
  const cameras = visitors.camera_ids;
  const maxHourlySum = Math.max(
    ...visitors.hours.map((hr) =>
      cameras.reduce(
        (sum, cam) => sum + (camHourMap.get(`${cam}:${hr}`) ?? 0),
        0,
      ),
    ),
    1,
  );

  const activeStaffingHours = staffing.hours.filter(
    (h) => h.staffed_seconds > 0 || h.unstaffed_seconds > 0,
  );
  const staffingHourVal =
    staffingHour && activeStaffingHours.some((h) => h.hour === staffingHour)
      ? staffingHour
      : (activeStaffingHours[0]?.hour ?? "09:00");
  const staffingData =
    staffingMode === "summary"
      ? {
          staffed: staffing.summary.staffed_percent,
          unstaffed: staffing.summary.unstaffed_percent,
          label: "Нийт",
        }
      : (() => {
          const h = staffing.hours.find((x) => x.hour === staffingHourVal);
          if (!h) return { staffed: 0, unstaffed: 0, label: staffingHourVal };
          return {
            staffed: h.staffed_percent,
            unstaffed: h.unstaffed_percent,
            label: staffingHourVal,
          };
        })();
  const staffedPct =
    staffingData.staffed + staffingData.unstaffed > 0
      ? (staffingData.staffed /
          (staffingData.staffed + staffingData.unstaffed)) *
        100
      : 0;

  return (
    <div className="space-y-6">
      {/* ═══════════ TOP: Metric Cards ═══════════ */}
      <section className="grid gap-3 grid-cols-2 lg:grid-cols-3">
        {[
          {
            label: "Үйлчлүүлсэн дундаж хугацаа",
            value: fmtDur(dwell.summary_by_role.customer.p50_seconds),
            Icon: Clock3,
          },
          {
            label: "Касс хүнтэй байсан %",
            value: `${staffing.summary.staffed_percent.toFixed(1)}%`,
            sub: `${fmtDur(staffing.summary.total_staffed_seconds)} ажилтантай / ${fmtDur(staffing.summary.total_unstaffed_seconds)} ажилтангүй`,
            Icon: UserRoundCog,
          },
          {
            label: "Оргил цаг",
            value: peakHour.hour,
            sub: `${peakHour.avg_count_raw.toFixed(2)} дундаж`,
            Icon: Eye,
          },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                {c.label}
              </span>
              <span className="rounded-full bg-cyan-50 p-2 text-cyan-600">
                <c.Icon className="h-4 w-4" />
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{c.value}</p>
            {"sub" in c && c.sub && (
              <p className="mt-1 text-xs text-slate-500">{c.sub}</p>
            )}
          </div>
        ))}
      </section>

      {/* ═══════════ 1. Hourly Visitor Bar Chart ═══════════ */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-12 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            Цаг тутмын дундаж үйлчлүүлэгчийн тархалт (камерын бүсээр)
          </h2>
          <div className="flex items-center gap-3">
            {cameras.map((cam) => (
              <div key={cam} className="flex items-center gap-1">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-sm"
                  style={{ backgroundColor: CAM_HEX[cam] ?? "#94a3b8" }}
                />
                <span className="text-[10px] text-slate-500">
                  {CAM_LABEL[cam] ?? cam}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative flex h-48 items-end gap-1">
          {visitors.hours.map((hr) => {
            const segments = cameras.map((cam) => ({
              cam,
              value: camHourMap.get(`${cam}:${hr}`) ?? 0,
            }));
            const total = segments.reduce((s, seg) => s + seg.value, 0);
            const barH = Math.max((total / maxHourlySum) * CHART_H, 6);
            return (
              <div
                key={hr}
                className="group relative flex flex-1 flex-col items-center justify-end"
              >
                <div
                  className="flex w-full flex-col overflow-hidden rounded-t"
                  style={{ height: `${barH}px` }}
                >
                  {[...segments].reverse().map((seg) => (
                    <div
                      key={seg.cam}
                      style={{
                        flex: seg.value || 0.001,
                        backgroundColor: CAM_HEX[seg.cam] ?? "#94a3b8",
                      }}
                    />
                  ))}
                </div>
                <span className="absolute -top-6 z-10 hidden whitespace-nowrap rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-white group-hover:block">
                  {hr} ·{" "}
                  {segments
                    .map(
                      (s) =>
                        `${CAM_LABEL[s.cam] ?? s.cam}: ${s.value.toFixed(2)}`,
                    )
                    .join(" · ")}
                </span>
                <span className="mt-1 text-[10px] text-slate-400">
                  {hr.slice(0, 2)}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ═══════════ 2. Staffing Coverage (Pie Chart) ───────────────── */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Касс</h2>
          <p className="mb-4 text-xs text-slate-500">
            Ажилтантай / ажилтангүй хугацааны хувь.
          </p>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="flex rounded-lg border border-slate-200 p-0.5">
              <button
                type="button"
                onClick={() => setStaffingMode("summary")}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  staffingMode === "summary"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Хураангуй
              </button>
              <button
                type="button"
                onClick={() => setStaffingMode("hour")}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  staffingMode === "hour"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Цагаар
              </button>
            </div>
            {staffingMode === "hour" && (
              <select
                value={staffingHourVal}
                onChange={(e) => setStaffingHour(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                {activeStaffingHours.map((h) => (
                  <option key={h.hour} value={h.hour}>
                    {h.hour}
                  </option>
                ))}
              </select>
            )}
          </div>
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
                  Ажилтантай:{" "}
                  <strong>{staffingData.staffed.toFixed(1)}%</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: UNSTAFFED_COLOR }}
                />
                <span className="text-sm text-slate-700">
                  Ажилтангүй:{" "}
                  <strong>{staffingData.unstaffed.toFixed(1)}%</strong>
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {staffingMode === "summary"
                  ? "Бүх үйл ажиллагааны цагийн нийт"
                  : `${staffingData.label} цагийн хураангуй`}
              </p>
            </div>
          </div>
        </section>

        {/* ═══════════ 3. Dwell Duration Distribution ═══════════ */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">
            Үйлчлүүлэгчийн хугацааны тархалт
          </h2>
          <p className="mb-4 text-xs text-slate-500">
            Хугацааны ангилал бүрт үйлчлүүлэгчийн тоо.
          </p>
          <div className="space-y-2">
            {dwell.buckets
              .filter((b) => b.customer_count > 0)
              .map((b) => {
                const w = (b.customer_count / maxCustomerBucket) * 100;
                return (
                  <div key={b.bucket} className="flex items-center gap-3">
                    <span className="w-20 shrink-0 text-right text-xs font-medium text-slate-600">
                      {b.bucket}
                    </span>
                    <div className="flex-1">
                      <div
                        className="flex h-5 overflow-hidden rounded bg-cyan-500"
                        style={{ width: `${Math.max(w, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </section>
      </div>

      {/* ═══════════ 4. Camera Zone Heatmap ═══════════ */}
      <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Тархалт</h2>
        <p className="mb-4 text-xs text-slate-500">
          Худалдан авагчийн Дундаж тархалт
        </p>
        <table className="w-full border-separate border-spacing-1 text-xs">
          <thead>
            <tr>
              <th className="px-2 py-1 text-left font-semibold text-slate-500">
                Бүс
              </th>
              {visitors.hours.map((hr) => (
                <th
                  key={hr}
                  className="px-2 py-1 text-right font-semibold text-slate-500"
                >
                  {hr.slice(0, 2)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visitors.zones.map((zone) => (
              <tr key={zone}>
                <td className="rounded bg-slate-50 px-2 py-1 font-semibold text-slate-700">
                  {CAM_LABEL[zone] ?? zone}
                </td>
                {visitors.hours.map((hr) => {
                  const v = heatMap.get(`${zone}:${hr}`) ?? 0;
                  const t = Math.min(1, v / maxZoneHour);
                  const a = 0.1 + t * 0.8;
                  return (
                    <td
                      key={`${zone}-${hr}`}
                      className="rounded px-2 py-1 text-right font-medium"
                      style={{
                        backgroundColor: `rgba(8,145,178,${a.toFixed(2)})`,
                        color: t > 0.5 ? "#f8fafc" : "#1e293b",
                      }}
                      title={`${CAM_LABEL[zone] ?? zone} ${hr}: ${v.toFixed(2)}`}
                    >
                      {v.toFixed(1)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ═══════════ 5. Dwell Percentiles ═══════════ */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">
          Дундаж үйлчлүүлсэн хугацаа
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500">
                <th className="py-2 pr-4">Үүрэг</th>
                <th className="py-2 pr-4 text-right">Тоо</th>
                <th className="py-2 pr-4 text-right">Хамгийн бага</th>
                <th className="py-2 pr-4 text-right">Дундаж</th>
                <th className="py-2 pr-4 text-right">10%</th>
                <th className="py-2 pr-4 text-right">5%</th>
                <th className="py-2 text-right">Хамгийн их</th>
              </tr>
            </thead>
            <tbody>
              {(["customer"] as const).map((role) => {
                const d = dwell.summary_by_role[role];
                return (
                  <tr
                    key={role}
                    className="border-b border-slate-50 text-slate-700"
                  >
                    <td className="py-2 pr-4 font-medium">
                      {roleLabels[role]}
                    </td>
                    <td className="py-2 pr-4 text-right">
                      {numFmt.format(d.count)}
                    </td>
                    <td className="py-2 pr-4 text-right">
                      {fmtDur(d.min_seconds)}
                    </td>
                    <td className="py-2 pr-4 text-right">
                      {fmtDur(d.p50_seconds)}
                    </td>
                    <td className="py-2 pr-4 text-right">
                      {fmtDur(d.p90_seconds)}
                    </td>
                    <td className="py-2 pr-4 text-right">
                      {fmtDur(d.p95_seconds)}
                    </td>
                    <td className="py-2 text-right">{fmtDur(d.max_seconds)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
