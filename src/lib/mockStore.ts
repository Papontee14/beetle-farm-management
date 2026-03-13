/**
 * In-memory mock data store
 * ทำงานเหมือน database แต่เก็บข้อมูลใน RAM
 * ข้อมูลจะรีเซ็ตทุกครั้งที่ Next.js hot-reload หรือ restart
 */

import { Beetle } from "@/types";

// ---- Helper ----
function isoDate(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
}

// ---- Seed data ----
const seedBeetles: Beetle[] = [
  {
    _id: "mock-001",
    beetleId: "BTL-001",
    name: "ไทกอน",
    species: "Dynastes hercules",
    lineage: "Imported EU 2025",
    sex: "Male",
    stage: "L3",
    status: "Healthy",
    containerCode: "BOX-A1",
    currentWeightGrams: 98.4,
    entryDate: isoDate(-120),
    birthDate: isoDate(-150),
    lastSoilChange: isoDate(-35),
    nextSoilChange: isoDate(-5),   // เลยกำหนดแล้ว → ขึ้น alert
    weightLogs: [
      { _id: "w1",  weight: 42.0,  date: isoDate(-120), note: "ชั่งครั้งแรก" },
      { _id: "w1b", weight: 51.5,  date: isoDate(-105) },
      { _id: "w1c", weight: 60.0,  date: isoDate(-90),  note: "เข้า L3" },
      { _id: "w1d", weight: 68.8,  date: isoDate(-75) },
      { _id: "w1e", weight: 75.3,  date: isoDate(-60) },
      { _id: "w1f", weight: 81.0,  date: isoDate(-45),  note: "เปลี่ยนดินใหม่" },
      { _id: "w1g", weight: 87.5,  date: isoDate(-30) },
      { _id: "w2",  weight: 93.2,  date: isoDate(-20) },
      { _id: "w2b", weight: 96.1,  date: isoDate(-14) },
      { _id: "w3",  weight: 98.4,  date: isoDate(-7),   note: "กินดีมาก" },
    ],
    feedingLogs: [
      { _id: "f1", date: isoDate(-10), feedType: "ไม้ผุผสมกากมะพร้าว", amountGrams: 500 },
    ],
    healthRecords: [
      {
        _id: "h1",
        date: isoDate(-30),
        type: "Observation",
        description: "ดูแข็งแรง ผิวมัน ไม่มีอาการผิดปกติ",
      },
    ],
    notes: "ตัวใหญ่ อยู่ในกล่อง 5L",
  },
  {
    _id: "mock-002",
    beetleId: "BTL-002",
    name: "ซูม่า",
    species: "Dynastes hercules",
    lineage: "Imported EU 2025",
    sex: "Female",
    stage: "L3",
    status: "Healthy",
    containerCode: "BOX-A2",
    currentWeightGrams: 82.1,
    entryDate: isoDate(-110),
    birthDate: isoDate(-140),
    lastSoilChange: isoDate(-28),
    nextSoilChange: isoDate(2),   // จะครบในอีก 2 วัน
    weightLogs: [
      { _id: "w4",  weight: 38.0, date: isoDate(-110), note: "ชั่งครั้งแรก" },
      { _id: "w4b", weight: 47.5, date: isoDate(-95) },
      { _id: "w4c", weight: 55.0, date: isoDate(-80) },
      { _id: "w4d", weight: 62.3, date: isoDate(-65) },
      { _id: "w4e", weight: 70.8, date: isoDate(-50) },
      { _id: "w4f", weight: 76.4, date: isoDate(-35),  note: "เปลี่ยนดิน" },
      { _id: "w5",  weight: 82.1, date: isoDate(-15) },
    ],
    feedingLogs: [],
    healthRecords: [],
  },
  {
    _id: "mock-003",
    beetleId: "BTL-003",
    name: "ฮีโร่",
    species: "Chalcosoma caucasus",
    lineage: "Thai Breed",
    sex: "Male",
    stage: "Pupa",
    status: "Healthy",
    containerCode: "BOX-B1",
    currentWeightGrams: 45.6,
    entryDate: isoDate(-200),
    lastSoilChange: isoDate(-15),
    nextSoilChange: isoDate(15),  // ยังไม่ถึงกำหนด
    weightLogs: [
      { _id: "w6", weight: 45.6, date: isoDate(-20) },
    ],
    feedingLogs: [],
    healthRecords: [],
  },
  {
    _id: "mock-004",
    beetleId: "BTL-004",
    name: "",
    species: "Xylotrupes gideon",
    lineage: "Local",
    sex: "Unknown",
    stage: "L2",
    status: "Sick",
    containerCode: "BOX-C1",
    currentWeightGrams: 18.3,
    entryDate: isoDate(-60),
    lastSoilChange: isoDate(-40),
    nextSoilChange: isoDate(-10),  // เลยกำหนดแล้ว → ขึ้น alert
    weightLogs: [
      { _id: "w7",  weight: 22.5, date: isoDate(-60), note: "ชั่งครั้งแรก" },
      { _id: "w7b", weight: 23.1, date: isoDate(-50) },
      { _id: "w7c", weight: 21.8, date: isoDate(-40) },
      { _id: "w7d", weight: 20.0, date: isoDate(-30), note: "สังเกตกินน้อยลง" },
      { _id: "w8",  weight: 18.3, date: isoDate(-5),  note: "น้ำหนักลด สังเกตอาการ" },
    ],
    feedingLogs: [],
    healthRecords: [
      {
        _id: "h2",
        date: isoDate(-5),
        type: "Illness",
        description: "สังเกตเห็นตัวนิ่ง ไม่ค่อยกินอาหาร",
        medication: "แยกกล่อง ปรับความชื้นดิน",
      },
    ],
  },
  {
    _id: "mock-005",
    beetleId: "BTL-005",
    name: "โกไดวา",
    species: "Dynastes neptune",
    lineage: "WF F1",
    sex: "Female",
    stage: "Adult",
    status: "Healthy",
    containerCode: "BOX-D1",
    currentWeightGrams: 32.0,
    entryDate: isoDate(-30),
    lastSoilChange: isoDate(-20),
    nextSoilChange: isoDate(10),
    weightLogs: [{ _id: "w9", weight: 32.0, date: isoDate(-30) }],
    feedingLogs: [
      { _id: "f2", date: isoDate(-5), feedType: "เยลลี่โปรตีน", amountGrams: 30 },
    ],
    healthRecords: [],
  },
  {
    _id: "mock-006",
    beetleId: "BTL-006",
    name: "",
    species: "Allomyrina dichotoma",
    lineage: "Thai Local",
    sex: "Unknown",
    stage: "Egg",
    status: "Healthy",
    containerCode: "BOX-E1",
    quantity: 1,
    currentWeightGrams: undefined,
    entryDate: isoDate(-5),
    weightLogs: [],
    feedingLogs: [],
    healthRecords: [],
  },
  {
    _id: "mock-007",
    beetleId: "BTL-007",
    name: "",
    species: "Dynastes hercules",
    lineage: "EU F1 x EU F1",
    sex: "Unknown",
    stage: "Egg",
    status: "Healthy",
    containerCode: "BOX-F1",
    quantity: 15,
    currentWeightGrams: undefined,
    entryDate: isoDate(-3),
    notes: "ออกไข่ล็อตใหม่ รอฟัก",
    weightLogs: [],
    feedingLogs: [],
    healthRecords: [],
  },
];

