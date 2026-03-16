"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import toast from "react-hot-toast";
import {
  Pencil, Trash2, Scale, ChevronLeft, AlertTriangle, Check, X, Copy, Leaf,
} from "lucide-react";
import { Beetle, BeetleStage, BeetleStatus, BeetleSex, WeightLog } from "@/types";
import WeightChart from "@/components/WeightChart";
import BeetleSearchInput from "@/components/BeetleSearchInput";
import FarmDatePicker from "@/components/FarmDatePicker";

const STAGES: BeetleStage[]  = ["Egg", "L1", "L2", "L3", "Pupa", "Adult"];
const STATUSES: BeetleStatus[] = ["Healthy", "Sick", "Dead", "Sold"];
const SEXES: BeetleSex[]     = ["Male", "Female", "Unknown"];

const STATUS_COLOR: Record<string, string> = {
  Healthy: "bg-green-100 text-green-700",
  Sick:    "bg-red-100 text-red-600",
  Dead:    "bg-gray-200 text-gray-500",
  Sold:    "bg-blue-100 text-blue-600",
};

export default function BeetleDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const [beetle, setBeetle]   = useState<Beetle | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [editForm, setEditForm] = useState<Partial<Beetle>>({});

  // Parent IDs in edit mode
  const [editFatherId, setEditFatherId] = useState("");
  const [editMotherId, setEditMotherId] = useState("");

  // Weight log form
  const [weightInput, setWeightInput] = useState("");
  const [weightNote,  setWeightNote]  = useState("");
  const [addingWeight, setAddingWeight] = useState(false);
  const [soilWithWeight, setSoilWithWeight] = useState(false);
  const [soilDays, setSoilDays] = useState("30");

  // Inline weight edit
  const [editingLogId, setEditingLogId]   = useState<string | null>(null);
  const [editLogWeight, setEditLogWeight] = useState("");
  const [editLogNote,   setEditLogNote]   = useState("");
  const [editLogDate,   setEditLogDate]   = useState("");

  // Duplicate modal
  const [showDuplicate, setShowDuplicate] = useState(false);
  const [dupNewId,      setDupNewId]      = useState("");
  const [dupContainer,  setDupContainer]  = useState("");
  const [dupQty,        setDupQty]        = useState("1");
  const [duplicating,   setDuplicating]   = useState(false);

  useEffect(() => {
    fetch(`/api/beetles/${id}`)
      .then((r) => r.json())
      .then((res) => { if (res.success) setBeetle(res.data); })
      .finally(() => setLoading(false));
  }, [id]);

  function startEditing() {
    setEditing(true);
    setEditForm({});
    setEditFatherId(beetle?.parentInfo?.father?.beetleId ?? "");
    setEditMotherId(beetle?.parentInfo?.mother?.beetleId ?? "");
  }

  async function handleSave() {
    if (!beetle) return;
    setSaving(true);
    try {
      const father = editFatherId
        ? { ...(beetle.parentInfo?.father ?? {}), beetleId: editFatherId }
        : beetle.parentInfo?.father;
      const mother = editMotherId
        ? { ...(beetle.parentInfo?.mother ?? {}), beetleId: editMotherId }
        : beetle.parentInfo?.mother;
      const parentInfo = (father || mother) ? { father, mother } : undefined;

      const res = await fetch(`/api/beetles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editForm, parentInfo }),
      });
      const data = await res.json();
      if (data.success) {
        setBeetle(data.data);
        setEditing(false);
        toast.success("บันทึกข้อมูลเรียบร้อย");
      } else toast.error(data.message);
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!confirm("ต้องการลบด้วงตัวนี้ใช่ไหม?")) return;
    const res = await fetch(`/api/beetles/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) { toast.success("ลบเรียบร้อย"); router.push("/beetles"); }
    else toast.error(data.message);
  }

  async function handleAddWeight(e: React.FormEvent) {
    e.preventDefault();
    if (!weightInput) return;
    setAddingWeight(true);
    try {
      const res = await fetch("/api/feeding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          beetleId: id,
          weightLog: { weight: Number(weightInput), date: new Date(), note: weightNote },
          soilChange: soilWithWeight ? { daysUntilNext: Number(soilDays) } : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBeetle(data.data);
        setWeightInput(""); setWeightNote(""); setSoilWithWeight(false);
        toast.success(soilWithWeight ? "บันทึกน้ำหนักและเปลี่ยนแมทเรียบร้อย!" : "บันทึกน้ำหนักเรียบร้อย");
      } else toast.error(data.message);
    } finally { setAddingWeight(false); }
  }

  async function handleDuplicate(e: React.FormEvent) {
    e.preventDefault();
    if (!beetle) return;
    const qty = Number(dupQty);
    const total = beetle.quantity ?? 1;
    if (qty >= total) { toast.error("จำนวนที่แยกต้องน้อยกว่าจำนวนในกล่องปัจจุบัน"); return; }
    setDuplicating(true);
    try {
      const res = await fetch(`/api/beetles/${id}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newBeetleId: dupNewId, newContainerCode: dupContainer, splitQty: qty }),
      });
      const data = await res.json();
      if (data.success) {
        setBeetle(data.data.original);
        setShowDuplicate(false);
        setDupNewId(""); setDupContainer(""); setDupQty("1");
        toast.success(`แยกกล่องเรียบร้อย! สร้าง ${data.data.copy.beetleId} แล้ว`);
      } else toast.error(data.message);
    } finally { setDuplicating(false); }
  }

  function startEditLog(w: WeightLog) {
    setEditingLogId(w._id ?? null);
    setEditLogWeight(String(w.weight));
    setEditLogNote(w.note ?? "");
    setEditLogDate(w.date.slice(0, 10));
  }

  async function saveEditLog() {
    if (!beetle || !editingLogId) return;
    const updatedLogs: WeightLog[] = beetle.weightLogs.map((w) =>
      w._id === editingLogId
        ? { ...w, weight: Number(editLogWeight), note: editLogNote, date: new Date(editLogDate).toISOString() }
        : w
    );
    // Sort ascending by date and pick last for currentWeight
    const sorted = [...updatedLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const currentWeightGrams = sorted.at(-1)?.weight;
    const res = await fetch(`/api/beetles/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weightLogs: updatedLogs, currentWeightGrams }),
    });
    const data = await res.json();
    if (data.success) {
      setBeetle(data.data);
      setEditingLogId(null);
      toast.success("แก้ไขน้ำหนักเรียบร้อย");
    } else toast.error(data.message);
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-10 h-10 border-4 border-forest-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!beetle) return (
    <div className="card mt-6 flex items-center gap-3 text-red-600">
      <AlertTriangle size={20} /> ไม่พบข้อมูลด้วง
    </div>
  );

  const setEF = (k: keyof Beetle, v: string | number) =>
    setEditForm((f) => ({ ...f, [k]: v }));

  const totalQty = beetle.quantity ?? 1;

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-2 pt-2">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">
          <ChevronLeft size={24} />
        </button>
        <h1 className="flex-1 text-xl font-bold text-forest-800 truncate">
          {beetle.beetleId}
        </h1>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_COLOR[beetle.status] ?? "bg-gray-100"}`}>
          {beetle.status}
        </span>
      </div>

      {/* Info card */}
      <div className="card space-y-2">
        {!editing ? (
          /* ── View mode ── */
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {([
              ["สายพันธุ์", beetle.species],
              ["สายเลือด", beetle.lineage ?? "–"],
              ["เพศ", beetle.sex],
              ["ระยะ", beetle.stage],
              ["จำนวน", totalQty > 1 ? `${totalQty} ตัว (กลุ่ม)` : "1 ตัว"],
              ["กล่อง", beetle.containerCode],
              beetle.stage === "Adult"
                ? ["ความยาว", beetle.lengthMm ? `${beetle.lengthMm} mm` : "–"]
                : ["น้ำหนัก", beetle.currentWeightGrams ? `${beetle.currentWeightGrams} g` : "–"],
              ["วันเกิด", beetle.birthDate ? format(new Date(beetle.birthDate), "d MMM yy", { locale: th }) : "–"],
              ["เข้าฟาร์ม", beetle.entryDate ? format(new Date(beetle.entryDate), "d MMM yy", { locale: th }) : "–"],
              ...(beetle.stage !== "Egg" && beetle.stage !== "Adult" ? [
                ["เปลี่ยนแมทล่าสุด", beetle.lastSoilChange ? format(new Date(beetle.lastSoilChange), "d MMM yy", { locale: th }) : "–"],
                ["นัดเปลี่ยนแมท", beetle.nextSoilChange ? format(new Date(beetle.nextSoilChange), "d MMM yy", { locale: th }) : "–"],
              ] as [string, string][] : []),
              ...(beetle.stage === "Adult" ? [
                ["ออกจากดักแด้", beetle.emergenceDate ? format(new Date(beetle.emergenceDate), "d MMM yy", { locale: th }) : "–"],
                ["เริ่มกิน", beetle.firstFeedingDate ? format(new Date(beetle.firstFeedingDate), "d MMM yy", { locale: th }) : "–"],
              ] : []),
            ] as [string, string][]).map(([label, value]) => (
              <div key={label}>
                <p className="text-gray-400 text-xs">{label}</p>
                <p className="font-semibold">{value}</p>
              </div>
            ))}
            {/* Parent info – clickable links when beetleId is present */}
            {beetle.parentInfo && (beetle.parentInfo.father || beetle.parentInfo.mother) && (
              <div className="col-span-2 pt-1 border-t border-gray-100">
                <p className="text-gray-400 text-xs mb-1">พ่อแม่พันธุ์</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {beetle.parentInfo.father && (
                    <div>
                      <p className="text-gray-400 text-xs">พ่อ</p>
                      {beetle.parentInfo.father.beetleId ? (
                        <Link
                          href={`/beetles?search=${encodeURIComponent(beetle.parentInfo.father.beetleId)}`}
                          className="font-semibold text-xs text-forest-600 underline underline-offset-2"
                        >
                          {beetle.parentInfo.father.beetleId}
                        </Link>
                      ) : (
                        <p className="font-semibold text-xs">
                          {[beetle.parentInfo.father.size, beetle.parentInfo.father.color].filter(Boolean).join(" · ") || "–"}
                        </p>
                      )}
                    </div>
                  )}
                  {beetle.parentInfo.mother && (
                    <div>
                      <p className="text-gray-400 text-xs">แม่</p>
                      {beetle.parentInfo.mother.beetleId ? (
                        <Link
                          href={`/beetles?search=${encodeURIComponent(beetle.parentInfo.mother.beetleId)}`}
                          className="font-semibold text-xs text-forest-600 underline underline-offset-2"
                        >
                          {beetle.parentInfo.mother.beetleId}
                        </Link>
                      ) : (
                        <p className="font-semibold text-xs">
                          {[beetle.parentInfo.mother.size, beetle.parentInfo.mother.color].filter(Boolean).join(" · ") || "–"}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            {beetle.notes && (
              <div className="col-span-2">
                <p className="text-gray-400 text-xs">หมายเหตุ</p>
                <p className="font-semibold">{beetle.notes}</p>
              </div>
            )}
          </div>
        ) : (
          /* ── Edit mode ── */
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              {([
                ["species",       "สายพันธุ์",   "text"],
                ["lineage",       "สายเลือด",    "text"],
                ["containerCode", "กล่อง",       "text"],
                ...(beetle.stage === "Adult"
                  ? [["lengthMm", "ความยาว (mm)", "number"]] as [keyof Beetle, string, string][]
                  : [["currentWeightGrams", "น้ำหนัก (g)", "number"]] as [keyof Beetle, string, string][]
                ),
                ["quantity",      "จำนวนตัว",    "number"],
              ] as [keyof Beetle, string, string][]).map(([k, lbl, t]) => (
                <div key={k}>
                  <label className="label">{lbl}</label>
                  <input className="input-field" type={t}
                    defaultValue={beetle[k] as string}
                    onChange={(e) => setEF(k, t === "number" ? Number(e.target.value) : e.target.value)} />
                </div>
              ))}
              <div>
                <label className="label">ระยะ</label>
                <select className="input-field" defaultValue={beetle.stage}
                  onChange={(e) => setEF("stage", e.target.value)}>
                  {STAGES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">สถานะ</label>
                <select className="input-field" defaultValue={beetle.status}
                  onChange={(e) => setEF("status", e.target.value)}>
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">เพศ</label>
                <select className="input-field" defaultValue={beetle.sex}
                  onChange={(e) => setEF("sex", e.target.value)}>
                  {SEXES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              {(editForm.stage ?? beetle.stage) !== "Egg" && (editForm.stage ?? beetle.stage) !== "Adult" && (
                <div>
                  <label className="label">นัดเปลี่ยนแมท</label>
                  <FarmDatePicker
                    value={
                      typeof editForm.nextSoilChange === "string"
                        ? editForm.nextSoilChange
                        : (beetle.nextSoilChange ? beetle.nextSoilChange.slice(0, 10) : "")
                    }
                    onChange={(value) => setEF("nextSoilChange", value)}
                    placeholder="เลือกวันที่นัดเปลี่ยนแมท"
                  />
                </div>
              )}
            </div>
            <div>
              <label className="label">หมายเหตุ</label>
              <textarea className="input-field h-20 resize-none" defaultValue={beetle.notes ?? ""}
                onChange={(e) => setEF("notes", e.target.value)} />
            </div>
            {/* Parent beetle ID search */}
            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                พ่อแม่พันธุ์ (ค้นหาจากรายการที่มี)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <BeetleSearchInput
                  label="รหัสพ่อ"
                  value={editFatherId}
                  onChange={setEditFatherId}
                  excludeId={id}
                />
                <BeetleSearchInput
                  label="รหัสแม่"
                  value={editMotherId}
                  onChange={setEditMotherId}
                  excludeId={id}
                />
              </div>
            </div>
          </div>
        )}

        {/* Edit / Save buttons */}
        <div className="flex gap-2 pt-2">
          {!editing ? (
            <>
              <button className="btn-secondary flex-1" onClick={startEditing}>
                <Pencil size={14} /> แก้ไข
              </button>
              <button className="btn-danger" onClick={handleDelete}>
                <Trash2 size={14} />
              </button>
            </>
          ) : (
            <>
              <button className="btn-primary flex-1" disabled={saving} onClick={handleSave}>
                {saving ? "กำลังบันทึก…" : "บันทึก"}
              </button>
              <button className="btn-secondary" onClick={() => setEditing(false)}>ยกเลิก</button>
            </>
          )}
        </div>
      </div>

      {/* ── แยกกล่อง (Duplicate) — visible when quantity > 1 ── */}
      {totalQty > 1 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Copy size={16} className="text-violet-500" />
            <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide">แยกกล่อง</h2>
            <span className="ml-auto text-xs text-gray-400">มีหนอน {totalQty} ตัว</span>
          </div>
          {!showDuplicate ? (
            <button
              className="btn-secondary w-full !text-violet-600 !border-violet-300 hover:!bg-violet-50"
              onClick={() => setShowDuplicate(true)}
            >
              <Copy size={14} /> แยกหนอนออกกล่องใหม่
            </button>
          ) : (
            <form onSubmit={handleDuplicate} className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">รหัสด้วงใหม่ *</label>
                  <input
                    className="input-field"
                    placeholder="BTL-XXX"
                    required
                    value={dupNewId}
                    onChange={(e) => setDupNewId(e.target.value.toUpperCase())}
                  />
                </div>
                <div>
                  <label className="label">รหัสกล่องใหม่ *</label>
                  <input
                    className="input-field"
                    placeholder="BOX-XX"
                    required
                    value={dupContainer}
                    onChange={(e) => setDupContainer(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="label">จำนวนที่แยก (สูงสุด {totalQty - 1} ตัว)</label>
                <input
                  className="input-field"
                  type="number" min="1" max={totalQty - 1}
                  required
                  value={dupQty}
                  onChange={(e) => setDupQty(e.target.value)}
                />
                {Number(dupQty) > 0 && Number(dupQty) < totalQty && (
                  <p className="text-xs text-gray-400 mt-1">
                    กล่องเดิมเหลือ {totalQty - Number(dupQty)} ตัว · กล่องใหม่มี {dupQty} ตัว
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={duplicating} className="btn-primary flex-1">
                  {duplicating ? "กำลังแยก…" : "ยืนยันแยกกล่อง"}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setShowDuplicate(false)}>
                  ยกเลิก
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ── Weight log section ── */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2">
          <Scale size={16} className="text-forest-600" />
          <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide">น้ำหนักหนอน</h2>
          {beetle.weightLogs && beetle.weightLogs.length > 0 && (
            <span className="ml-auto text-xs text-gray-400">
              ล่าสุด {beetle.currentWeightGrams} g
            </span>
          )}
        </div>

        {beetle.weightLogs && beetle.weightLogs.length >= 2 && (
          <WeightChart weightLogs={beetle.weightLogs} />
        )}

        {/* Add weight form + optional soil change */}
        <form onSubmit={handleAddWeight} className="space-y-2">
          <div className="flex gap-2">
            <input
              className="input-field flex-1"
              type="number" min="0" step="0.1"
              placeholder="น้ำหนัก (g)"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
            />
            <input
              className="input-field flex-1"
              placeholder="หมายเหตุ"
              value={weightNote}
              onChange={(e) => setWeightNote(e.target.value)}
            />
            <button type="submit" disabled={addingWeight} className="btn-primary !px-4 shrink-0">
              บันทึก
            </button>
          </div>
          {/* เปลี่ยนแมทพร้อมกัน — only for larvae/pupa */}
          {beetle.stage !== "Egg" && beetle.stage !== "Adult" && (
            <>
              <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-forest-600"
                  checked={soilWithWeight}
                  onChange={(e) => setSoilWithWeight(e.target.checked)}
                />
                <Leaf size={14} className="text-soil-600" />
                <span className="text-gray-600">เปลี่ยนแมทพร้อมกัน</span>
              </label>
              {soilWithWeight && (
                <div className="flex items-center gap-2 pl-6 text-sm">
                  <span className="text-gray-500 shrink-0">นัดครั้งต่อไปใน</span>
                  <select
                    className="input-field !py-2 !min-h-0 w-28"
                    value={soilDays}
                    onChange={(e) => setSoilDays(e.target.value)}
                  >
                    {["14", "21", "30", "45", "60", "90"].map((d) => (
                      <option key={d} value={d}>{d} วัน</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}
        </form>

        {/* Log history with inline edit */}
        {beetle.weightLogs && beetle.weightLogs.length > 0 ? (
          <>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">ประวัติการชั่ง</p>
            <ul className="divide-y divide-gray-100 text-sm">
              {[...beetle.weightLogs]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((w) =>
                  editingLogId === w._id ? (
                    <li key={w._id} className="py-2 space-y-1.5">
                      <div className="flex gap-2">
                        <input
                          className="input-field flex-1 !py-1.5 !text-sm"
                          type="number" min="0" step="0.1"
                          value={editLogWeight}
                          onChange={(e) => setEditLogWeight(e.target.value)}
                        />
                        <FarmDatePicker
                          value={editLogDate}
                          onChange={setEditLogDate}
                          className="w-36 shrink-0"
                          placeholder="เลือกวันที่"
                        />
                      </div>
                      <input
                        className="input-field !py-1.5 !text-sm"
                        placeholder="หมายเหตุ"
                        value={editLogNote}
                        onChange={(e) => setEditLogNote(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <button onClick={saveEditLog} className="btn-primary !py-1.5 !px-3 text-xs flex-1">
                          <Check size={13} /> บันทึก
                        </button>
                        <button onClick={() => setEditingLogId(null)} className="btn-secondary !py-1.5 !px-3 text-xs">
                          <X size={13} />
                        </button>
                      </div>
                    </li>
                  ) : (
                    <li key={w._id} className="flex items-center gap-2 py-1.5 group">
                      <span className="text-gray-400 text-xs w-20 shrink-0">
                        {format(new Date(w.date), "d MMM yy", { locale: th })}
                      </span>
                      <span className="font-bold text-forest-700">{w.weight} g</span>
                      {w.note && (
                        <span className="text-gray-400 text-xs truncate flex-1">{w.note}</span>
                      )}
                      <button
                        onClick={() => startEditLog(w)}
                        className="ml-auto shrink-0 text-gray-300 hover:text-forest-600 transition-colors"
                        aria-label="แก้ไข"
                      >
                        <Pencil size={13} />
                      </button>
                    </li>
                  )
                )}
            </ul>
          </>
        ) : (
          <p className="text-gray-400 text-xs text-center py-2">ยังไม่มีบันทึกน้ำหนัก</p>
        )}
      </div>
    </div>
  );
}
