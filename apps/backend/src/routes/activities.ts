import { and, desc, eq, gte, ilike, lt, lte } from "drizzle-orm";
import { Hono } from "hono";

import {
  activityListQuerySchema,
  activityListResponseSchema,
  activityResponseSchema,
  createActivitySchema,
  idParamSchema,
  updateActivitySchema,
} from "@abdimas/contracts";
import { activity, getDb } from "@abdimas/db";

import { logAdminActivity } from "../lib/admin-logs.js";
import { notFound } from "../lib/errors.js";
import { createRateLimitMiddleware } from "../lib/rate-limit.js";
import { ok } from "../lib/response.js";
import { toIso } from "../lib/serialize.js";
import { parseJson, parseParams, parseQuery, sanitizeSearchTerm } from "../lib/validation.js";
import { adminMiddleware, authMiddleware } from "../middleware/auth.js";

function mapActivity(row: typeof activity.$inferSelect) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    location: row.location,
    category: row.category,
    date: row.date,
    startTime: row.startTime ?? null,
    endTime: row.endTime ?? null,
    createdBy: row.createdBy,
    createdAt: toIso(row.createdAt) ?? new Date().toISOString(),
    updatedAt: toIso(row.updatedAt) ?? new Date().toISOString(),
  };
}

function buildActivityFilters(query: ReturnType<typeof activityListQuerySchema.parse>) {
  const filters = [];
  if (query.q) filters.push(ilike(activity.title, `%${query.q}%`));
  if (query.category) filters.push(eq(activity.category, query.category));
  if (query.date) filters.push(eq(activity.date, query.date));
  if (query.month) {
    const start = `${query.month}-01`;
    const [yearStr, monthStr] = query.month.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);
    
    let nextMonth = month + 1;
    let nextYear = year;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    const nextMonthStr = String(nextMonth).padStart(2, '0');
    const end = `${nextYear}-${nextMonthStr}-01`;

    filters.push(and(gte(activity.date, start), lt(activity.date, end)));
  }
  return filters.length > 0 ? and(...filters) : undefined;
}

export const scheduleRoutes = new Hono<{ Variables: { sessionUser: { id: string; role: string } } }>()
  .use("*", authMiddleware)
  .get("/", async (c) => {
    const query = parseQuery(
      {
        page: c.req.query("page"),
        limit: c.req.query("limit"),
        q: sanitizeSearchTerm(c.req.query("q") || undefined),
        category: c.req.query("category") || undefined,
        date: c.req.query("date") || undefined,
        month: c.req.query("month") || undefined,
      },
      activityListQuerySchema,
    );

    const rows = await getDb()
      .select()
      .from(activity)
      .where(buildActivityFilters(query))
      .orderBy(activity.date, activity.startTime);

    const payload = { success: true as const, data: rows.map(mapActivity) };
    activityListResponseSchema.parse(payload);
    return ok(c, payload.data);
  });

export const adminActivitiesRoutes = new Hono<{ Variables: { sessionUser: { id: string; role: string } } }>()
  .use("*", adminMiddleware)
  .get("/", async (c) => {
    const query = parseQuery(
      {
        page: c.req.query("page"),
        limit: c.req.query("limit"),
        q: sanitizeSearchTerm(c.req.query("q") || undefined),
        category: c.req.query("category") || undefined,
        date: c.req.query("date") || undefined,
        month: c.req.query("month") || undefined,
      },
      activityListQuerySchema,
    );

    const rows = await getDb()
      .select()
      .from(activity)
      .where(buildActivityFilters(query))
      .orderBy(desc(activity.date), desc(activity.createdAt));

    const payload = { success: true as const, data: rows.map(mapActivity) };
    activityListResponseSchema.parse(payload);
    return ok(c, payload.data);
  })
  .post("/", createRateLimitMiddleware({ key: "activity-write", limit: 30, windowMs: 60_000 }), async (c) => {
    const sessionUser = c.get("sessionUser");
    const body = await parseJson(c.req.raw, createActivitySchema);
    const [createdRow] = await getDb()
      .insert(activity)
      .values({ ...body, createdBy: sessionUser.id })
      .returning();

    await logAdminActivity({
      adminId: sessionUser.id,
      action: "ACTIVITY_CREATED",
      entityType: "ACTIVITY",
      entityId: createdRow.id,
    });

    const payload = { success: true as const, data: mapActivity(createdRow) };
    activityResponseSchema.parse(payload);
    return ok(c, payload.data, undefined, 201);
  })
  .patch("/:id", createRateLimitMiddleware({ key: "activity-write", limit: 30, windowMs: 60_000 }), async (c) => {
    const sessionUser = c.get("sessionUser");
    const { id } = parseParams(c.req.param(), idParamSchema);
    const body = await parseJson(c.req.raw, updateActivitySchema);
    const [updated] = await getDb()
      .update(activity)
      .set(body)
      .where(eq(activity.id, id))
      .returning();
    if (!updated) throw notFound("Activity not found");

    await logAdminActivity({
      adminId: sessionUser.id,
      action: "ACTIVITY_UPDATED",
      entityType: "ACTIVITY",
      entityId: updated.id,
    });

    const payload = { success: true as const, data: mapActivity(updated) };
    activityResponseSchema.parse(payload);
    return ok(c, payload.data);
  })
  .delete("/:id", createRateLimitMiddleware({ key: "activity-write", limit: 30, windowMs: 60_000 }), async (c) => {
    const sessionUser = c.get("sessionUser");
    const { id } = parseParams(c.req.param(), idParamSchema);
    const [deleted] = await getDb().delete(activity).where(eq(activity.id, id)).returning();
    if (!deleted) throw notFound("Activity not found");

    await logAdminActivity({
      adminId: sessionUser.id,
      action: "ACTIVITY_DELETED",
      entityType: "ACTIVITY",
      entityId: deleted.id,
    });

    return ok(c, { id: deleted.id });
  });
