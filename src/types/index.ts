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
  name?: string;
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
}

// ---- Light summary (used in lists/cards) ----
export interface BeetleSummary {
  _id: string;
  beetleId: string;
  name?: string;
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
