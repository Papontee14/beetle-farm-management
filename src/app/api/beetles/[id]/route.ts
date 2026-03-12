/**
 * GET    /api/beetles/[id]  – ดึงข้อมูลด้วงรายตัว (รวม logs ครบ)
 * PUT    /api/beetles/[id]  – แก้ไขข้อมูลด้วง
 * DELETE /api/beetles/[id]  – ลบด้วง
 * ใช้ in-memory mock store
 */

import { NextRequest, NextResponse } from "next/server";
import { findById, updateBeetle, deleteBeetle } from "@/lib/mockStore";

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  const beetle = findById(params.id);
  if (!beetle) {
    return NextResponse.json({ success: false, message: "ไม่พบด้วงตัวนี้" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: beetle });
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const body = await req.json();

    if (Array.isArray(body.weightLogs) && body.weightLogs.length > 0) {
      body.currentWeightGrams = body.weightLogs.at(-1).weight;
    }

    const updated = updateBeetle(params.id, body);
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
  const ok = deleteBeetle(params.id);
  if (!ok) {
    return NextResponse.json({ success: false, message: "ไม่พบด้วงตัวนี้" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: { message: "ลบเรียบร้อย" } });
}
