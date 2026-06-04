import { and, desc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";

import { historyEntry, getDb } from "@abdimas/db";
import { historyListQuerySchema, historyListResponseSchema } from "@abdimas/contracts";

import { buildPageMeta, getOffset } from "../lib/pagination.js";
import { ok } from "../lib/response.js";
import { toIso } from "../lib/serialize.js";
import { parseQuery } from "../lib/validation.js";
import { authMiddleware } from "../middleware/auth.js";

export const historyRoutes = new Hono<{ Variables: { sessionUser: { id: string; role: string } } }>()
  .use("*", authMiddleware)
  .get("/", async (c) => {
    const sessionUser = c.get("sessionUser");
    const query = parseQuery(
      {
        page: c.req.query("page"),
        limit: c.req.query("limit"),
        type: c.req.query("type") || undefined,
      },
      historyListQuerySchema,
    );

    const where = query.type
      ? and(eq(historyEntry.userId, sessionUser.id), eq(historyEntry.type, query.type))
      : eq(historyEntry.userId, sessionUser.id);

    const db = getDb();
    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(historyEntry)
      .where(where);
    const rows = await db
      .select()
      .from(historyEntry)
      .where(where)
      .orderBy(desc(historyEntry.createdAt))
      .limit(query.limit)
      .offset(getOffset(query.page, query.limit));

    const meta = buildPageMeta({ page: query.page, limit: query.limit, total: Number(total || 0) });
    const payload = {
      success: true as const,
      data: rows.map((row) => ({
        id: row.id,
        type: row.type,
        title: row.title,
        description: row.description,
        metadata: row.metadata ?? {},
        createdAt: toIso(row.createdAt) ?? new Date().toISOString(),
      })),
      meta,
    };
    historyListResponseSchema.parse(payload);
    return ok(c, payload.data, meta);
  });
