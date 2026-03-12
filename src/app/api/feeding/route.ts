/**
 * POST /api/feeding  – บันทึกการให้อาหารและน้ำหนัก
 * Body: { beetleId: string, feedingLog?: FeedingLog, weightLog?: WeightLog }
 * ใช้ in-memory mock store
 */

import { NextRequest, NextResponse } from "next/server";
import { addWeightLog, addFeedingLog, findById } from "@/lib/mockStore";

export async function POST(req: NextRequest) {
  const { beetleId, feedingLog, weightLog } = await req.json();

  if (!beetleId) {
    return NextResponse.json({ success: false, message: "beetleId is required" }, { status: 400 });
  }

  if (!feedingLog && !weightLog) {
    return NextResponse.json({ success: false, message: "ต้องส่ง feedingLog หรือ weightLog อย่างน้อยหนึ่งอย่าง" }, { status: 400 });
  }

  let latest = findById(beetleId);
  if (!latest) {
    return NextResponse.json({ success: false, message: "ไม่พบด้วงตัวนี้" }, { status: 404 });
  }

  if (weightLog)  latest = addWeightLog(beetleId, weightLog)  ?? latest;
  if (feedingLog) latest = addFeedingLog(beetleId, feedingLog) ?? latest;

  return NextResponse.json({ success: true, data: latest });
}
