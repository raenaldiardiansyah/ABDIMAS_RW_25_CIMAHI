import { z } from "zod";

import { createApiSuccessSchema, paginationQuerySchema } from "./common";

export const requestTypeSchema = z.enum(["HOUSEHOLD_CREATE", "MUTATION_IN", "MUTATION_OUT"]);
export const requestStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED"]);

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
  reason: z.string().max(255).optional(),
});

export const serviceRequestListResponseSchema = createApiSuccessSchema(z.array(serviceRequestSchema));
export const serviceRequestResponseSchema = createApiSuccessSchema(serviceRequestSchema);
