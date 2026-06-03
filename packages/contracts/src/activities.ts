import { z } from "zod";

import { createApiSuccessSchema, paginationQuerySchema } from "./common";

export const activityCategorySchema = z.enum(["rapat", "sosial", "kesehatan", "keamanan", "lainnya"]);

export const activitySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  location: z.string(),
  category: activityCategorySchema,
  date: z.string(),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const activityListQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().optional(),
  category: activityCategorySchema.optional(),
  date: z.string().optional(),
  month: z.string().optional(),
});

export const createActivitySchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().min(2).max(500),
  location: z.string().min(2).max(255),
  category: activityCategorySchema,
  date: z.string(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

export const updateActivitySchema = createActivitySchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one field must be provided",
);

export const activityListResponseSchema = createApiSuccessSchema(z.array(activitySchema));
export const activityResponseSchema = createApiSuccessSchema(activitySchema);
