"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import toast from "react-hot-toast";
import {
  Pencil, Trash2, Scale, ChevronLeft, AlertTriangle, Check, X
} from "lucide-react";
import { Beetle, BeetleStage, BeetleStatus, BeetleSex, WeightLog } from "@/types";
import WeightChart from "@/components/WeightChart";

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

  // Weight log form
  const [weightInput, setWeightInput] = useState("");
  const [weightNote,  setWeightNote]  = useState("");
  const [addingWeight, setAddingWeight] = useState(false);

  // Inline weight edit
  const [editingLogId, setEditingLogId]   = useState<string | null>(null);
  const [editLogWeight, setEditLogWeight] = useState("");
  const [editLogNote,   setEditLogNote]   = useState("");
  const [editLogDate,   setEditLogDate]   = useState("");

  useEffect(() => {
    fetch(`/api/beetles/${id}`)
      .then((r) => r.json())
      .then((res) => { if (res.success) setBeetle(res.data); })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/beetles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
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
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBeetle(data.data);
        setWeightInput(""); setWeightNote("");
        toast.success("บันทึกน้ำหนักเรียบร้อย");
      } else toast.error(data.message);
    } finally { setAddingWeight(false); }
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

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-2 pt-2">
        <Link href="/beetles" className="text-gray-400 hover:text-gray-600">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="flex-1 text-xl font-bold text-forest-800 truncate">
          {beetle.beetleId}{beetle.name ? ` — ${beetle.name}` : ""}
        </h1>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_COLOR[beetle.status] ?? "bg-gray-100"}`}>
          {beetle.status}
        </span>
      </div>

      {/* Info card */}
      <div className="card space-y-2">
        {!editing ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {[
              ["สายพันธุ์", beetle.species],
              ["สายเลือด", beetle.lineage ?? "–"],
              ["เพศ", beetle.sex],
              ["ระยะ", beetle.stage],
              ["จำนวน", (beetle.quantity ?? 1) > 1 ? `${beetle.quantity} ตัว (กลุ่ม)` : "1 ตัว"],
              ["กล่อง", beetle.containerCode],
              beetle.stage === "Adult"
                ? ["ความยาว", beetle.lengthMm ? `${beetle.lengthMm} mm` : "–"]
                : ["น้ำหนัก", beetle.currentWeightGrams ? `${beetle.currentWeightGrams} g` : "–"],
              ["วันเกิด", beetle.birthDate ? format(new Date(beetle.birthDate), "d MMM yy", { locale: th }) : "–"],
              ["เข้าฟาร์ม", beetle.entryDate ? format(new Date(beetle.entryDate), "d MMM yy", { locale: th }) : "–"],
              ["เปลี่ยนแมทล่าสุด", beetle.lastSoilChange ? format(new Date(beetle.lastSoilChange), "d MMM yy", { locale: th }) : "–"],
              ["นัดเปลี่ยนแมท", beetle.nextSoilChange ? format(new Date(beetle.nextSoilChange), "d MMM yy", { locale: th }) : "–"],
              ...(beetle.stage === "Adult" ? [
                ["ออกจากดักแด้", beetle.emergenceDate ? format(new Date(beetle.emergenceDate), "d MMM yy", { locale: th }) : "–"],
                ["เริ่มกิน", beetle.firstFeedingDate ? format(new Date(beetle.firstFeedingDate), "d MMM yy", { locale: th }) : "–"],
              ] : []),
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-gray-400 text-xs">{label}</p>
                <p className="font-semibold">{value}</p>
              </div>
            ))}
            {beetle.parentInfo && (beetle.parentInfo.father || beetle.parentInfo.mother) && (
              <div className="col-span-2 pt-1 border-t border-gray-100">
                <p className="text-gray-400 text-xs mb-1">พ่อแม่พันธุ์</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {beetle.parentInfo.father && (
                    <div>
                      <p className="text-gray-400 text-xs">พ่อ</p>
                      <p className="font-semibold text-xs">
                        {[beetle.parentInfo.father.size, beetle.parentInfo.father.color].filter(Boolean).join(" · ") || "–"}
                      </p>
                    </div>
                  )}
                  {beetle.parentInfo.mother && (
                    <div>
                      <p className="text-gray-400 text-xs">แม่</p>
                      <p className="font-semibold text-xs">
                        {[beetle.parentInfo.mother.size, beetle.parentInfo.mother.color].filter(Boolean).join(" · ") || "–"}
                      </p>
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
              <div>
                <label className="label">นัดเปลี่ยนแมท</label>
                <input className="input-field" type="date"
                  defaultValue={beetle.nextSoilChange ? beetle.nextSoilChange.slice(0, 10) : ""}
                  onChange={(e) => setEF("nextSoilChange", e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">หมายเหตุ</label>
              <textarea className="input-field h-20 resize-none" defaultValue={beetle.notes ?? ""}
                onChange={(e) => setEF("notes", e.target.value)} />
            </div>
          </div>
        )}

        {/* Edit / Save buttons */}
        <div className="flex gap-2 pt-2">
          {!editing ? (
            <>
              <button className="btn-secondary flex-1" onClick={() => { setEditing(true); setEditForm({}); }}>
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

      {/* Weight log section */}
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

        {/* Line chart — shown only when >= 2 data points */}
        {beetle.weightLogs && beetle.weightLogs.length >= 2 && (
          <WeightChart weightLogs={beetle.weightLogs} />
        )}

        {/* Add weight form */}
        <form onSubmit={handleAddWeight} className="flex gap-2">
          <input className="input-field flex-1" type="number" min="0" step="0.1" placeholder="น้ำหนัก (g)"
            value={weightInput} onChange={(e) => setWeightInput(e.target.value)} />
          <input className="input-field flex-1" placeholder="หมายเหตุ"
            value={weightNote} onChange={(e) => setWeightNote(e.target.value)} />
          <button type="submit" disabled={addingWeight} className="btn-primary !px-4 shrink-0">
            บันทึก
          </button>
        </form>

        {/* Log history with inline edit */}
        {beetle.weightLogs && beetle.weightLogs.length > 0 ? (
          <>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">ประวัติการชั่ง</p>
            <ul className="divide-y divide-gray-100 text-sm max-h-52 overflow-y-auto">
              {[...beetle.weightLogs]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((w) =>
                  editingLogId === w._id ? (
                    // Inline edit row
                    <li key={w._id} className="py-2 space-y-1.5">
                      <div className="flex gap-2">
                        <input
                          className="input-field flex-1 !py-1.5 !text-sm"
                          type="number" min="0" step="0.1"
                          value={editLogWeight}
                          onChange={(e) => setEditLogWeight(e.target.value)}
                        />
                        <input
                          className="input-field !py-1.5 !text-sm w-28 shrink-0"
                          type="date"
                          value={editLogDate}
                          onChange={(e) => setEditLogDate(e.target.value)}
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
                    // Normal row
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
