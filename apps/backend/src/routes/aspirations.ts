import { and, desc, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { Hono } from "hono";

import { aspiration, getDb, historyEntry, user } from "@abdimas/db";
import {
  aspirationListQuerySchema,
  aspirationListResponseSchema,
  aspirationResponseSchema,
  createAspirationSchema,
} from "@abdimas/contracts";

import { buildPageMeta, getOffset } from "../lib/pagination.js";
import { created, ok } from "../lib/response.js";
import { toIso } from "../lib/serialize.js";
import { parseJson, parseQuery } from "../lib/validation.js";
import { authMiddleware, verifiedWargaMiddleware } from "../middleware/auth.js";

export const aspirationsRoutes = new Hono<{ Variables: { sessionUser: { id: string; role: string; name?: string } } }>()
  .use("*", authMiddleware)
  .get("/", async (c) => {
    const sessionUser = c.get("sessionUser");
    const query = parseQuery(
      {
        page: c.req.query("page"),
        limit: c.req.query("limit"),
        status: c.req.query("status") || undefined,
        repliedOnly: c.req.query("repliedOnly") || undefined,
      },
      aspirationListQuerySchema,
    );

    const whereParts = [eq(aspiration.userId, sessionUser.id)];
    if (query.status) whereParts.push(eq(aspiration.status, query.status));
    if (query.repliedOnly) whereParts.push(isNotNull(aspiration.adminReplyMessage));
    const where = and(...whereParts);

    const db = getDb();
    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(aspiration)
      .where(where);
    const rows = await db
      .select()
      .from(aspiration)
      .where(where)
      .orderBy(desc(aspiration.createdAt))
      .limit(query.limit)
      .offset(getOffset(query.page, query.limit));

    const repliedByIds = [...new Set(rows.map((row) => row.repliedBy).filter((value): value is string => Boolean(value)))];
    const repliedByMap = new Map<string, string>();

    if (repliedByIds.length > 0) {
      const repliers = await db
        .select({ id: user.id, name: user.name })
        .from(user)
        .where(inArray(user.id, repliedByIds));
      for (const replier of repliers) repliedByMap.set(replier.id, replier.name);
    }

    const meta = buildPageMeta({ page: query.page, limit: query.limit, total: Number(total || 0) });
    const payload = {
      success: true as const,
      data: rows.map((row) => ({
        id: row.id,
        userId: row.userId,
        title: row.title,
        message: row.message,
        category: row.category ?? null,
        status: row.status,
        adminReply:
          row.adminReplyMessage && row.repliedAt && row.repliedBy
            ? {
                message: row.adminReplyMessage,
                repliedAt: toIso(row.repliedAt) ?? new Date().toISOString(),
                repliedById: row.repliedBy,
                repliedByName: repliedByMap.get(row.repliedBy) ?? "Admin RW 25",
              }
            : null,
        createdAt: toIso(row.createdAt) ?? new Date().toISOString(),
        updatedAt: toIso(row.updatedAt) ?? new Date().toISOString(),
      })),
      meta,
    };
    aspirationListResponseSchema.parse(payload);
    return ok(c, payload.data, meta);
  })
  .use("*", verifiedWargaMiddleware)
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
      metadata: {
        aspirationId: createdRow.id,
        category: body.category ?? null,
        status: "SUBMITTED",
        pelapor: sessionUser.name ?? "Warga",
      },
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
        adminReply: null,
        createdAt: toIso(createdRow.createdAt) ?? new Date().toISOString(),
        updatedAt: toIso(createdRow.updatedAt) ?? new Date().toISOString(),
      },
    };
    aspirationResponseSchema.parse(payload);
    return created(c, payload.data);
  });
