import { z } from "zod";

import { createApiSuccessSchema, paginationQuerySchema } from "./common";

export const mutationTypeSchema = z.enum(["IN", "OUT", "MOVE", "DEATH", "BIRTH"]);
export const mutationStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED"]);

export const mutationSchema = z.object({
  id: z.string(),
  citizenId: z.string(),
  type: mutationTypeSchema,
  status: mutationStatusSchema,
  mutationDate: z.string().nullable(),
  fromAddress: z.string().nullable(),
  toAddress: z.string().nullable(),
  targetRt: z.string().nullable(),
  phone: z.string().nullable(),
  reason: z.string().nullable(),
  requestedBy: z.string(),
  reviewedBy: z.string().nullable(),
  reviewedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const mutationAttachmentKindSchema = z.enum(["SURAT_KETERANGAN", "KTP", "KK"]);

export const mutationAttachmentSchema = z.object({
  id: z.string(),
  mutationId: z.string(),
  kind: mutationAttachmentKindSchema,
  entityType: z.literal("MUTATION"),
  entityId: z.string(),
  storageKey: z.string(),
  originalFilename: z.string(),
  mimeType: z.string(),
  size: z.number().int().min(1),
  uploadedBy: z.string().nullable(),
  url: z.string().nullable(),
  createdAt: z.string(),
});

export const mutationDetailSchema = mutationSchema.extend({
  attachments: z.array(mutationAttachmentSchema),
});

export const mutationListQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().optional(),
  type: mutationTypeSchema.optional(),
  status: mutationStatusSchema.optional(),
});

export const createMutationSchema = z.object({
  nik: z.string().regex(/^\d{16}$/, "NIK must be exactly 16 numeric digits"),
  name: z.string().min(2).max(120),
  gender: z.enum(["L", "P"]),
  occupation: z.string().min(2).max(120),
  type: z.enum(["IN", "OUT"]),
  mutationDate: z.string().date(),
  fromAddress: z.string().max(255).optional(),
  toAddress: z.string().max(255).optional(),
  targetRt: z.string().trim().regex(/^\d{1,3}$/, "Target RT must be numeric").optional(),
  phone: z.string().max(40).optional(),
  reason: z.string().trim().min(1, "Reason is required").max(255),
}).superRefine((value, ctx) => {
  if (value.type === "IN" && !value.toAddress) {
    ctx.addIssue({ code: "custom", message: "toAddress is required for IN mutation", path: ["toAddress"] });
  }
  if (value.type === "OUT" && !value.fromAddress) {
    ctx.addIssue({ code: "custom", message: "fromAddress is required for OUT mutation", path: ["fromAddress"] });
  }
});

export const updateMutationStatusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  reason: z.string().trim().max(255).optional(),
}).superRefine((value, ctx) => {
  if (value.status === "REJECTED" && !value.reason) {
    ctx.addIssue({ code: "custom", message: "Reason is required when rejecting a mutation", path: ["reason"] });
  }
});

export const mutationListResponseSchema = createApiSuccessSchema(z.array(mutationSchema));
export const mutationResponseSchema = createApiSuccessSchema(mutationDetailSchema);
