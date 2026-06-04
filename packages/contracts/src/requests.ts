import { z } from "zod";

import { createApiSuccessSchema, paginationQuerySchema } from "./common";

export const requestTypeSchema = z.enum(["HOUSEHOLD_CREATE", "MEMBER_CREATE", "MUTATION_IN", "MUTATION_OUT"]);
export const requestStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED"]);
export const wargaMutationRequestTypeSchema = z.enum(["MUTATION_IN", "MUTATION_OUT"]);

export const serviceRequestSchema = z.object({
  id: z.string(),
  type: requestTypeSchema,
  status: requestStatusSchema,
  payload: z.record(z.string(), z.unknown()),
  requestedBy: z.string(),
  reviewedBy: z.string().nullable(),
  reviewedAt: z.string().nullable(),
  rejectionReason: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const requestListQuerySchema = paginationQuerySchema.extend({
  type: requestTypeSchema.optional(),
  status: requestStatusSchema.optional(),
});

export const requestDecisionSchema = z.object({
  reason: z.string().trim().min(1, "Reason is required").max(255),
});

export const createHouseholdRequestSchema = z.object({
  kkNumber: z.string().trim().regex(/^\d{16}$/, "KK number must be exactly 16 numeric digits"),
  address: z.string().trim().min(5).max(255),
  rt: z.string().trim().regex(/^\d{1,3}$/, "RT must be 1-3 numeric digits"),
  rw: z.string().trim().regex(/^\d{1,3}$/, "RW must be 1-3 numeric digits"),
});

export const createMemberRequestSchema = z.object({
  nik: z.string().trim().regex(/^\d{16}$/, "NIK must be exactly 16 numeric digits"),
  name: z.string().trim().min(2).max(120),
  birthPlace: z.string().trim().max(100).optional(),
  birthDate: z.string().date().optional(),
  gender: z.enum(["L", "P"]),
  religion: z.string().trim().max(40).optional(),
  maritalStatus: z.string().trim().max(40).optional(),
  education: z.string().trim().max(100).optional(),
  relationship: z.string().trim().max(100),
});


export const createMutationRequestSchema = z.object({
  type: wargaMutationRequestTypeSchema,
  mutationDate: z.string().date(),
  fromAddress: z.string().trim().max(255).optional(),
  toAddress: z.string().trim().max(255).optional(),
  targetRt: z.string().trim().regex(/^\d{1,3}$/, "Target RT must be numeric").optional(),
  phone: z.string().trim().max(40).optional(),
  reason: z.string().trim().min(1, "Reason is required").max(255),
}).superRefine((value, ctx) => {
  if (value.type === "MUTATION_IN" && !value.toAddress) {
    ctx.addIssue({ code: "custom", path: ["toAddress"], message: "toAddress is required for IN mutation" });
  }
  if (value.type === "MUTATION_OUT" && !value.fromAddress) {
    ctx.addIssue({ code: "custom", path: ["fromAddress"], message: "fromAddress is required for OUT mutation" });
  }
});

export const serviceRequestListResponseSchema = createApiSuccessSchema(z.array(serviceRequestSchema));
export const serviceRequestResponseSchema = createApiSuccessSchema(serviceRequestSchema);
