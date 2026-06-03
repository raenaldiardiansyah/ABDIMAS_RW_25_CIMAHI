import { z } from "zod";

import { createApiSuccessSchema, paginationQuerySchema } from "./common";

export const citizenStatusSchema = z.enum(["PENDUDUK_TETAP", "NGEKOST"]);
export const citizenGenderSchema = z.enum(["L", "P"]);

export const citizenSchema = z.object({
  id: z.string(),
  userId: z.string().nullable(),
  nik: z.string().length(16),
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
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const citizenListQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().optional(),
  status: citizenStatusSchema.optional(),
});

export const createCitizenSchema = z.object({
  userId: z.string().optional(),
  nik: z.string().length(16),
  name: z.string().min(2).max(120),
  gender: citizenGenderSchema,
  birthPlace: z.string().min(2).max(120),
  birthDate: z.string(),
  religion: z.string().min(2).max(60),
  maritalStatus: z.string().min(2).max(60),
  occupation: z.string().min(2).max(120),
  education: z.string().min(2).max(120),
  bloodType: z.string().max(10).optional(),
  address: z.string().min(5).max(255),
  rt: z.string().min(1).max(10),
  rw: z.string().min(1).max(10),
  status: citizenStatusSchema.default("PENDUDUK_TETAP"),
});

export const updateCitizenSchema = createCitizenSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one field must be provided",
);

export const citizenListResponseSchema = createApiSuccessSchema(z.array(citizenSchema));
export const citizenResponseSchema = createApiSuccessSchema(citizenSchema);
