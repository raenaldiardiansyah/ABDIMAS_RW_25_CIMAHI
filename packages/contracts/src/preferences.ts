import { z } from "zod";

import { createApiSuccessSchema } from "./common";

export const userPreferenceSchema = z.object({
  id: z.string(),
  userId: z.string(),
  language: z.string(),
  theme: z.string(),
  notificationEnabled: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const updateUserPreferenceSchema = z.object({
  language: z.string().optional(),
  theme: z.string().optional(),
  notificationEnabled: z.boolean().optional(),
});

export const userPreferenceResponseSchema = createApiSuccessSchema(userPreferenceSchema);
