import { z } from "zod";

import { createApiSuccessSchema, idParamSchema } from "./common";

export const aspirationStatusSchema = z.enum(["SUBMITTED", "REVIEWED", "RESOLVED"]);

export const aspirationReplySchema = z.object({
  message: z.string(),
  repliedAt: z.string(),
  repliedById: z.string(),
  repliedByName: z.string(),
});

export const aspirationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  message: z.string(),
  category: z.string().nullable(),
  status: aspirationStatusSchema,
  adminReply: aspirationReplySchema.nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createAspirationSchema = z.object({
  title: z.string().min(2).max(120),
  message: z.string().min(5).max(1000),
  category: z.string().max(80).optional(),
});

export const aspirationListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: aspirationStatusSchema.optional(),
  repliedOnly: z.coerce.boolean().optional().default(false),
});

export const adminAspirationListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: aspirationStatusSchema.optional(),
  q: z.string().trim().optional(),
});

export const adminAspirationReplySchema = z.object({
  replyMessage: z.string().trim().min(1).max(1000),
  status: aspirationStatusSchema.optional().default("REVIEWED"),
});

export const aspirationAdminItemSchema = aspirationSchema.extend({
  citizenName: z.string(),
  citizenEmail: z.string(),
  citizenRt: z.string().nullable(),
  citizenRw: z.string().nullable(),
});

export const aspirationIdParamSchema = idParamSchema;

export const aspirationResponseSchema = createApiSuccessSchema(aspirationSchema);
export const aspirationListResponseSchema = createApiSuccessSchema(z.array(aspirationSchema));
export const adminAspirationListResponseSchema = createApiSuccessSchema(z.array(aspirationAdminItemSchema));
export const adminAspirationDetailResponseSchema = createApiSuccessSchema(aspirationAdminItemSchema);
