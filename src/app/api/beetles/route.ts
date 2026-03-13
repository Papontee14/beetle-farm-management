/**
 * GET /api/beetles       – ดึงด้วงทั้งหมด (รองรับ ?search=, ?stage=, ?status=)
 * POST /api/beetles      – เพิ่มด้วงใหม่
 * ใช้ in-memory mock store (ไม่ต้องเชื่อมต่อ database)
 */

import { NextRequest, NextResponse } from "next/server";
import { findAll, createBeetle } from "@/lib/mockStore";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search         = searchParams.get("search")         ?? "";
  const stage          = searchParams.get("stage")          ?? "";
  const status         = searchParams.get("status")         ?? "";
  const sex            = searchParams.get("sex")            ?? "";
  const containerCode  = searchParams.get("containerCode")  ?? "";
  const species        = searchParams.get("species")        ?? "";
  const fatherId       = searchParams.get("fatherId")       ?? "";
  const motherId       = searchParams.get("motherId")       ?? "";
  const weightMinRaw   = searchParams.get("weightMin");
  const weightMaxRaw   = searchParams.get("weightMax");
  const soilDaysRaw    = searchParams.get("soilWithinDays");
  const soilDue        = searchParams.get("soilDue") === "true";

  const beetles = findAll({
    search,
    stage:           stage   || undefined,
    status:          status  || undefined,
    sex:             sex     || undefined,
    containerCode:   containerCode || undefined,
    species:         species || undefined,
    fatherId:        fatherId || undefined,
    motherId:        motherId || undefined,
    weightMin:       weightMinRaw  ? Number(weightMinRaw)  : undefined,
    weightMax:       weightMaxRaw  ? Number(weightMaxRaw)  : undefined,
    soilWithinDays:  soilDaysRaw   ? Number(soilDaysRaw)   : undefined,
    soilDue,
  });

  // Strip heavy logs for list view
  const light = beetles.map(({ weightLogs: _w, feedingLogs: _f, healthRecords: _h, ...rest }) => rest);

  return NextResponse.json({ success: true, data: light });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.beetleId || !body.species || !body.containerCode) {
      return NextResponse.json(
        { success: false, message: "beetleId, species และ containerCode จำเป็นต้องกรอก" },
        { status: 400 }
      );
    }

    // Sync weight from logs if provided
    if (Array.isArray(body.weightLogs) && body.weightLogs.length > 0) {
      body.currentWeightGrams = body.weightLogs.at(-1).weight;
    }

    const beetle = createBeetle({
      weightLogs: [],
      feedingLogs: [],
      healthRecords: [],
      sex: "Unknown",
      stage: "L1",
      status: "Healthy",
      entryDate: new Date().toISOString(),
      ...body,
    });

    return NextResponse.json({ success: true, data: beetle }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
