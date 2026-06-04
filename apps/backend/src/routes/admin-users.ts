import { hashPassword } from "@better-auth/utils/password";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { Hono } from "hono";

import {
  adminUserListQuerySchema,
  adminUserListResponseSchema,
  adminUserResponseSchema,
  createAdminUserSchema,
  updateAdminUserSchema,
  paginationQuerySchema,
} from "@abdimas/contracts";
import { account, adminActivityLog, getDb, user } from "@abdimas/db";

import { logAdminActivity } from "../lib/admin-logs";
import { conflict, notFound } from "../lib/errors";
import { buildPageMeta, getOffset } from "../lib/pagination";
import { created, ok } from "../lib/response";
import { toIso } from "../lib/serialize";
import { parseJson, parseQuery } from "../lib/validation";
import { adminMiddleware } from "../middleware/auth";

function randomPassword() {
  return `Adm${Math.random().toString(36).slice(2, 8)}9!`;
}

function mapAdminUser(row: typeof user.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    username: row.username,
    role: row.role as "ADMIN" | "USER",
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
        q: c.req.query("q") || undefined,
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
  .post("/", async (c) => {
    const sessionUser = c.get("sessionUser");
    const body = await parseJson(c.req.raw, createAdminUserSchema);
    const db = getDb();

    const existing = await db
      .select({ id: user.id })
      .from(user)
      .where(or(eq(user.email, body.email.toLowerCase()), eq(user.username, body.username.toLowerCase())))
      .limit(1);
    if (existing.length > 0) throw conflict("Admin user already exists");

    const password = randomPassword();
    const hashedPassword = await hashPassword(password);
    const [createdUser] = await db
      .insert(user)
      .values({
        name: body.name,
        email: body.email.toLowerCase(),
        username: body.username.toLowerCase(),
        displayUsername: body.username.toLowerCase(),
        role: "ADMIN",
        status: "ACTIVE",
      })
      .returning();

    await db.insert(account).values({
      userId: createdUser.id,
      accountId: createdUser.id,
      providerId: "credential",
      password: hashedPassword,
    });

    await logAdminActivity({
      adminId: sessionUser.id,
      action: "ADMIN_USER_CREATED",
      entityType: "ADMIN_USER",
      entityId: createdUser.id,
      metadata: { temporaryPassword: password },
    });

    const payload = { success: true as const, data: mapAdminUser(createdUser) };
    adminUserResponseSchema.parse(payload);
    return created(c, payload.data);
  })
  .patch("/:id", async (c) => {
    const sessionUser = c.get("sessionUser");
    const body = await parseJson(c.req.raw, updateAdminUserSchema);
    const [updated] = await getDb()
      .update(user)
      .set({
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
      })
      .where(and(eq(user.id, c.req.param("id")), eq(user.role, "ADMIN")))
      .returning();
    if (!updated) throw notFound("Admin user not found");

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
  .post("/:id/reset-password", async (c) => {
    const sessionUser = c.get("sessionUser");
    const userId = c.req.param("id");
    const tempPassword = randomPassword();
    const hashedPassword = await hashPassword(tempPassword);
    const [updatedAccount] = await getDb()
      .update(account)
      .set({ password: hashedPassword })
      .where(and(eq(account.userId, userId), eq(account.providerId, "credential")))
      .returning();
    if (!updatedAccount) throw notFound("Admin credential account not found");

    await logAdminActivity({
      adminId: sessionUser.id,
      action: "ADMIN_USER_PASSWORD_RESET",
      entityType: "ADMIN_USER",
      entityId: userId,
      metadata: { temporaryPassword: tempPassword },
    });

    return ok(c, { userId, temporaryPassword: tempPassword });
  })
  .post("/:id/deactivate", async (c) => {
    const sessionUser = c.get("sessionUser");
    const [updated] = await getDb()
      .update(user)
      .set({ status: "INACTIVE" })
      .where(and(eq(user.id, c.req.param("id")), eq(user.role, "ADMIN")))
      .returning();
    if (!updated) throw notFound("Admin user not found");

    await logAdminActivity({
      adminId: sessionUser.id,
      action: "ADMIN_USER_DEACTIVATED",
      entityType: "ADMIN_USER",
      entityId: updated.id,
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
