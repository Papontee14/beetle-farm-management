import { NextRequest, NextResponse } from "next/server";
import { findById, updateBeetle, deleteBeetle } from "@/lib/supabaseStore";

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const beetle = await findById(params.id);
    if (!beetle) {
      return NextResponse.json({ success: false, message: "ไม่พบด้วงตัวนี้" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: beetle });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const body = await req.json();

    if (Array.isArray(body.weightLogs) && body.weightLogs.length > 0) {
      body.currentWeightGrams = body.weightLogs.at(-1).weight;
    }

    const updated = await updateBeetle(params.id, body);
    if (!updated) {
      return NextResponse.json({ success: false, message: "ไม่พบด้วงตัวนี้" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const ok = await deleteBeetle(params.id);
    if (!ok) {
      return NextResponse.json({ success: false, message: "ไม่พบด้วงตัวนี้" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: { message: "ลบเรียบร้อย" } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
