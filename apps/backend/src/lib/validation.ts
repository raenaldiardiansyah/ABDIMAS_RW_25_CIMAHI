import type { ZodType } from "zod";

import { validationError } from "./errors";

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
