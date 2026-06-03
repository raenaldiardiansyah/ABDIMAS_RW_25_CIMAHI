import { z } from "zod";

import { createApiSuccessSchema } from "./common";

export const serviceNikCheckSchema = z.object({
  nik: z.string().length(16),
});

export const bansosCheckResultSchema = z.object({
  eligible: z.boolean(),
  message: z.string(),
  checkedAt: z.string(),
});

export const pemiluCheckResultSchema = z.object({
  registered: z.boolean(),
  tps: z.string().optional(),
  message: z.string(),
  checkedAt: z.string(),
});

export const bansosCheckResponseSchema = createApiSuccessSchema(bansosCheckResultSchema);
export const pemiluCheckResponseSchema = createApiSuccessSchema(pemiluCheckResultSchema);
