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
  objectKey: z.string(),
  fileName: z.string(),
  contentType: z.string(),
  sizeBytes: z.string(),
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
  nik: z.string().length(16),
  name: z.string().min(2).max(120),
  gender: z.enum(["L", "P"]),
  occupation: z.string().min(2).max(120),
  type: z.enum(["IN", "OUT"]),
  mutationDate: z.string(),
  fromAddress: z.string().max(255).optional(),
  toAddress: z.string().max(255).optional(),
  targetRt: z.string().max(10).optional(),
  phone: z.string().max(40).optional(),
  reason: z.string().max(255).optional(),
});

export const updateMutationStatusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  reason: z.string().max(255).optional(),
});

export const mutationListResponseSchema = createApiSuccessSchema(z.array(mutationSchema));
export const mutationResponseSchema = createApiSuccessSchema(mutationDetailSchema);
