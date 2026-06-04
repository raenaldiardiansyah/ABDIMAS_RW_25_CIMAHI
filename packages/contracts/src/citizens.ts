import { z } from "zod";

import { createApiSuccessSchema, paginationQuerySchema } from "./common";

export const citizenStatusSchema = z.enum(["PENDUDUK_TETAP", "NGEKOST"]);
export const citizenGenderSchema = z.enum(["L", "P"]);
const nikSchema = z.string().regex(/^\d{16}$/, "NIK must be exactly 16 numeric digits");
const rtRwSchema = z.string().trim().regex(/^\d{1,3}$/, "RT/RW must be 1-3 numeric digits");
const birthDateSchema = z
  .string()
  .trim()
  .transform((value, ctx) => {
    if (!value) {
      ctx.addIssue({ code: "custom", message: "Birth date is required" });
      return z.NEVER;
    }

    const normalized = value.includes("T") ? value.slice(0, 10) : value;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
      ctx.addIssue({ code: "custom", message: "Invalid date" });
      return z.NEVER;
    }

    return normalized;
  })
  .refine((value) => new Date(value).getTime() <= Date.now(), "Birth date cannot be in the future");

export const citizenSchema = z.object({
  id: z.string(),
  userId: z.string().nullable(),
  noKK: z.string().nullable().optional(),
  nik: nikSchema,
  name: z.string(),
  gender: citizenGenderSchema,
  birthPlace: z.string(),
  birthDate: z.string(),
  religion: z.string(),
  maritalStatus: z.string(),
  occupation: z.string(),
  education: z.string(),
  bloodType: z.string().nullable(),
  address: z.string(),
  rt: z.string(),
  rw: z.string(),
  status: citizenStatusSchema,
  isArchived: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const citizenListQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().optional(),
  status: citizenStatusSchema.optional(),
  rt: rtRwSchema.optional(),
  rw: rtRwSchema.optional(),
});

export const createCitizenSchema = z.object({
  userId: z.string().optional(),
  nik: nikSchema,
  name: z.string().min(2).max(120),
  gender: citizenGenderSchema,
  birthPlace: z.string().min(2).max(120),
  birthDate: birthDateSchema,
  religion: z.string().min(2).max(60),
  maritalStatus: z.string().min(2).max(60),
  occupation: z.string().min(2).max(120),
  education: z.string().min(2).max(120),
  bloodType: z.string().max(10).optional(),
  address: z.string().min(5).max(255),
  rt: rtRwSchema,
  rw: rtRwSchema,
  status: citizenStatusSchema.default("PENDUDUK_TETAP"),
});

export const updateCitizenSchema = createCitizenSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one field must be provided",
);

export const citizenListResponseSchema = createApiSuccessSchema(z.array(citizenSchema));
export const citizenResponseSchema = createApiSuccessSchema(citizenSchema);
