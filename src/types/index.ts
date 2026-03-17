// ======================================================
// Beetle Farm Management – Core TypeScript Types
// ======================================================

export type BeetleStage = "Egg" | "L1" | "L2" | "L3" | "Pupa" | "Adult";
export type BeetleStatus = "Healthy" | "Sick" | "Dead" | "Sold";
export type BeetleSex = "Male" | "Female" | "Unknown";

// ---- Weight Log Entry ----
export interface WeightLog {
  _id?: string;
  weight: number;       // grams
  date: string;         // ISO date string
  note?: string;
}

// ---- Feeding Log Entry ----
export interface FeedingLog {
  _id?: string;
  date: string;
  feedType: string;     // e.g. "rotting wood", "fruit"
  amountGrams: number;
  note?: string;
}

// ---- Health Record ----
export interface HealthRecord {
  _id?: string;
  date: string;
  type: "Vaccine" | "Deworming" | "Illness" | "Treatment" | "Observation";
  description: string;
  treatedBy?: string;
  medication?: string;
  nextFollowUp?: string;
}

// ---- Parent Beetle Details ----
export interface ParentDetails {
  beetleId?: string;   // รหัสด้วงที่เป็นพ่อ/แม่
  size?: string;
  color?: string;
}

export interface ParentInfo {
  father?: ParentDetails;
  mother?: ParentDetails;
}

// ---- Beetle (main document) ----
export interface Beetle {
  _id?: string;
  beetleId: string;           // unique farm ID e.g. "BTL-001"
  species: string;            // e.g. "Dynastes hercules"
  lineage?: string;           // parent IDs or bloodline label
  sex: BeetleSex;
  stage: BeetleStage;
  status: BeetleStatus;
  birthDate?: string;
  entryDate: string;          // date added to farm record
  containerCode: string;      // box/container the beetle lives in
  currentWeightGrams?: number;
  weightLogs: WeightLog[];
  feedingLogs: FeedingLog[];
  healthRecords: HealthRecord[];
  parentInfo?: ParentInfo;
  quantity?: number;          // จำนวนตัวในบันทึกนี้ (default 1, >1 = กลุ่ม/batch)
  lengthMm?: number;          // ความยาว (mm) — ใช้กับ Adult แทน weight
  emergenceDate?: string;     // วันที่ออกจากดักแด้ (Adult)
  firstFeedingDate?: string;  // วันที่เริ่มกิน (Adult)
  lastSoilChange?: string;
  nextSoilChange?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ---- Dashboard Summary ----
export interface DashboardStats {
  totalBeetles: number;
  byStage: Record<BeetleStage, number>;
  byStatus: Record<BeetleStatus, number>;
  soilChangeDueToday: BeetleSummary[];
  soilChangeDueThisWeek: BeetleSummary[];
  speciesBreakdown: { species: string; count: number }[];
  notWeighedRecently: BeetleSummary[];
  sickBeetles: BeetleSummary[];
}

// ---- Light summary (used in lists/cards) ----
export interface BeetleSummary {
  _id: string;
  beetleId: string;
  species: string;
  stage: BeetleStage;
  status: BeetleStatus;
  containerCode: string;
  nextSoilChange?: string;
  currentWeightGrams?: number;
  quantity?: number;
}

// ---- API response helpers ----
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ======================================================
// Shared UI constants — single source of truth
// ======================================================

export const STAGES: BeetleStage[] = ["Egg", "L1", "L2", "L3", "Pupa", "Adult"];
export const STATUSES: BeetleStatus[] = ["Healthy", "Sick", "Dead", "Sold"];
export const SEXES: BeetleSex[] = ["Male", "Female", "Unknown"];

export const STAGE_LABEL: Record<BeetleStage, string> = {
  Egg: "ไข่",
  L1: "L1",
  L2: "L2",
  L3: "L3",
  Pupa: "ดักแด้",
  Adult: "ตัวเต็มวัย",
};

export const STAGE_ICON: Record<BeetleStage, string> = {
  Egg: "🥚",
  L1: "🐛",
  L2: "🐛",
  L3: "🐛",
  Pupa: "🫘",
  Adult: "🪲",
};

export const STATUS_LABEL: Record<BeetleStatus, string> = {
  Healthy: "สุขภาพดี",
  Sick: "ป่วย",
  Dead: "ตาย",
  Sold: "ขายแล้ว",
};

export const STATUS_STYLE: Record<BeetleStatus, string> = {
  Healthy: "bg-green-100 text-green-700",
  Sick: "bg-red-100 text-red-600",
  Dead: "bg-gray-200 text-gray-500",
  Sold: "bg-blue-100 text-blue-600",
};
