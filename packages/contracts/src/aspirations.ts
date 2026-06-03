import { z } from "zod";

import { createApiSuccessSchema } from "./common";

export const aspirationStatusSchema = z.enum(["SUBMITTED", "REVIEWED", "RESOLVED"]);

export const aspirationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  message: z.string(),
  category: z.string().nullable(),
  status: aspirationStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createAspirationSchema = z.object({
  title: z.string().min(2).max(120),
  message: z.string().min(5).max(1000),
  category: z.string().max(80).optional(),
});

export const aspirationResponseSchema = createApiSuccessSchema(aspirationSchema);
