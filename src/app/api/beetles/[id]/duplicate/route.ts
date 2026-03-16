/**
 * POST /api/beetles/[id]/duplicate – แยกกล่อง (duplicate beetle record)
 * Body: { newBeetleId: string, newContainerCode: string, splitQty: number }
 */

import { NextRequest, NextResponse } from "next/server";
import { duplicateBeetle, findAll } from "@/lib/supabaseStore";

type Params = { params: { id: string } };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { newBeetleId, newContainerCode, splitQty } = await req.json();

    if (!newBeetleId || !newContainerCode || !splitQty) {
      return NextResponse.json(
        { success: false, message: "newBeetleId, newContainerCode และ splitQty จำเป็นต้องกรอก" },
        { status: 400 }
      );
    }

    const normalizedId = String(newBeetleId).toUpperCase();

    // Check uniqueness
    const all = await findAll(undefined, { includeLogs: false });
    if (all.some((b) => b.beetleId.toLowerCase() === normalizedId.toLowerCase() &&  b._id !== params.id)) {
      return NextResponse.json(
        { success: false, message: `รหัสด้วง "${normalizedId}" มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่น` },
        { status: 409 }
      );
    }

    const result = await duplicateBeetle(params.id, {
      newBeetleId: normalizedId,
      newContainerCode,
      splitQty: Number(splitQty),
    });

    if (!result) {
      return NextResponse.json(
        { success: false, message: "ไม่พบด้วงตัวนี้ หรือจำนวนที่แยกมากกว่าจำนวนในกล่อง" },
        { status: 404 }
      );
    }
    if (result === null) {
      return NextResponse.json(
        { success: false, message: "รหัสด้วงนี้ถูกใช้ไปแล้ว" },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
