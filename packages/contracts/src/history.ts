import { z } from "zod";

import { createApiSuccessSchema, paginationQuerySchema } from "./common";

export const historyTypeSchema = z.enum([
  "BANSOS_CHECK",
  "PEMILU_CHECK",
  "ASPIRATION",
  "REQUEST",
  "MUTATION",
]);

export const historyItemSchema = z.object({
  id: z.string(),
  type: historyTypeSchema,
  title: z.string(),
  description: z.string(),
  metadata: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
});

export const historyListQuerySchema = paginationQuerySchema.extend({
  type: historyTypeSchema.optional(),
});

export const historyListResponseSchema = createApiSuccessSchema(z.array(historyItemSchema));
