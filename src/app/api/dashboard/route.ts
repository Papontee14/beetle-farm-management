/**
 * GET /api/dashboard
 * ใช้ in-memory mock store — ไม่ต้องเชื่อมต่อ database
 */

import { NextResponse } from "next/server";
import { findAll } from "@/lib/mockStore";
import { BeetleStage, BeetleStatus } from "@/types";

const STAGES: BeetleStage[]    = ["Egg", "L1", "L2", "L3", "Pupa", "Adult"];
const STATUSES: BeetleStatus[] = ["Healthy", "Sick", "Dead", "Sold"];

export async function GET() {
  const now       = new Date();
  const weekLater = new Date(now);
  weekLater.setDate(weekLater.getDate() + 7);

  const all = findAll();

  const byStage  = Object.fromEntries(STAGES.map((s) => [s, 0]))  as Record<BeetleStage, number>;
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<BeetleStatus, number>;

  for (const b of all) {
    if (b.stage  in byStage)  byStage[b.stage]++;
    if (b.status in byStatus) byStatus[b.status]++;
  }

  const soilChangeDueToday = all.filter(
    (b) => b.nextSoilChange && new Date(b.nextSoilChange) <= now
  );

  const soilChangeDueThisWeek = all.filter(
    (b) =>
      b.nextSoilChange &&
      new Date(b.nextSoilChange) > now &&
      new Date(b.nextSoilChange) <= weekLater
  );

  return NextResponse.json({
    success: true,
    data: {
      totalBeetles: all.length,
      byStage,
      byStatus,
      soilChangeDueToday,
      soilChangeDueThisWeek,
    },
  });
}
