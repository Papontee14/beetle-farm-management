/**
 * GET /api/dashboard
 * ใช้ in-memory mock store — ไม่ต้องเชื่อมต่อ database
 */

import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/supabaseStore";

export async function GET() {
  try {
    const stats = await getDashboardStats();
    return NextResponse.json({ success: true, data: stats });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
