/**
 * GET  /api/soil-alerts  – ด้วงที่ถึงกำหนดเปลี่ยนดิน (nextSoilChange <= now)
 * POST /api/soil-alerts  – บันทึกการเปลี่ยนดิน + ตั้งวันนัดหน้า
 * ใช้ in-memory mock store
 *
 * Prompt: สร้าง GET API endpoint สำหรับดึงข้อมูลด้วงทั้งหมด
 * 1. ดึงข้อมูลด้วงจาก Database
 * 2. Filter เฉพาะด้วงที่ nextSoilChange มีค่าน้อยกว่าหรือเท่ากับปัจจุบัน
 * 3. Return เป็น JSON array
 */

import { NextRequest, NextResponse } from "next/server";
import { findAll, recordSoilChange } from "@/lib/mockStore";

export async function GET(req: NextRequest) {
  const all = new URL(req.url).searchParams.get("all") === "true";
  const now = new Date();

  const beetles = all
    ? findAll().filter((b) => b.status !== "Dead" && b.status !== "Sold")
    : findAll({ soilDue: true }).filter((b) => b.status !== "Dead" && b.status !== "Sold");

  return NextResponse.json({ success: true, data: beetles, _now: now.toISOString() });
}

/**
 * Body: { beetleId: string, daysUntilNext?: number }
 */
export async function POST(req: NextRequest) {
  const { beetleId, daysUntilNext = 30 } = await req.json();

  if (!beetleId) {
    return NextResponse.json({ success: false, message: "beetleId is required" }, { status: 400 });
  }

  const updated = recordSoilChange(beetleId, Number(daysUntilNext));
  if (!updated) {
    return NextResponse.json({ success: false, message: "ไม่พบด้วงตัวนี้" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: updated });
}
