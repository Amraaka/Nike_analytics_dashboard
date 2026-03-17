import { promises as fs } from "node:fs";
import path from "node:path";
import { Clock3, Eye, Users, UserRoundCog } from "lucide-react";
import StaffingPieChart from "./StaffingPieChart";

/* ── Types ─────────────────────────────────────────────────────── */

type DwellData = {
  source_file: string;
  generated_at_utc: string;
  quality: {
    input_rows: number;
    rows_used_for_distribution: number;
    rows_removed: number;
    recomputed_duration_rows: number;
    removed_by_reason: Record<string, number>;
  };
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
    min_seconds: number;
    max_seconds: number | null;
    customer_count: number;
    worker_count: number;
    total_count: number;
    pct_of_used_rows: number;
  }[];
};

type StaffingData = {
  source_file: string;
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

type CameraHourEntry = {
  camera_id: string;
  hour: string;
  avg_count: number;
  avg_count_raw: number;
  sample_count: number;
  total_count: number;
};

type VisitorData = {
  source_file: string;
  metric: string;
  zones: string[];
  camera_ids: string[];
  hours: string[];
  by_camera_hour: CameraHourEntry[];
  zone_hour: {
    zone: string;
    hour: string;
    avg_count: number;
    avg_count_raw: number;
    sample_count: number;
    total_count: number;
  }[];
  hourly_average: {
    hour: string;
    avg_count: number;
    avg_count_raw: number;
    sample_count: number;
    total_count: number;
  }[];
  zone_average: {
    zone: string;
    avg_count: number;
    avg_count_raw: number;
    sample_count: number;
    total_count: number;
  }[];
  summary: {
    overall_avg_count: number;
    overall_avg_count_raw: number;
    total_samples: number;
    total_count: number;
  };
};

/* ── Helpers ───────────────────────────────────────────────────── */

const numFmt = new Intl.NumberFormat("mn-MN");

function fmtDur(s: number) {
  if (s >= 3600) return `${(s / 3600).toFixed(1)}ц`;
  if (s >= 60) return `${(s / 60).toFixed(1)}мин`;
  return `${s.toFixed(0)}сек`;
}

async function read<T>(name: string): Promise<T> {
  const raw = await fs.readFile(path.join(process.cwd(), "DB", name), "utf8");
  return JSON.parse(raw) as T;
}

/* ── Page ──────────────────────────────────────────────────────── */

export default async function DashboardPage() {
  const [dwell, staffing, visitors] = await Promise.all([
    read<DwellData>("dwell_distribution_clean_20260316.json"),
    read<StaffingData>("staffing_hourly_percent_20260316.json"),
    read<VisitorData>("visitor_distribution_hourly_20260316.json"),
  ]);

  const peakHour = visitors.hourly_average.reduce((a, b) =>
    b.avg_count_raw > a.avg_count_raw ? b : a
  );
  const maxCustomerBucket = Math.max(
    ...dwell.buckets.map((b) => b.customer_count),
    1
  );
  const maxZoneHour = Math.max(
    ...visitors.zone_hour.map((e) => e.avg_count_raw),
    1
  );
  const heatMap = new Map(
    visitors.zone_hour.map((e) => [`${e.zone}:${e.hour}`, e.avg_count_raw])
  );

  // Camera-hour lookup: key = "cam1:09:00" → entry
  const camHourMap = new Map(
    visitors.by_camera_hour.map((e) => [`${e.camera_id}:${e.hour}`, e])
  );
  const cameras = visitors.camera_ids;
  // Explicit hex colors — avoids Tailwind purge issues with dynamic class lookups
  const CAM_HEX: Record<string, string> = {
    cam1: "#38bdf8", // sky-400
    cam2: "#fbbf24", // amber-400
    cam3: "#0e7490", // cyan-700
  };
  const CAM_LABEL: Record<string, string> = {
    cam1: "Дотор заал",
    cam2: "Касс",
    cam3: "Зүүн урд камер",
  };
  const CHART_H = 192; // px — matches h-48
  // For stacked bars, max is the highest per-hour sum across cameras
  const maxHourlySum = Math.max(
    ...visitors.hours.map((hr) =>
      cameras.reduce(
        (sum, cam) =>
          sum + (camHourMap.get(`${cam}:${hr}`)?.avg_count_raw ?? 0),
        0
      )
    ),
    1
  );
  const roleLabels = {
    customer: "Үйлчлүүлэгч",
    worker: "Ажилтан",
    all: "Нийт",
  } as const;

  return (
    <div className="space-y-6">
      {/* ═══════════ TOP: Average / Summary Metric Cards ═══════════ */}
      <section className="grid gap-3 grid-cols-2 lg:grid-cols-3">
        {[
          // {
          //   label: "Дундаж үйлчлүүлэгч",
          //   value: visitors.summary.overall_avg_count_raw.toFixed(2),
          //   sub: `${numFmt.format(visitors.summary.total_count)} нийт илрүүлэлт`,
          //   Icon: Users,
          // },
          {
            label: "Үйлчлүүлсэн дундаж хугацаа",
            value: fmtDur(dwell.summary_by_role.customer.p50_seconds),
            // sub: `Үйлчлүүлэгч ${fmtDur(dwell.summary_by_role.customer.p50_seconds) }`,
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
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                {c.label}
              </span>
              <span className="rounded-full bg-cyan-50 p-2 text-cyan-600">
                <c.Icon className="h-4 w-4" />
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{c.value}</p>
            <p className="mt-1 text-xs text-slate-500">{c.sub}</p>
          </div>
        ))}
      </section>

      {/* ═══════════ GRAPHS / DISTRIBUTIONS ════════════════════════ */}

      {/* ── 1. Hourly Visitor Bar Chart (stacked by camera) ────── */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-12">
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
              value: camHourMap.get(`${cam}:${hr}`)?.avg_count_raw ?? 0,
            }));
            const total = segments.reduce((s, seg) => s + seg.value, 0);
            const barH = Math.max((total / maxHourlySum) * CHART_H, 6);
            return (
              <div
                key={hr}
                className="group relative flex flex-1 flex-col items-center justify-end"
              >
                {/* stacked bar — flex column fills height proportionally */}
                <div
                  className="flex w-full flex-col overflow-hidden rounded-t"
                  style={{ height: `${barH}px` }}
                >
                  {/* render bottom→top: cam1 at bottom, cam3 at top */}
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
                <span className="absolute -top-6 hidden group-hover:block text-[10px] bg-slate-800 text-white rounded px-1.5 py-0.5 whitespace-nowrap z-10">
                  {hr} · {segments.map((s) => `${CAM_LABEL[s.cam] ?? s.cam}: ${s.value.toFixed(2)}`).join(" · ")}
                </span>
                <span className="mt-1 text-[10px] text-slate-400">
                  {hr.slice(0, 2)}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 2. Staffing Coverage (Pie Chart) ────────────────────── */}
      <StaffingPieChart staffing={staffing} />

      {/* ── 3. Dwell Duration Distribution (Customer only) ───────── */}
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
                  <span className="w-20 shrink-0 text-xs font-medium text-slate-600 text-right">
                    {b.bucket}
                  </span>
                  <div className="flex-1">
                    <div
                      className="flex h-5 overflow-hidden rounded bg-cyan-500"
                      style={{ width: `${Math.max(w, 2)}%` }}
                    />
                  </div>
                  {/* <span className="w-16 shrink-0 text-xs text-slate-500 text-right">
                    {numFmt.format(b.customer_count)}
                  </span> */}
                </div>
              );
            })}
        </div>
      </section>

      {/* ── 4. Camera Zone Heatmap ─────────────────────────────── */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm overflow-x-auto">
        <h2 className="text-base font-semibold text-slate-900">
          Тархалт
        </h2>
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

      {/* ── 5. Zone Totals ─────────────────────────────────────── */}
      {/* <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">
          Бүсийн хураангуй
        </h2>
        <p className="mb-4 text-xs text-slate-500">
          Камер бүрийн нийт илрүүлэлт болон кадр тутмын дундаж.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {[...visitors.zone_average]
            .sort((a, b) => b.total_count - a.total_count)
            .map((z) => {
              const share =
                visitors.summary.total_count > 0
                  ? (z.total_count / visitors.summary.total_count) * 100
                  : 0;
              return (
                <div
                  key={z.zone}
                  className="rounded-xl border border-slate-100 p-4"
                >
                  <p className="text-sm font-semibold text-slate-800">
                    {CAM_LABEL[z.zone] ?? z.zone}
                  </p>
                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {numFmt.format(z.total_count)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {z.avg_count_raw.toFixed(2)} кадр тутмын дундаж · {share.toFixed(1)}%
                    эзлэх хувь · {numFmt.format(z.sample_count)} түүвэр
                  </p>
                </div>
              );
            })}
        </div>
      </section> */}

      {/* ── 6. Dwell Percentiles by Role ───────────────────────── */}
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
                    <td className="py-2 text-right">
                      {fmtDur(d.max_seconds)}
                    </td>
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
