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
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const all = findAll();

  const byStage  = Object.fromEntries(STAGES.map((s) => [s, 0]))  as Record<BeetleStage, number>;
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<BeetleStatus, number>;

  for (const b of all) {
    if (b.stage  in byStage)  byStage[b.stage]++;
    if (b.status in byStatus) byStatus[b.status]++;
  }

  // Exclude Egg & Adult — they don't need soil changes
  const soilChangeDueToday = all.filter(
    (b) =>
      b.nextSoilChange &&
      new Date(b.nextSoilChange) <= now &&
      b.stage !== "Egg" &&
      b.stage !== "Adult"
  );

  const soilChangeDueThisWeek = all.filter(
    (b) =>
      b.nextSoilChange &&
      new Date(b.nextSoilChange) > now &&
      new Date(b.nextSoilChange) <= weekLater &&
      b.stage !== "Egg" &&
      b.stage !== "Adult"
  );

  // Species breakdown
  const speciesMap = new Map<string, number>();
  for (const b of all) {
    speciesMap.set(b.species, (speciesMap.get(b.species) ?? 0) + 1);
  }
  const speciesBreakdown = [...speciesMap.entries()]
    .map(([species, count]) => ({ species, count }))
    .sort((a, b) => b.count - a.count);

  // Larvae/Pupa not weighed in >14 days
  const notWeighedRecently = all
    .filter((b) => {
      if (!["L1", "L2", "L3", "Pupa"].includes(b.stage)) return false;
      if (b.status === "Dead" || b.status === "Sold") return false;
      if (!b.weightLogs || b.weightLogs.length === 0) return true;
      const lastWeighed = Math.max(...b.weightLogs.map((w) => new Date(w.date).getTime()));
      return lastWeighed < fourteenDaysAgo.getTime();
    })
    .map(({ weightLogs: _w, feedingLogs: _f, healthRecords: _h, ...rest }) => rest);

  // Sick beetles
  const sickBeetles = all
    .filter((b) => b.status === "Sick")
    .map(({ weightLogs: _w, feedingLogs: _f, healthRecords: _h, ...rest }) => rest);

  return NextResponse.json({
    success: true,
    data: {
      totalBeetles: all.length,
      byStage,
      byStatus,
      soilChangeDueToday,
      soilChangeDueThisWeek,
      speciesBreakdown,
      notWeighedRecently,
      sickBeetles,
    },
  });
}
