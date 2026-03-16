import { NextRequest, NextResponse } from "next/server";
import { addHealthRecord } from "@/lib/supabaseStore";

export async function POST(req: NextRequest) {
  try {
    const { beetleId, record } = await req.json();

    if (!beetleId || !record) {
      return NextResponse.json(
        { success: false, message: "beetleId และ record จำเป็นต้องส่งมา" },
        { status: 400 }
      );
    }

    const updated = await addHealthRecord(beetleId, record);
    if (!updated) {
      return NextResponse.json({ success: false, message: "ไม่พบด้วงตัวนี้" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
