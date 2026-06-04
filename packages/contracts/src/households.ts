import { z } from "zod";

import { citizenSchema } from "./citizens";
import { createApiSuccessSchema, paginationQuerySchema } from "./common";

export const householdRelationshipSchema = z.enum([
  "HEAD_OF_FAMILY",
  "SPOUSE",
  "CHILD",
  "PARENT",
  "SIBLING",
  "OTHER",
]);
export const householdRelationshipInputSchema = z.union([
  householdRelationshipSchema,
  z.enum(["Kepala Keluarga", "Suami", "Istri", "Anak", "Orang Tua", "Saudara", "Lainnya"]),
]);
const kkNumberSchema = z.string().regex(/^\d{16}$/, "KK number must be exactly 16 numeric digits");
const rtRwSchema = z.string().trim().regex(/^\d{1,3}$/, "RT/RW must be 1-3 numeric digits");

export const householdMemberSchema = z.object({
  id: z.string(),
  householdId: z.string(),
  citizenId: z.string(),
  relationship: householdRelationshipSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  citizen: citizenSchema.optional(),
});

export const householdSchema = z.object({
  id: z.string(),
  kkNumber: z.string(),
  headCitizenId: z.string(),
  address: z.string(),
  rt: z.string(),
  rw: z.string(),
  status: z.string(),
  memberCount: z.number().int().min(0).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  headCitizen: citizenSchema.optional(),
  members: z.array(householdMemberSchema).optional(),
});

export const householdAuditLogSchema = z.object({
  id: z.string(),
  adminId: z.string(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
});

export const householdListQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().optional(),
  rt: z.string().trim().optional(),
});

export const createHouseholdSchema = z.object({
  kkNumber: kkNumberSchema,
  headCitizenId: z.string().optional(),
  headCitizenName: z.string().min(2).max(120).optional(),
  address: z.string().min(5).max(255),
  rt: rtRwSchema,
  rw: rtRwSchema,
  status: z.string().min(1).max(40).default("ACTIVE"),
});

export const updateHouseholdSchema = createHouseholdSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one field must be provided",
);

export const addHouseholdMemberSchema = z.object({
  citizenId: z.string(),
  relationship: householdRelationshipInputSchema,
});

export const updateHouseholdMemberSchema = z.object({
  relationship: householdRelationshipInputSchema.optional(),
  birthDate: z.string().optional(),
  occupation: z.string().optional(),
});

export const householdListResponseSchema = createApiSuccessSchema(z.array(householdSchema));
export const householdResponseSchema = createApiSuccessSchema(householdSchema);
export const householdAuditLogResponseSchema = createApiSuccessSchema(
  z.array(householdAuditLogSchema),
);
