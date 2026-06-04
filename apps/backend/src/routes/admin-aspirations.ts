import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { aspiration, getDb, user, userIdentity } from "@abdimas/db";
import {
  adminAspirationDetailResponseSchema,
  adminAspirationListQuerySchema,
  adminAspirationListResponseSchema,
  adminAspirationReplySchema,
  aspirationIdParamSchema,
} from "@abdimas/contracts";

import { createAuditLogService } from "../lib/admin-logs.js";
import { buildPageMeta, getOffset } from "../lib/pagination.js";
import { ok } from "../lib/response.js";
import { toIso } from "../lib/serialize.js";
import { parseJson, parseParams, parseQuery, sanitizeSearchTerm } from "../lib/validation.js";
import { adminMiddleware } from "../middleware/auth.js";

async function buildReplierMap(ids: string[]) {
  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length === 0) return new Map<string, string>();

  const rows = await getDb()
    .select({ id: user.id, name: user.name })
    .from(user)
    .where(inArray(user.id, uniqueIds));

  return new Map(rows.map((row) => [row.id, row.name]));
}

export const adminAspirationsRoutes = new Hono<{ Variables: { sessionUser: { id: string; role: string; name?: string } } }>()
  .use("*", adminMiddleware)
  .get("/", async (c) => {
    const query = parseQuery(
      {
        page: c.req.query("page"),
        limit: c.req.query("limit"),
        status: c.req.query("status") || undefined,
        q: sanitizeSearchTerm(c.req.query("q") || undefined),
      },
      adminAspirationListQuerySchema,
    );

    const whereParts = [];
    if (query.status) whereParts.push(eq(aspiration.status, query.status));
    if (query.q) {
      whereParts.push(
        or(
          ilike(aspiration.title, `%${query.q}%`),
          ilike(aspiration.message, `%${query.q}%`),
          ilike(user.name, `%${query.q}%`),
          ilike(user.email, `%${query.q}%`),
        ),
      );
    }

    const where = whereParts.length > 0 ? and(...whereParts) : undefined;
    const db = getDb();
    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(aspiration)
      .innerJoin(user, eq(user.id, aspiration.userId))
      .where(where);

    const rows = await db
      .select({
        id: aspiration.id,
        userId: aspiration.userId,
        title: aspiration.title,
        message: aspiration.message,
        category: aspiration.category,
        status: aspiration.status,
        adminReplyMessage: aspiration.adminReplyMessage,
        repliedBy: aspiration.repliedBy,
        repliedAt: aspiration.repliedAt,
        createdAt: aspiration.createdAt,
        updatedAt: aspiration.updatedAt,
        citizenName: user.name,
        citizenEmail: user.email,
        citizenRt: userIdentity.rt,
        citizenRw: userIdentity.rw,
      })
      .from(aspiration)
      .innerJoin(user, eq(user.id, aspiration.userId))
      .leftJoin(userIdentity, eq(userIdentity.userId, aspiration.userId))
      .where(where)
      .orderBy(desc(aspiration.createdAt))
      .limit(query.limit)
      .offset(getOffset(query.page, query.limit));

    const replierMap = await buildReplierMap(
      rows.map((row) => row.repliedBy).filter((value): value is string => Boolean(value)),
    );

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
                repliedByName: replierMap.get(row.repliedBy) ?? "Admin RW 25",
              }
            : null,
        createdAt: toIso(row.createdAt) ?? new Date().toISOString(),
        updatedAt: toIso(row.updatedAt) ?? new Date().toISOString(),
        citizenName: row.citizenName,
        citizenEmail: row.citizenEmail,
        citizenRt: row.citizenRt ?? null,
        citizenRw: row.citizenRw ?? null,
      })),
      meta,
    };
    adminAspirationListResponseSchema.parse(payload);
    return ok(c, payload.data, meta);
  })
  .get("/:id", async (c) => {
    const { id } = parseParams(c.req.param(), aspirationIdParamSchema);
    const db = getDb();
    const [row] = await db
      .select({
        id: aspiration.id,
        userId: aspiration.userId,
        title: aspiration.title,
        message: aspiration.message,
        category: aspiration.category,
        status: aspiration.status,
        adminReplyMessage: aspiration.adminReplyMessage,
        repliedBy: aspiration.repliedBy,
        repliedAt: aspiration.repliedAt,
        createdAt: aspiration.createdAt,
        updatedAt: aspiration.updatedAt,
        citizenName: user.name,
        citizenEmail: user.email,
        citizenRt: userIdentity.rt,
        citizenRw: userIdentity.rw,
      })
      .from(aspiration)
      .innerJoin(user, eq(user.id, aspiration.userId))
      .leftJoin(userIdentity, eq(userIdentity.userId, aspiration.userId))
      .where(eq(aspiration.id, id))
      .limit(1);

    if (!row) throw new HTTPException(404, { message: "Aduan tidak ditemukan" });

    const replierMap = await buildReplierMap(row.repliedBy ? [row.repliedBy] : []);
    const payload = {
      success: true as const,
      data: {
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
                repliedByName: replierMap.get(row.repliedBy) ?? "Admin RW 25",
              }
            : null,
        createdAt: toIso(row.createdAt) ?? new Date().toISOString(),
        updatedAt: toIso(row.updatedAt) ?? new Date().toISOString(),
        citizenName: row.citizenName,
        citizenEmail: row.citizenEmail,
        citizenRt: row.citizenRt ?? null,
        citizenRw: row.citizenRw ?? null,
      },
    };
    adminAspirationDetailResponseSchema.parse(payload);
    return ok(c, payload.data);
  })
  .post("/:id/reply", async (c) => {
    const sessionUser = c.get("sessionUser");
    const { id } = parseParams(c.req.param(), aspirationIdParamSchema);
    const body = await parseJson(c.req.raw, adminAspirationReplySchema);
    const [updated] = await getDb()
      .update(aspiration)
      .set({
        adminReplyMessage: body.replyMessage,
        repliedBy: sessionUser.id,
        repliedAt: new Date(),
        status: body.status,
        updatedAt: new Date(),
      })
      .where(eq(aspiration.id, id))
      .returning();

    if (!updated) throw new HTTPException(404, { message: "Aduan tidak ditemukan" });

    await createAuditLogService({
      adminId: sessionUser.id,
      action: "Menanggapi aduan warga",
      entityType: "ASPIRATION",
      entityId: updated.id,
      metadata: {
        status: updated.status,
        userId: updated.userId,
      },
    });

    const payload = {
      success: true as const,
      data: {
        id: updated.id,
        userId: updated.userId,
        title: updated.title,
        message: updated.message,
        category: updated.category ?? null,
        status: updated.status,
        adminReply:
          updated.adminReplyMessage && updated.repliedAt
            ? {
                message: updated.adminReplyMessage,
                repliedAt: toIso(updated.repliedAt) ?? new Date().toISOString(),
                repliedById: sessionUser.id,
                repliedByName: sessionUser.name ?? "Admin RW 25",
              }
            : null,
        createdAt: toIso(updated.createdAt) ?? new Date().toISOString(),
        updatedAt: toIso(updated.updatedAt) ?? new Date().toISOString(),
        citizenName: "",
        citizenEmail: "",
        citizenRt: null,
        citizenRw: null,
      },
    };
    return ok(c, payload.data);
  });
