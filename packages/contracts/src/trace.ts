import { z } from "zod";

export const frontendBackendTraceItemSchema = z.object({
  area: z.string(),
  surface: z.string(),
  needsBackend: z.array(z.string()),
});

export const frontendBackendTraceSchema = z.object({
  generatedAt: z.string(),
  items: z.array(frontendBackendTraceItemSchema),
});

export type FrontendBackendTrace = z.infer<typeof frontendBackendTraceSchema>;
