/**
 * POST /api/health  – เพิ่ม health record ให้ด้วงตัวหนึ่ง
 * Body: { beetleId: string, record: HealthRecord }
 * ใช้ in-memory mock store
 */

import { NextRequest, NextResponse } from "next/server";
import { addHealthRecord } from "@/lib/mockStore";

export async function POST(req: NextRequest) {
  const { beetleId, record } = await req.json();

  if (!beetleId || !record) {
    return NextResponse.json(
      { success: false, message: "beetleId และ record จำเป็นต้องส่งมา" },
      { status: 400 }
    );
  }

  const updated = addHealthRecord(beetleId, record);
  if (!updated) {
    return NextResponse.json({ success: false, message: "ไม่พบด้วงตัวนี้" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: updated });
}
