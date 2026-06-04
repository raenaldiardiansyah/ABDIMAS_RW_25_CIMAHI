import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { Hono } from "hono";

import { aspiration, getDb, historyEntry, user } from "@abdimas/db";
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

    const aspirationIds = rows
      .filter((row) => row.type === "ASPIRATION")
      .map((row) => row.metadata?.aspirationId)
      .filter((value): value is string => typeof value === "string" && value.length > 0);

    const aspirationRows = aspirationIds.length > 0
      ? await db
          .select()
          .from(aspiration)
          .where(inArray(aspiration.id, aspirationIds))
      : [];

    const replierIds = aspirationRows
      .map((row) => row.repliedBy)
      .filter((value): value is string => Boolean(value));
    const repliers = replierIds.length > 0
      ? await db
          .select({ id: user.id, name: user.name })
          .from(user)
          .where(inArray(user.id, replierIds))
      : [];

    const aspirationMap = new Map(aspirationRows.map((row) => [row.id, row]));
    const replierMap = new Map(repliers.map((row) => [row.id, row.name]));

    const meta = buildPageMeta({ page: query.page, limit: query.limit, total: Number(total || 0) });
    const payload = {
      success: true as const,
      data: rows.map((row) => ({
        id: row.id,
        type: row.type,
        title: row.title,
        description: row.description,
        metadata:
          row.type === "ASPIRATION" && typeof row.metadata?.aspirationId === "string"
            ? (() => {
                const relatedAspiration = aspirationMap.get(row.metadata.aspirationId);
                if (!relatedAspiration) return row.metadata ?? {};
                return {
                  ...(row.metadata ?? {}),
                  status: relatedAspiration.status,
                  category: relatedAspiration.category ?? row.metadata?.category ?? null,
                  adminReply: relatedAspiration.adminReplyMessage ?? null,
                  repliedAt: toIso(relatedAspiration.repliedAt),
                  repliedByName: relatedAspiration.repliedBy
                    ? (replierMap.get(relatedAspiration.repliedBy) ?? "Admin RW 25")
                    : null,
                };
              })()
            : (row.metadata ?? {}),
        createdAt: toIso(row.createdAt) ?? new Date().toISOString(),
      })),
      meta,
    };
    historyListResponseSchema.parse(payload);
    return ok(c, payload.data, meta);
  });
