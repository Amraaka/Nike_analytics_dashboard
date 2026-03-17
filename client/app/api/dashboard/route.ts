import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const dbPath = path.join(process.cwd(), "DB");
    const [dwell, staffing, visitors] = await Promise.all([
      fs.readFile(path.join(dbPath, "dwell_distribution_clean_20260316.json"), "utf8"),
      fs.readFile(path.join(dbPath, "staffing_hourly_percent_20260316.json"), "utf8"),
      fs.readFile(path.join(dbPath, "visitor_distribution_hourly_20260316.json"), "utf8"),
    ]);
    return NextResponse.json({
      dwell: JSON.parse(dwell),
      staffing: JSON.parse(staffing),
      visitors: JSON.parse(visitors),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 });
  }
}
