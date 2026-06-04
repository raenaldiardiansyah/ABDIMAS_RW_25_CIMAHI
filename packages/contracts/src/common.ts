import { z } from "zod";

export const apiErrorCodeSchema = z.enum([
  "UNAUTHORIZED",
  "FORBIDDEN",
  "VERIFICATION_REQUIRED",
  "VALIDATION_ERROR",
  "NOT_FOUND",
  "CONFLICT",
  "INTERNAL_ERROR",
]);

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const idParamSchema = z.object({
  id: z.string().trim().min(1).max(64),
});

export const userIdParamSchema = z.object({
  userId: z.string().trim().min(1).max(64),
});

export const rtQuerySchema = z.object({
  rt: z.string().trim().regex(/^\d{1,3}$/).optional(),
});

export const pageMetaSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
  isNext: z.boolean(),
});

export const apiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: apiErrorCodeSchema,
    message: z.string(),
  }),
});

export function createApiSuccessSchema<T extends z.ZodTypeAny>(data: T) {
  return z.object({
    success: z.literal(true),
    data,
    meta: pageMetaSchema.optional(),
  });
}

export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;
export type PageMeta = z.infer<typeof pageMetaSchema>;