// ---- Global singleton (survives hot-reload via globalThis) ----
declare global {
  // eslint-disable-next-line no-var
  var __beetleStore: Beetle[] | undefined;
}

function getStore(): Beetle[] {
  if (!global.__beetleStore) {
    global.__beetleStore = seedBeetles.map((b) => ({ ...b }));
  }
  return global.__beetleStore;
}

// ---- CRUD helpers ----

export function findAll(filter?: {
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
}): Beetle[] {
  let data = getStore();

  if (filter?.search) {
    const q = filter.search.toLowerCase();
    data = data.filter(
      (b) =>
        b.beetleId.toLowerCase().includes(q) ||
        (b.name ?? "").toLowerCase().includes(q) ||
        b.species.toLowerCase().includes(q) ||
        b.containerCode.toLowerCase().includes(q) ||
        (b.lineage ?? "").toLowerCase().includes(q)
    );
  }
  if (filter?.stage)  data = data.filter((b) => b.stage === filter.stage);
  if (filter?.status) data = data.filter((b) => b.status === filter.status);
  if (filter?.sex)    data = data.filter((b) => b.sex === filter.sex);
  if (filter?.containerCode) {
    const cc = filter.containerCode.toLowerCase();
    data = data.filter((b) => b.containerCode.toLowerCase().includes(cc));
  }
  if (filter?.species) {
    const sp = filter.species.toLowerCase();
    data = data.filter((b) => b.species.toLowerCase().includes(sp));
  }
  if (filter?.fatherId) {
    const fid = filter.fatherId.toLowerCase();
    data = data.filter((b) => b.parentInfo?.father?.beetleId?.toLowerCase().includes(fid));
  }
  if (filter?.motherId) {
    const mid = filter.motherId.toLowerCase();
    data = data.filter((b) => b.parentInfo?.mother?.beetleId?.toLowerCase().includes(mid));
  }
  if (filter?.weightMin !== undefined) {
    data = data.filter((b) => (b.currentWeightGrams ?? 0) >= filter.weightMin!);
  }
  if (filter?.weightMax !== undefined) {
    data = data.filter((b) => b.currentWeightGrams !== undefined && b.currentWeightGrams <= filter.weightMax!);
  }
  if (filter?.soilWithinDays !== undefined) {
    const now = new Date();
    const limit = new Date(now);
    limit.setDate(limit.getDate() + filter.soilWithinDays);
    data = data.filter(
      (b) => b.nextSoilChange && new Date(b.nextSoilChange) <= limit
    );
  }
  if (filter?.soilDue) {
    const now = new Date();
    data = data.filter(
      (b) => b.nextSoilChange && new Date(b.nextSoilChange) <= now
    );
  }

  return data;
}

