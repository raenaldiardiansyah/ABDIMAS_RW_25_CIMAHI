import { Hono } from "hono";

import { aspiration, getDb, historyEntry } from "@abdimas/db";
import { aspirationResponseSchema, createAspirationSchema } from "@abdimas/contracts";

import { created } from "../lib/response";
import { toIso } from "../lib/serialize";
import { parseJson } from "../lib/validation";
import { authMiddleware } from "../middleware/auth";

export const aspirationsRoutes = new Hono<{ Variables: { sessionUser: { id: string; role: string; name?: string } } }>()
  .use("*", authMiddleware)
  .post("/", async (c) => {
    const sessionUser = c.get("sessionUser");
    const body = await parseJson(c.req.raw, createAspirationSchema);
    const db = getDb();
    const [createdRow] = await db
      .insert(aspiration)
      .values({
        userId: sessionUser.id,
        title: body.title,
        message: body.message,
        category: body.category ?? null,
        status: "SUBMITTED",
      })
      .returning();

    await db.insert(historyEntry).values({
      userId: sessionUser.id,
      type: "ASPIRATION",
      title: body.title,
      description: body.message,
      metadata: { category: body.category ?? null, status: "SUBMITTED" },
    });

    const payload = {
      success: true as const,
      data: {
        id: createdRow.id,
        userId: createdRow.userId,
        title: createdRow.title,
        message: createdRow.message,
        category: createdRow.category ?? null,
        status: createdRow.status,
        createdAt: toIso(createdRow.createdAt) ?? new Date().toISOString(),
        updatedAt: toIso(createdRow.updatedAt) ?? new Date().toISOString(),
      },
    };
    aspirationResponseSchema.parse(payload);
    return created(c, payload.data);
  });
