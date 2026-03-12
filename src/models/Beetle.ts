/**
 * Mongoose Schema for Beetle Farm Management
 *
 * Prompt: สร้าง Mongoose Schema สำหรับฟาร์มด้วง (Beetle)
 * โดยมีฟิลด์ดังนี้:
 * - beetleId: String (รหัสประจำตัว)
 * - species: String (สายพันธุ์)
 * - stage: Enum ('Egg', 'L1', 'L2', 'L3', 'Pupa', 'Adult')
 * - lineage: String (สายเลือด/พ่อแม่)
 * - weightLogs: Array ของ Object (ประกอบด้วย weight เป็น Number และ date เป็น Date)
 * - lastSoilChange: Date (วันที่เปลี่ยนดินครั้งล่าสุด)
 * - nextSoilChange: Date (กำหนดการเปลี่ยนดินครั้งต่อไป)
 */

import mongoose, { Schema, Model, Document } from "mongoose";

// ---- Sub-schemas ----

const WeightLogSchema = new Schema(
  {
    weight: { type: Number, required: true, min: 0 },
    date:   { type: Date,   required: true, default: Date.now },
    note:   { type: String, trim: true },
  },
  { _id: true }
);

const FeedingLogSchema = new Schema(
  {
    date:         { type: Date,   required: true, default: Date.now },
    feedType:     { type: String, required: true, trim: true },
    amountGrams:  { type: Number, required: true, min: 0 },
    note:         { type: String, trim: true },
  },
  { _id: true }
);

const HealthRecordSchema = new Schema(
  {
    date:         { type: Date,   required: true, default: Date.now },
    type:         {
      type: String,
      required: true,
      enum: ["Vaccine", "Deworming", "Illness", "Treatment", "Observation"],
    },
    description:  { type: String, required: true, trim: true },
    treatedBy:    { type: String, trim: true },
    medication:   { type: String, trim: true },
    nextFollowUp: { type: Date },
  },
  { _id: true }
);

// ---- Main Beetle Schema ----

export interface IBeetle extends Document {
  beetleId: string;
  name?: string;
  species: string;
  lineage?: string;
  sex: "Male" | "Female" | "Unknown";
  stage: "Egg" | "L1" | "L2" | "L3" | "Pupa" | "Adult";
  status: "Healthy" | "Sick" | "Dead" | "Sold";
  birthDate?: Date;
  entryDate: Date;
  containerCode: string;
  currentWeightGrams?: number;
  weightLogs: typeof WeightLogSchema[];
  feedingLogs: typeof FeedingLogSchema[];
  healthRecords: typeof HealthRecordSchema[];
  lastSoilChange?: Date;
  nextSoilChange?: Date;
  notes?: string;
}

const BeetleSchema = new Schema<IBeetle>(
  {
    beetleId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      match: /^[A-Z0-9\-]+$/,
    },
    name:    { type: String, trim: true },
    species: { type: String, required: true, trim: true },
    lineage: { type: String, trim: true },

    sex: {
      type: String,
      required: true,
      enum: ["Male", "Female", "Unknown"],
      default: "Unknown",
    },
    stage: {
      type: String,
      required: true,
      enum: ["Egg", "L1", "L2", "L3", "Pupa", "Adult"],
      default: "L1",
    },
    status: {
      type: String,
      required: true,
      enum: ["Healthy", "Sick", "Dead", "Sold"],
      default: "Healthy",
    },

    birthDate:   { type: Date },
    entryDate:   { type: Date, required: true, default: Date.now },
    containerCode: { type: String, required: true, trim: true },

    currentWeightGrams: { type: Number, min: 0 },
    weightLogs:   { type: [WeightLogSchema], default: [] },
    feedingLogs:  { type: [FeedingLogSchema], default: [] },
    healthRecords:{ type: [HealthRecordSchema], default: [] },

    lastSoilChange: { type: Date },
    nextSoilChange: { type: Date, index: true },

    notes: { type: String, trim: true },
  },
  {
    timestamps: true,
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

// Text index for search
BeetleSchema.index({ beetleId: "text", name: "text", species: "text", containerCode: "text" });

const BeetleModel: Model<IBeetle> =
  mongoose.models.Beetle ?? mongoose.model<IBeetle>("Beetle", BeetleSchema);

export default BeetleModel;
