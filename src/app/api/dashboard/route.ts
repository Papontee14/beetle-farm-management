import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/supabaseStore";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const stats = await getDashboardStats();
    return NextResponse.json(
      { success: true, data: stats },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
