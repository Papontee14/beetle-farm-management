import { NextRequest, NextResponse } from "next/server";
import { addWeightLog, addFeedingLog, findById, recordSoilChange } from "@/lib/supabaseStore";

export async function POST(req: NextRequest) {
  try {
    const { beetleId, feedingLog, weightLog, soilChange } = await req.json();

    if (!beetleId) {
      return NextResponse.json({ success: false, message: "beetleId is required" }, { status: 400 });
    }

    if (!feedingLog && !weightLog) {
      return NextResponse.json({ success: false, message: "ต้องส่ง feedingLog หรือ weightLog อย่างน้อยหนึ่งอย่าง" }, { status: 400 });
    }

    let latest = await findById(beetleId);
    if (!latest) {
      return NextResponse.json({ success: false, message: "ไม่พบด้วงตัวนี้" }, { status: 404 });
    }

    if (weightLog) latest = (await addWeightLog(beetleId, weightLog)) ?? latest;
    if (feedingLog) latest = (await addFeedingLog(beetleId, feedingLog)) ?? latest;
    // เมื่อชั่งหนอนพร้อมเปลี่ยนแมท - บันทึก lastSoilChange และคำนวณ nextSoilChange
    if (soilChange?.daysUntilNext) {
      latest = (await recordSoilChange(beetleId, Number(soilChange.daysUntilNext))) ?? latest;
    }

    return NextResponse.json({ success: true, data: latest });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
