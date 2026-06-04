import { hashPassword } from "@better-auth/utils/password";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { Hono } from "hono";

import {
  adminUserListQuerySchema,
  adminUserListResponseSchema,
  adminUserResponseSchema,
  createAdminUserSchema,
  idParamSchema,
  updateAdminUserSchema,
  paginationQuerySchema,
} from "@abdimas/contracts";
import { account, adminActivityLog, getDb, user } from "@abdimas/db";

import { logAdminActivity } from "../lib/admin-logs.js";
import { forbidden, notFound } from "../lib/errors.js";
import { buildPageMeta, getOffset } from "../lib/pagination.js";
import { createRateLimitMiddleware } from "../lib/rate-limit.js";
import { created, ok } from "../lib/response.js";
import { toIso } from "../lib/serialize.js";
import { parseJson, parseParams, parseQuery, sanitizeSearchTerm } from "../lib/validation.js";
import { adminMiddleware } from "../middleware/auth.js";
import { createAdminUserService, deactivateAdminUserService, resetAdminPasswordService } from "../services/admin-users.js";

function randomPassword() {
  return `Adm${Math.random().toString(36).slice(2, 8)}9!`;
}

function mapAdminUser(row: typeof user.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    username: row.username,
    role: row.role as "ADMIN" | "USER" | "SUPER_ADMIN",
    status: (row.status || "ACTIVE") as "ACTIVE" | "INACTIVE",
    createdAt: toIso(row.createdAt) ?? new Date().toISOString(),
    updatedAt: toIso(row.updatedAt) ?? new Date().toISOString(),
  };
}

export const adminUsersRoutes = new Hono<{ Variables: { sessionUser: { id: string; role: string } } }>()
  .use("*", adminMiddleware)
  .get("/", async (c) => {
    const query = parseQuery(
      {
        page: c.req.query("page"),
        limit: c.req.query("limit"),
        q: sanitizeSearchTerm(c.req.query("q") || undefined),
        status: c.req.query("status") || undefined,
      },
      adminUserListQuerySchema,
    );

    const filters = [eq(user.role, "ADMIN")];
    if (query.status) filters.push(eq(user.status, query.status));
    if (query.q) {
      const searchFilter = or(
        ilike(user.name, `%${query.q}%`),
        ilike(user.email, `%${query.q}%`),
        ilike(user.username, `%${query.q}%`),
      );
      if (searchFilter) filters.push(searchFilter);
    }
    const where = and(...filters);
    const db = getDb();
    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(user)
      .where(where);
    const rows = await db
      .select()
      .from(user)
      .where(where)
      .orderBy(desc(user.createdAt))
      .limit(query.limit)
      .offset(getOffset(query.page, query.limit));

    const meta = buildPageMeta({ page: query.page, limit: query.limit, total: Number(total || 0) });
    const payload = { success: true as const, data: rows.map(mapAdminUser), meta };
    adminUserListResponseSchema.parse(payload);
    return ok(c, payload.data, meta);
  })
  .post("/", createRateLimitMiddleware({ key: "admin-create", limit: 10, windowMs: 60_000 }), async (c) => {
    const sessionUser = c.get("sessionUser");
    const body = await parseJson(c.req.raw, createAdminUserSchema);
    const { createdUser } = await createAdminUserService({
      actorId: sessionUser.id,
      actorRole: sessionUser.role,
      body,
    });

    const payload = { success: true as const, data: mapAdminUser(createdUser) };
    adminUserResponseSchema.parse(payload);
    return created(c, payload.data);
  })
  .patch("/:id", async (c) => {
    const sessionUser = c.get("sessionUser");
    const { id } = parseParams(c.req.param(), idParamSchema);
    const body = await parseJson(c.req.raw, updateAdminUserSchema);
    if (sessionUser.id === id && body.status === "INACTIVE") {
      throw forbidden("Admin cannot deactivate themselves");
    }
    const [updated] = await getDb()
      .update(user)
      .set({
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
      })
      .where(and(eq(user.id, id), or(eq(user.role, "ADMIN"), eq(user.role, "SUPER_ADMIN"))))
      .returning();
    if (!updated) throw notFound("Admin user not found");
    if (updated.role === "SUPER_ADMIN" && sessionUser.role !== "SUPER_ADMIN") {
      throw forbidden("Only SUPER_ADMIN can edit SUPER_ADMIN users");
    }

    await logAdminActivity({
      adminId: sessionUser.id,
      action: "ADMIN_USER_UPDATED",
      entityType: "ADMIN_USER",
      entityId: updated.id,
      metadata: body,
    });

    const payload = { success: true as const, data: mapAdminUser(updated) };
    adminUserResponseSchema.parse(payload);
    return ok(c, payload.data);
  })
  .post("/:id/reset-password", createRateLimitMiddleware({ key: "admin-reset-password", limit: 10, windowMs: 60_000 }), async (c) => {
    const sessionUser = c.get("sessionUser");
    const { id } = parseParams(c.req.param(), idParamSchema);
    const result = await resetAdminPasswordService({
      actorId: sessionUser.id,
      actorRole: sessionUser.role,
      targetUserId: id,
    });
    return ok(c, result);
  })
  .post("/:id/deactivate", createRateLimitMiddleware({ key: "admin-deactivate", limit: 10, windowMs: 60_000 }), async (c) => {
    const sessionUser = c.get("sessionUser");
    const { id } = parseParams(c.req.param(), idParamSchema);
    const updated = await deactivateAdminUserService({
      actorId: sessionUser.id,
      actorRole: sessionUser.role,
      targetUserId: id,
    });

    const payload = { success: true as const, data: mapAdminUser(updated) };
    adminUserResponseSchema.parse(payload);
    return ok(c, payload.data);
  })
  .get("/activity-logs", async (c) => {
    const query = parseQuery(
      {
        page: c.req.query("page"),
        limit: c.req.query("limit"),
      },
      paginationQuerySchema,
    );
    const db = getDb();
    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(adminActivityLog);
    const rows = await db
      .select()
      .from(adminActivityLog)
      .orderBy(desc(adminActivityLog.createdAt))
      .limit(query.limit)
      .offset(getOffset(query.page, query.limit));
    const meta = buildPageMeta({ page: query.page, limit: query.limit, total: Number(total || 0) });
    return ok(
      c,
      rows.map((row) => ({
        id: row.id,
        adminId: row.adminId,
        action: row.action,
        entityType: row.entityType,
        entityId: row.entityId ?? null,
        metadata: row.metadata ?? {},
        createdAt: toIso(row.createdAt) ?? new Date().toISOString(),
      })),
      meta,
    );
  });