export function duplicateBeetle(
  id: string,
  opts: { newBeetleId: string; newContainerCode: string; splitQty: number }
): { original: Beetle; copy: Beetle } | null | undefined {
  const source = findById(id);
  if (!source) return undefined;
  // Check uniqueness of new beetle ID
  const idTaken = getStore().some(
    (b) => b.beetleId.toLowerCase() === opts.newBeetleId.toLowerCase() && b._id !== id
  );
  if (idTaken) return null; // null = duplicate ID conflict
  const remaining = (source.quantity ?? 1) - opts.splitQty;
  if (remaining < 0) return undefined;
  const updated = updateBeetle(id, { quantity: remaining > 0 ? remaining : 1 });
  if (!updated) return undefined;
  const copy = createBeetle({
    ...source,
    _id: undefined as unknown as string,
    beetleId: opts.newBeetleId,
    containerCode: opts.newContainerCode,
    quantity: opts.splitQty,
    weightLogs: [],
    feedingLogs: [],
    healthRecords: [],
    notes: `\u0e41\u0e22\u0e01\u0e08\u0e32\u0e01 ${source.beetleId}`,
    createdAt: undefined,
    updatedAt: undefined,
  });
  return { original: updated, copy };
}

export function findById(id: string): Beetle | undefined {
  return getStore().find((b) => b._id === id);
}

export function createBeetle(data: Omit<Beetle, "_id">): Beetle {
  const newBeetle: Beetle = {
    ...data,
    _id: `mock-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  getStore().push(newBeetle);
  return newBeetle;
}

export function updateBeetle(id: string, patch: Partial<Beetle>): Beetle | undefined {
  const store = getStore();
  const idx = store.findIndex((b) => b._id === id);
  if (idx === -1) return undefined;
  store[idx] = { ...store[idx], ...patch, updatedAt: new Date().toISOString() };
  return store[idx];
}

export function deleteBeetle(id: string): boolean {
  const store = getStore();
  const idx = store.findIndex((b) => b._id === id);
  if (idx === -1) return false;
  store.splice(idx, 1);
  return true;
}

/** บันทึกเปลี่ยนดิน */
export function recordSoilChange(id: string, daysUntilNext: number): Beetle | undefined {
  const now  = new Date();
  const next = new Date(now);
  next.setDate(next.getDate() + daysUntilNext);
  return updateBeetle(id, {
    lastSoilChange: now.toISOString(),
    nextSoilChange: next.toISOString(),
  });
}

/** Push weight log + sync currentWeightGrams */
export function addWeightLog(
  id: string,
  log: { weight: number; date: string; note?: string }
): Beetle | undefined {
  const beetle = findById(id);
  if (!beetle) return undefined;
  const existing = beetle.weightLogs ?? [];
  return updateBeetle(id, {
    weightLogs: [...existing, { _id: `wl-${Date.now()}`, ...log }],
    currentWeightGrams: log.weight,
  });
}

/** Push height record */
export function addHealthRecord(
  id: string,
  record: {
    type: string;
    description: string;
    medication?: string;
    treatedBy?: string;
    date: string;
  }
): Beetle | undefined {
  const beetle = findById(id);
  if (!beetle) return undefined;
  const existing = beetle.healthRecords ?? [];
  return updateBeetle(id, {
    healthRecords: [...existing, { _id: `hr-${Date.now()}`, ...record } as never],
  });
}

/** Push feeding log */
export function addFeedingLog(
  id: string,
  log: { feedType: string; amountGrams: number; date: string; note?: string }
): Beetle | undefined {
  const beetle = findById(id);
  if (!beetle) return undefined;
  const existing = beetle.feedingLogs ?? [];
  return updateBeetle(id, {
    feedingLogs: [...existing, { _id: `fl-${Date.now()}`, ...log }],
  });
}
