import { z, type ZodType } from "zod";

import { validationError } from "./errors.js";

export const idParamSchema = z.object({
  id: z.string().trim().min(1).max(64),
});

export const userIdParamSchema = z.object({
  userId: z.string().trim().min(1).max(64),
});

export function sanitizeSearchTerm(value: string | undefined) {
  if (!value) return undefined;
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed) return undefined;
  return trimmed.slice(0, 100);
}

export async function parseJson<T>(req: Request, schema: ZodType<T>) {
  const input = await req.json().catch(() => null);
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw validationError(parsed.error.issues[0]?.message || "Invalid request body");
  }
  return parsed.data;
}

export function parseQuery<T>(input: Record<string, string | undefined>, schema: ZodType<T>) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw validationError(parsed.error.issues[0]?.message || "Invalid query");
  }
  return parsed.data;
}

export function parseParams<T>(input: Record<string, string | undefined>, schema: ZodType<T>) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw validationError(parsed.error.issues[0]?.message || "Invalid route params");
  }
  return parsed.data;
}
