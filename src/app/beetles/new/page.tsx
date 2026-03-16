"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { BeetleStage, BeetleStatus, BeetleSex } from "@/types";
import FarmSelect from "@/components/FarmSelect";
import FarmDatePicker from "@/components/FarmDatePicker";

const STAGES: BeetleStage[] = ["Egg", "L1", "L2", "L3", "Pupa", "Adult"];
const STATUSES: BeetleStatus[] = ["Healthy", "Sick", "Dead", "Sold"];
const SEXES: BeetleSex[] = ["Male", "Female", "Unknown"];

export default function NewBeetlePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [speciesList, setSpeciesList] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/beetles")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const all: string[] = (d.data as { species: string }[])
            .map((b) => b.species)
            .filter(Boolean);
          const unique = all.filter((v, i) => all.indexOf(v) === i);
          setSpeciesList(unique);
        }
      })
      .catch(() => {});
  }, []);

  const [form, setForm] = useState({
    beetleId:      "",
    name:          "",
    species:       "",
    lineage:       "",
    sex:           "Unknown" as BeetleSex,
    stage:         "L1" as BeetleStage,
    status:        "Healthy" as BeetleStatus,
    containerCode: "",
    birthDate:     "",
    entryDate:     new Date().toISOString().slice(0, 10),
    currentWeightGrams: "",
    lastSoilChange:"",
    nextSoilChange:"",
    notes:         "",
    fatherSize:    "",
    fatherColor:   "",
    motherSize:    "",
    motherColor:   "",
    quantity:      "1",
    lengthMm:      "",
    emergenceDate: "",
    firstFeedingDate: "",
  });

  const isAdult = form.stage === "Adult";

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { fatherSize, fatherColor, motherSize, motherColor, ...rest } = form;
      const parentInfo =
        fatherSize || fatherColor || motherSize || motherColor
          ? {
              father: fatherSize || fatherColor ? { size: fatherSize || undefined, color: fatherColor || undefined } : undefined,
              mother: motherSize || motherColor ? { size: motherSize || undefined, color: motherColor || undefined } : undefined,
            }
          : undefined;
      const payload = {
        ...rest,
        currentWeightGrams: (!isAdult && rest.currentWeightGrams) ? Number(rest.currentWeightGrams) : undefined,
        lengthMm:           (isAdult && rest.lengthMm) ? Number(rest.lengthMm) : undefined,
        birthDate:          rest.birthDate || undefined,
        emergenceDate:      (isAdult && rest.emergenceDate) ? rest.emergenceDate : undefined,
        firstFeedingDate:   (isAdult && rest.firstFeedingDate) ? rest.firstFeedingDate : undefined,
        lastSoilChange:     rest.lastSoilChange || undefined,
        nextSoilChange:     rest.nextSoilChange || undefined,
        quantity:           rest.quantity ? Number(rest.quantity) : 1,
        parentInfo,
      };
      const res = await fetch("/api/beetles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("เพิ่มด้วงเรียบร้อย!");
        router.push(`/beetles/${data.data._id}`);
      } else {
        toast.error(data.message ?? "เกิดข้อผิดพลาด");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 pb-8">
      <h1 className="text-xl font-bold text-forest-800 pt-2">เพิ่มด้วงใหม่</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Identity */}
        <div className="card space-y-3">
          <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide">ข้อมูลประจำตัว</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label">รหัสด้วง *</label>
              <input className="input-field" placeholder="BTL-001" required
                value={form.beetleId} onChange={(e) => set("beetleId", e.target.value)} />
            </div>
            <div>
              <label className="label">ชื่อเล่น</label>
              <input className="input-field" placeholder="(ไม่บังคับ)"
                value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">สายพันธุ์ *</label>
            <input
              className="input-field"
              placeholder="เช่น Dynastes hercules"
              required
              list="species-datalist"
              value={form.species}
              onChange={(e) => set("species", e.target.value)}
            />
            <datalist id="species-datalist">
              {speciesList.map((s) => <option key={s} value={s} />)}
            </datalist>
          </div>
          <div>
            <label className="label">สายเลือด / พ่อแม่</label>
            <input className="input-field" placeholder="เช่น BTL-Parent-A x BTL-Parent-B"
              value={form.lineage} onChange={(e) => set("lineage", e.target.value)} />
          </div>
        </div>

        {/* Quantity */}
        <div className="card space-y-3">
          <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide">จำนวน</h2>
          <div>
            <label className="label">จำนวนตัวในกล่อง</label>
            <input
              className="input-field"
              type="number"
              min="1"
              step="1"
              placeholder="1"
              value={form.quantity}
              onChange={(e) => set("quantity", e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">
              ถ้า &gt; 1 จะถูกบันทึกเป็นกลุ่ม (batch) เช่น ไข่ 15 ฟองในกล่องเดียว
            </p>
          </div>
        </div>

        {/* Stage & Status */}
        <div className="card space-y-3">
          <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide">สถานะ</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="label">เพศ</label>
              <FarmSelect
                value={form.sex}
                onChange={(v) => set("sex", v)}
                options={SEXES.map((s) => ({ value: s, label: s }))}
              />
            </div>
            <div>
              <label className="label">ระยะ *</label>
              <FarmSelect
                value={form.stage}
                onChange={(v) => set("stage", v)}
                options={STAGES.map((s) => ({ value: s, label: s }))}
              />
            </div>
            <div>
              <label className="label">สุขภาพ</label>
              <FarmSelect
                value={form.status}
                onChange={(v) => set("status", v)}
                options={STATUSES.map((s) => ({ value: s, label: s }))}
              />
            </div>
          </div>
        </div>

        {/* Location & Weight / Length */}
        <div className="card space-y-3">
          <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide">
            กล่อง &amp; {isAdult ? "ความยาว" : "น้ำหนัก"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label">รหัสกล่อง *</label>
              <input className="input-field" placeholder="BOX-01" required
                value={form.containerCode} onChange={(e) => set("containerCode", e.target.value)} />
            </div>
            {isAdult ? (
              <div>
                <label className="label">ความยาว (mm)</label>
                <input className="input-field" type="number" min="0" step="0.1" placeholder="0.0"
                  value={form.lengthMm} onChange={(e) => set("lengthMm", e.target.value)} />
              </div>
            ) : (
              <div>
                <label className="label">น้ำหนัก (กรัม)</label>
                <input className="input-field" type="number" min="0" step="0.1" placeholder="0.0"
                  value={form.currentWeightGrams} onChange={(e) => set("currentWeightGrams", e.target.value)} />
              </div>
            )}
          </div>
        </div>

        {/* Dates */}
        <div className="card space-y-3">
          <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide">วันที่</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {isAdult ? (
              <>
                <div>
                  <label className="label">วันที่ออกจากดักแด้</label>
                  <FarmDatePicker
                    value={form.emergenceDate}
                    onChange={(v) => set("emergenceDate", v)}
                  />
                </div>
                <div>
                  <label className="label">วันที่เริ่มกิน</label>
                  <FarmDatePicker
                    value={form.firstFeedingDate}
                    onChange={(v) => set("firstFeedingDate", v)}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="label">วันเกิด</label>
                  <FarmDatePicker
                    value={form.birthDate}
                    onChange={(v) => set("birthDate", v)}
                  />
                </div>
                <div>
                  <label className="label">วันที่เข้าฟาร์ม *</label>
                  <FarmDatePicker
                    value={form.entryDate}
                    onChange={(v) => set("entryDate", v)}
                  />
                </div>
              </>
            )}
            {!isAdult && (
              <>
                <div>
                  <label className="label">เปลี่ยนแมทล่าสุด</label>
                  <FarmDatePicker
                    value={form.lastSoilChange}
                    onChange={(v) => set("lastSoilChange", v)}
                  />
                </div>
                <div>
                  <label className="label">นัดเปลี่ยนแมทครั้งหน้า</label>
                  <FarmDatePicker
                    value={form.nextSoilChange}
                    onChange={(v) => set("nextSoilChange", v)}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Parent Info */}
        <div className="card space-y-3">
          <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide">ข้อมูลพ่อแม่พันธุ์</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label">ขนาดพ่อพันธุ์</label>
              <input className="input-field" placeholder="เช่น 85mm"
                value={form.fatherSize} onChange={(e) => set("fatherSize", e.target.value)} />
            </div>
            <div>
              <label className="label">สีพ่อพันธุ์</label>
              <input className="input-field" placeholder="เช่น Dark Brown"
                value={form.fatherColor} onChange={(e) => set("fatherColor", e.target.value)} />
            </div>
            <div>
              <label className="label">ขนาดแม่พันธุ์</label>
              <input className="input-field" placeholder="เช่น 45mm"
                value={form.motherSize} onChange={(e) => set("motherSize", e.target.value)} />
            </div>
            <div>
              <label className="label">สีแม่พันธุ์</label>
              <input className="input-field" placeholder="เช่น Golden"
                value={form.motherColor} onChange={(e) => set("motherColor", e.target.value)} />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card">
          <label className="label">หมายเหตุ</label>
          <textarea className="input-field h-24 resize-none" placeholder="บันทึกเพิ่มเติม…"
            value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? "กำลังบันทึก…" : "บันทึกข้อมูลด้วง"}
        </button>
      </form>
    </div>
  );
}
