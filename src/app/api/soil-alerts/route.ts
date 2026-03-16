import { NextRequest, NextResponse } from "next/server";
import { findAll, recordSoilChange } from "@/lib/supabaseStore";

export async function GET(req: NextRequest) {
  try {
    const all = new URL(req.url).searchParams.get("all") === "true";
    const now = new Date();

    const data = all
      ? await findAll(undefined, { includeLogs: false })
      : await findAll({ soilDue: true }, { includeLogs: false });

    const beetles = data.filter((b) => b.status !== "Dead" && b.status !== "Sold");
    return NextResponse.json({ success: true, data: beetles, _now: now.toISOString() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

/**
 * Body: { beetleId: string, daysUntilNext?: number }
 */
export async function POST(req: NextRequest) {
  try {
    const { beetleId, daysUntilNext = 30 } = await req.json();

    if (!beetleId) {
      return NextResponse.json({ success: false, message: "beetleId is required" }, { status: 400 });
    }

    const updated = await recordSoilChange(beetleId, Number(daysUntilNext));
    if (!updated) {
      return NextResponse.json({ success: false, message: "ไม่พบด้วงตัวนี้" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
