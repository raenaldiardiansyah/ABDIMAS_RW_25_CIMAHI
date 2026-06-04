import { eq } from "drizzle-orm";
import { Hono } from "hono";

import { getDb, userPreference } from "@abdimas/db";
import {
  updateUserPreferenceSchema,
  userPreferenceResponseSchema,
} from "@abdimas/contracts";

import { ok } from "../lib/response.js";
import { toIso } from "../lib/serialize.js";
import { parseJson } from "../lib/validation.js";
import { authMiddleware } from "../middleware/auth.js";

async function getOrCreatePreference(userId: string) {
  const db = getDb();
  const existing = await db
    .select()
    .from(userPreference)
    .where(eq(userPreference.userId, userId))
    .limit(1);
  if (existing[0]) return existing[0];

  const [createdRow] = await db
    .insert(userPreference)
    .values({ userId, language: "id", theme: "system", notificationEnabled: true })
    .returning();
  return createdRow;
}

function mapPreference(row: typeof userPreference.$inferSelect) {
  return {
    id: row.id,
    userId: row.userId,
    language: row.language,
    theme: row.theme,
    notificationEnabled: row.notificationEnabled,
    createdAt: toIso(row.createdAt) ?? new Date().toISOString(),
    updatedAt: toIso(row.updatedAt) ?? new Date().toISOString(),
  };
}

export const preferencesRoutes = new Hono<{ Variables: { sessionUser: { id: string; role: string } } }>()
  .use("*", authMiddleware)
  .get("/", async (c) => {
    const row = await getOrCreatePreference(c.get("sessionUser").id);
    const payload = { success: true as const, data: mapPreference(row) };
    userPreferenceResponseSchema.parse(payload);
    return ok(c, payload.data);
  })
  .patch("/", async (c) => {
    const sessionUser = c.get("sessionUser");
    const body = await parseJson(c.req.raw, updateUserPreferenceSchema);
    await getOrCreatePreference(sessionUser.id);
    const [updated] = await getDb()
      .update(userPreference)
      .set(body)
      .where(eq(userPreference.userId, sessionUser.id))
      .returning();

    const payload = { success: true as const, data: mapPreference(updated) };
    userPreferenceResponseSchema.parse(payload);
    return ok(c, payload.data);
  });
