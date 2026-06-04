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
  date: z.string().date().optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
});

const activityWriteSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().min(2).max(500),
  location: z.string().min(2).max(255),
  category: activityCategorySchema,
  date: z.string().date(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

export const createActivitySchema = activityWriteSchema.superRefine((value, ctx) => {
  if (value.startTime && value.endTime && value.startTime >= value.endTime) {
    ctx.addIssue({ code: "custom", message: "startTime must be before endTime", path: ["startTime"] });
  }
});

export const updateActivitySchema = activityWriteSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one field must be provided",
);

export const activityListResponseSchema = createApiSuccessSchema(z.array(activitySchema));
export const activityResponseSchema = createApiSuccessSchema(activitySchema);
