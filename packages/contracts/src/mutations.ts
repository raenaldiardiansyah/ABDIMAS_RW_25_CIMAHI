import { z } from "zod";

import { createApiSuccessSchema, paginationQuerySchema } from "./common";

export const mutationTypeSchema = z.enum(["IN", "OUT", "MOVE", "DEATH", "BIRTH"]);
export const mutationStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED"]);

export const mutationSchema = z.object({
  id: z.string(),
  citizenId: z.string(),
  type: mutationTypeSchema,
  status: mutationStatusSchema,
  fromAddress: z.string().nullable(),
  toAddress: z.string().nullable(),
  reason: z.string().nullable(),
  requestedBy: z.string(),
  reviewedBy: z.string().nullable(),
  reviewedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const mutationListQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().optional(),
  type: mutationTypeSchema.optional(),
  status: mutationStatusSchema.optional(),
});

export const createMutationSchema = z.object({
  citizenId: z.string(),
  type: mutationTypeSchema,
  fromAddress: z.string().max(255).optional(),
  toAddress: z.string().max(255).optional(),
  reason: z.string().max(255).optional(),
});

export const updateMutationStatusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  reason: z.string().max(255).optional(),
});

export const mutationListResponseSchema = createApiSuccessSchema(z.array(mutationSchema));
export const mutationResponseSchema = createApiSuccessSchema(mutationSchema);
