import {
  Beetle,
  BeetleStage,
  BeetleStatus,
  BeetleSummary,
  DashboardStats,
} from "@/types";
import { assertSupabaseEnv, supabaseAdmin } from "@/lib/supabaseAdmin";

type FindFilter = {
  search?: string;
  stage?: string;
  status?: string;
  sex?: string;
  containerCode?: string;
  species?: string;
  fatherId?: string;
  motherId?: string;
  weightMin?: number;
  weightMax?: number;
  soilWithinDays?: number;
  soilDue?: boolean;
};

type FindOptions = {
  includeLogs?: boolean;
};

type DuplicateOptions = {
  newBeetleId: string;
  newContainerCode: string;
  splitQty: number;
};

const STAGES: BeetleStage[] = ["Egg", "L1", "L2", "L3", "Pupa", "Adult"];
const STATUSES: BeetleStatus[] = ["Healthy", "Sick", "Dead", "Sold"];

let cachedFarmId: string | null = null;

function toDateOnly(dateLike?: string | Date): string | null {
  if (!dateLike) return null;
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function toIsoOrNow(dateLike?: string | Date): string {
  const d = dateLike ? new Date(dateLike) : new Date();
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

function mapWeightLogs(logs: any[] | null | undefined) {
  return (logs ?? [])
    .map((w) => ({
      _id: w.id,
      weight: Number(w.weight),
      date: w.measured_at,
      note: w.note ?? undefined,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function mapFeedingLogs(logs: any[] | null | undefined) {
  return (logs ?? [])
    .map((f) => ({
      _id: f.id,
      date: f.fed_at,
      feedType: f.feed_type,
      amountGrams: Number(f.amount_grams),
      note: f.note ?? undefined,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function mapHealthRecords(logs: any[] | null | undefined) {
  return (logs ?? [])
    .map((h) => ({
      _id: h.id,
      date: h.recorded_at,
      type: h.type,
      description: h.description,
      treatedBy: h.treated_by ?? undefined,
      medication: h.medication ?? undefined,
      nextFollowUp: h.next_follow_up ?? undefined,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function mapBeetle(row: any, includeLogs = false): Beetle {
  const mapped: Beetle = {
    _id: row.id,
    beetleId: row.beetle_code,
    name: row.name ?? undefined,
    species: row.species,
    lineage: row.lineage ?? undefined,
    sex: row.sex,
    stage: row.stage,
    status: row.status,
    birthDate: row.birth_date ?? undefined,
    entryDate: row.entry_date,
    containerCode: row.container_code,
    currentWeightGrams:
      row.current_weight_grams === null || row.current_weight_grams === undefined
        ? undefined
        : Number(row.current_weight_grams),
    weightLogs: includeLogs ? mapWeightLogs(row.beetle_weight_logs) : [],
    feedingLogs: includeLogs ? mapFeedingLogs(row.beetle_feeding_logs) : [],
    healthRecords: includeLogs ? mapHealthRecords(row.beetle_health_records) : [],
    parentInfo: row.parent_info ?? undefined,
    quantity: row.quantity ?? undefined,
    lengthMm:
      row.length_mm === null || row.length_mm === undefined
        ? undefined
        : Number(row.length_mm),
    emergenceDate: row.emergence_date ?? undefined,
    firstFeedingDate: row.first_feeding_date ?? undefined,
    lastSoilChange: row.last_soil_change ?? undefined,
    nextSoilChange: row.next_soil_change ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  return mapped;
}

async function getFarmId(): Promise<string> {
  assertSupabaseEnv();

  if (cachedFarmId) return cachedFarmId;

  if (process.env.SUPABASE_DEFAULT_FARM_ID) {
    cachedFarmId = process.env.SUPABASE_DEFAULT_FARM_ID;
    return cachedFarmId;
  }

  const { data: existingDefault, error: defaultErr } = await supabaseAdmin
    .from("farms")
    .select("id")
    .eq("is_default", true)
    .limit(1)
    .maybeSingle();

  if (defaultErr) throw new Error(defaultErr.message);

  if (existingDefault?.id) {
    cachedFarmId = existingDefault.id;
    return cachedFarmId!;
  }

  const { data: created, error: createErr } = await supabaseAdmin
    .from("farms")
    .insert({ name: "Default Farm", timezone: "Asia/Bangkok", is_default: true })
    .select("id")
    .single();

  if (createErr || !created?.id) {
    throw new Error(createErr?.message ?? "Unable to create default farm");
  }

  cachedFarmId = created.id;
  return cachedFarmId!;
}

function beetleBaseSelect(includeLogs: boolean): string {
  const base = [
    "id",
    "farm_id",
    "beetle_code",
    "name",
    "species",
    "lineage",
    "sex",
    "stage",
    "status",
    "birth_date",
    "entry_date",
    "container_code",
    "current_weight_grams",
    "quantity",
    "length_mm",
    "emergence_date",
    "first_feeding_date",
    "parent_info",
    "last_soil_change",
    "next_soil_change",
    "notes",
    "created_at",
    "updated_at",
  ];

  if (includeLogs) {
    base.push(
      "beetle_weight_logs(id, weight, measured_at, note)",
      "beetle_feeding_logs(id, fed_at, feed_type, amount_grams, note)",
      "beetle_health_records(id, recorded_at, type, description, treated_by, medication, next_follow_up)"
    );
  }

  return base.join(",");
}

function toDbPatch(patch: Partial<Beetle>) {
  return {
    beetle_code: patch.beetleId,
    name: patch.name,
    species: patch.species,
    lineage: patch.lineage,
    sex: patch.sex,
    stage: patch.stage,
    status: patch.status,
    birth_date: patch.birthDate === undefined ? undefined : toDateOnly(patch.birthDate),
    entry_date: patch.entryDate === undefined ? undefined : toDateOnly(patch.entryDate),
    container_code: patch.containerCode,
    current_weight_grams:
      patch.currentWeightGrams === undefined ? undefined : Number(patch.currentWeightGrams),
    quantity: patch.quantity,
    length_mm: patch.lengthMm === undefined ? undefined : Number(patch.lengthMm),
    emergence_date: patch.emergenceDate === undefined ? undefined : toDateOnly(patch.emergenceDate),
    first_feeding_date: patch.firstFeedingDate === undefined ? undefined : toDateOnly(patch.firstFeedingDate),
    parent_info: patch.parentInfo,
    last_soil_change: patch.lastSoilChange === undefined ? undefined : toDateOnly(patch.lastSoilChange),
    next_soil_change: patch.nextSoilChange === undefined ? undefined : toDateOnly(patch.nextSoilChange),
    notes: patch.notes,
  };
}

function compactUndefined<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

async function replaceWeightLogs(beetleId: string, logs: Beetle["weightLogs"]) {
  const { error: deleteErr } = await supabaseAdmin.from("beetle_weight_logs").delete().eq("beetle_id", beetleId);
  if (deleteErr) throw new Error(deleteErr.message);

  if (!logs.length) return;

  const rows = logs.map((w) => ({
    id: w._id,
    beetle_id: beetleId,
    weight: Number(w.weight),
    measured_at: toIsoOrNow(w.date),
    note: w.note ?? null,
  }));

  const { error: insertErr } = await supabaseAdmin.from("beetle_weight_logs").insert(rows);
  if (insertErr) throw new Error(insertErr.message);
}

async function replaceFeedingLogs(beetleId: string, logs: Beetle["feedingLogs"]) {
  const { error: deleteErr } = await supabaseAdmin.from("beetle_feeding_logs").delete().eq("beetle_id", beetleId);
  if (deleteErr) throw new Error(deleteErr.message);

  if (!logs.length) return;

  const rows = logs.map((f) => ({
    id: f._id,
    beetle_id: beetleId,
    fed_at: toIsoOrNow(f.date),
    feed_type: f.feedType,
    amount_grams: Number(f.amountGrams),
    note: f.note ?? null,
  }));

  const { error: insertErr } = await supabaseAdmin.from("beetle_feeding_logs").insert(rows);
  if (insertErr) throw new Error(insertErr.message);
}

async function replaceHealthRecords(beetleId: string, logs: Beetle["healthRecords"]) {
  const { error: deleteErr } = await supabaseAdmin.from("beetle_health_records").delete().eq("beetle_id", beetleId);
  if (deleteErr) throw new Error(deleteErr.message);

  if (!logs.length) return;

  const rows = logs.map((h) => ({
    id: h._id,
    beetle_id: beetleId,
    recorded_at: toIsoOrNow(h.date),
    type: h.type,
    description: h.description,
    treated_by: h.treatedBy ?? null,
    medication: h.medication ?? null,
    next_follow_up: toDateOnly(h.nextFollowUp),
  }));

  const { error: insertErr } = await supabaseAdmin.from("beetle_health_records").insert(rows);
  if (insertErr) throw new Error(insertErr.message);
}

export async function findAll(filter?: FindFilter, options?: FindOptions): Promise<Beetle[]> {
  const farmId = await getFarmId();
  const includeLogs = options?.includeLogs ?? false;
  let query = supabaseAdmin
    .from("beetles")
    .select(beetleBaseSelect(includeLogs))
    .eq("farm_id", farmId)
    .order("created_at", { ascending: false });

  if (filter?.search) {
    const q = filter.search.trim();
    if (q) {
      query = query.or(
        `beetle_code.ilike.%${q}%,name.ilike.%${q}%,species.ilike.%${q}%,container_code.ilike.%${q}%,lineage.ilike.%${q}%`
      );
    }
  }

  if (filter?.stage) query = query.eq("stage", filter.stage);
  if (filter?.status) query = query.eq("status", filter.status);
  if (filter?.sex) query = query.eq("sex", filter.sex);
  if (filter?.containerCode) query = query.ilike("container_code", `%${filter.containerCode}%`);
  if (filter?.species) query = query.ilike("species", `%${filter.species}%`);
  if (filter?.fatherId) query = query.ilike("parent_info->father->>beetleId", `%${filter.fatherId}%`);
  if (filter?.motherId) query = query.ilike("parent_info->mother->>beetleId", `%${filter.motherId}%`);
  if (filter?.weightMin !== undefined) query = query.gte("current_weight_grams", filter.weightMin);
  if (filter?.weightMax !== undefined) query = query.lte("current_weight_grams", filter.weightMax);

  if (filter?.soilWithinDays !== undefined) {
    const limit = new Date();
    limit.setDate(limit.getDate() + filter.soilWithinDays);
    query = query.lte("next_soil_change", limit.toISOString().slice(0, 10));
  }

  if (filter?.soilDue) {
    query = query.lte("next_soil_change", new Date().toISOString().slice(0, 10));
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => mapBeetle(row, includeLogs));
}

export async function findById(id: string): Promise<Beetle | undefined> {
  const farmId = await getFarmId();
  const { data, error } = await supabaseAdmin
    .from("beetles")
    .select(beetleBaseSelect(true))
    .eq("id", id)
    .eq("farm_id", farmId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return undefined;

  return mapBeetle(data, true);
}

export async function createBeetle(data: Omit<Beetle, "_id">): Promise<Beetle> {
  const farmId = await getFarmId();
  const dbRow = compactUndefined({
    farm_id: farmId,
    ...toDbPatch(data),
    entry_date: toDateOnly(data.entryDate) ?? new Date().toISOString().slice(0, 10),
  });

  const { data: created, error: insertErr } = await supabaseAdmin
    .from("beetles")
    .insert(dbRow)
    .select("id")
    .single();

  if (insertErr || !created?.id) {
    throw new Error(insertErr?.message ?? "Unable to create beetle");
  }

  if (data.weightLogs?.length) await replaceWeightLogs(created.id, data.weightLogs);
  if (data.feedingLogs?.length) await replaceFeedingLogs(created.id, data.feedingLogs);
  if (data.healthRecords?.length) await replaceHealthRecords(created.id, data.healthRecords);

  const full = await findById(created.id);
  if (!full) throw new Error("Unable to fetch created beetle");
  return full;
}

export async function updateBeetle(id: string, patch: Partial<Beetle>): Promise<Beetle | undefined> {
  const { weightLogs, feedingLogs, healthRecords, ...scalarPatch } = patch;
  const dbPatch = compactUndefined(toDbPatch(scalarPatch));

  if (Object.keys(dbPatch).length > 0) {
    const { error: updateErr } = await supabaseAdmin.from("beetles").update(dbPatch).eq("id", id);
    if (updateErr) throw new Error(updateErr.message);
  }

  if (Array.isArray(weightLogs)) await replaceWeightLogs(id, weightLogs);
  if (Array.isArray(feedingLogs)) await replaceFeedingLogs(id, feedingLogs);
  if (Array.isArray(healthRecords)) await replaceHealthRecords(id, healthRecords);

  return findById(id);
}

export async function deleteBeetle(id: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin.from("beetles").delete().eq("id", id).select("id");
  if (error) throw new Error(error.message);
  return (data?.length ?? 0) > 0;
}

export async function recordSoilChange(id: string, daysUntilNext: number): Promise<Beetle | undefined> {
  const now = new Date();
  const next = new Date(now);
  next.setDate(next.getDate() + daysUntilNext);

  const { error } = await supabaseAdmin.from("soil_change_events").insert({
    beetle_id: id,
    changed_at: now.toISOString(),
    days_until_next: daysUntilNext,
    next_soil_change: next.toISOString().slice(0, 10),
  });

  if (error) throw new Error(error.message);
  return findById(id);
}

export async function addWeightLog(
  id: string,
  log: { weight: number; date: string; note?: string }
): Promise<Beetle | undefined> {
  const { error } = await supabaseAdmin.from("beetle_weight_logs").insert({
    beetle_id: id,
    weight: Number(log.weight),
    measured_at: toIsoOrNow(log.date),
    note: log.note ?? null,
  });

  if (error) throw new Error(error.message);
  return findById(id);
}

export async function addHealthRecord(
  id: string,
  record: {
    type: string;
    description: string;
    medication?: string;
    treatedBy?: string;
    date: string;
    nextFollowUp?: string;
  }
): Promise<Beetle | undefined> {
  const { error } = await supabaseAdmin.from("beetle_health_records").insert({
    beetle_id: id,
    recorded_at: toIsoOrNow(record.date),
    type: record.type,
    description: record.description,
    medication: record.medication ?? null,
    treated_by: record.treatedBy ?? null,
    next_follow_up: toDateOnly(record.nextFollowUp),
  });

  if (error) throw new Error(error.message);
  return findById(id);
}

export async function addFeedingLog(
  id: string,
  log: { feedType: string; amountGrams: number; date: string; note?: string }
): Promise<Beetle | undefined> {
  const { error } = await supabaseAdmin.from("beetle_feeding_logs").insert({
    beetle_id: id,
    fed_at: toIsoOrNow(log.date),
    feed_type: log.feedType,
    amount_grams: Number(log.amountGrams),
    note: log.note ?? null,
  });

  if (error) throw new Error(error.message);
  return findById(id);
}

export async function duplicateBeetle(
  id: string,
  opts: DuplicateOptions
): Promise<{ original: Beetle; copy: Beetle } | null | undefined> {
  const source = await findById(id);
  if (!source) return undefined;

  const farmId = await getFarmId();
  const { data: existing, error: existingErr } = await supabaseAdmin
    .from("beetles")
    .select("id")
    .eq("farm_id", farmId)
    .ilike("beetle_code", opts.newBeetleId)
    .limit(1)
    .maybeSingle();

  if (existingErr) throw new Error(existingErr.message);
  if (existing?.id) return null;

  const remaining = (source.quantity ?? 1) - opts.splitQty;
  if (remaining < 0) return undefined;

  const updatedOriginal = await updateBeetle(id, { quantity: remaining > 0 ? remaining : 1 });
  if (!updatedOriginal) return undefined;

  const copy = await createBeetle({
    ...source,
    beetleId: opts.newBeetleId,
    containerCode: opts.newContainerCode,
    quantity: opts.splitQty,
    weightLogs: [],
    feedingLogs: [],
    healthRecords: [],
    notes: `แยกจาก ${source.beetleId}`,
    createdAt: undefined,
    updatedAt: undefined,
  });

  return { original: updatedOriginal, copy };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  // Some Supabase setups may return empty rows when embedding log relations in list queries.
  // Fall back to lightweight rows so dashboard still reflects actual beetle counts.
  let all = await findAll(undefined, { includeLogs: true });
  if (all.length === 0) {
    all = await findAll(undefined, { includeLogs: false });
  }

  const now = new Date();
  const weekLater = new Date(now);
  weekLater.setDate(weekLater.getDate() + 7);
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const byStage = Object.fromEntries(STAGES.map((s) => [s, 0])) as Record<BeetleStage, number>;
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<BeetleStatus, number>;

  for (const b of all) {
    if (b.stage in byStage) byStage[b.stage]++;
    if (b.status in byStatus) byStatus[b.status]++;
  }

  const toSummary = (b: Beetle): BeetleSummary => ({
    _id: b._id ?? "",
    beetleId: b.beetleId,
    name: b.name,
    species: b.species,
    stage: b.stage,
    status: b.status,
    containerCode: b.containerCode,
    nextSoilChange: b.nextSoilChange,
    currentWeightGrams: b.currentWeightGrams,
    quantity: b.quantity,
  });

  const stripHeavy = (b: Beetle) => {
    const { weightLogs: _w, feedingLogs: _f, healthRecords: _h } = b;
    return toSummary(b);
  };

  const soilChangeDueToday = all
    .filter(
      (b) =>
        b.nextSoilChange &&
        new Date(b.nextSoilChange) <= now &&
        b.stage !== "Egg" &&
        b.stage !== "Adult"
    )
    .map(stripHeavy);

  const soilChangeDueThisWeek = all
    .filter(
      (b) =>
        b.nextSoilChange &&
        new Date(b.nextSoilChange) > now &&
        new Date(b.nextSoilChange) <= weekLater &&
        b.stage !== "Egg" &&
        b.stage !== "Adult"
    )
    .map(stripHeavy);

  const speciesMap = new Map<string, number>();
  for (const b of all) {
    speciesMap.set(b.species, (speciesMap.get(b.species) ?? 0) + 1);
  }
  const speciesBreakdown = Array.from(speciesMap.entries())
    .map(([species, count]) => ({ species, count }))
    .sort((a, b) => b.count - a.count);

  const hasAnyWeightLogs = all.some((b) => (b.weightLogs?.length ?? 0) > 0);
  const notWeighedRecently = hasAnyWeightLogs
    ? all
        .filter((b) => {
          if (!["L1", "L2", "L3", "Pupa"].includes(b.stage)) return false;
          if (b.status === "Dead" || b.status === "Sold") return false;
          if (!b.weightLogs || b.weightLogs.length === 0) return true;
          const lastWeighed = Math.max(...b.weightLogs.map((w) => new Date(w.date).getTime()));
          return lastWeighed < fourteenDaysAgo.getTime();
        })
        .map(stripHeavy)
    : [];

  const sickBeetles = all.filter((b) => b.status === "Sick").map(stripHeavy);

  return {
    totalBeetles: all.length,
    byStage,
    byStatus,
    soilChangeDueToday,
    soilChangeDueThisWeek,
    speciesBreakdown,
    notWeighedRecently,
    sickBeetles,
  };
}
