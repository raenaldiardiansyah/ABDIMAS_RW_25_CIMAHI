import { and, desc, eq, gte, ilike, lte } from "drizzle-orm";
import { Hono } from "hono";

import {
  activityListQuerySchema,
  activityListResponseSchema,
  activityResponseSchema,
  createActivitySchema,
  updateActivitySchema,
} from "@abdimas/contracts";
import { activity, getDb } from "@abdimas/db";

import { logAdminActivity } from "../lib/admin-logs";
import { notFound } from "../lib/errors";
import { ok } from "../lib/response";
import { toIso } from "../lib/serialize";
import { parseJson, parseQuery } from "../lib/validation";
import { adminMiddleware, authMiddleware } from "../middleware/auth";

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
    const end = `${query.month}-31`;
    filters.push(and(gte(activity.date, start), lte(activity.date, end)));
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
        q: c.req.query("q") || undefined,
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
        q: c.req.query("q") || undefined,
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
  .post("/", async (c) => {
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
  .patch("/:id", async (c) => {
    const sessionUser = c.get("sessionUser");
    const body = await parseJson(c.req.raw, updateActivitySchema);
    const [updated] = await getDb()
      .update(activity)
      .set(body)
      .where(eq(activity.id, c.req.param("id")))
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
  .delete("/:id", async (c) => {
    const sessionUser = c.get("sessionUser");
    const [deleted] = await getDb().delete(activity).where(eq(activity.id, c.req.param("id"))).returning();
    if (!deleted) throw notFound("Activity not found");

    await logAdminActivity({
      adminId: sessionUser.id,
      action: "ACTIVITY_DELETED",
      entityType: "ACTIVITY",
      entityId: deleted.id,
    });

    return ok(c, { id: deleted.id });
  });
