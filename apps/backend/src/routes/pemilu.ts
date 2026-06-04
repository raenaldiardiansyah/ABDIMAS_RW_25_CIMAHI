import { asc, desc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";

import {
  createPemiluEventSchema,
  pemiluAssignmentResponseSchema,
  pemiluEventIdParamSchema,
  pemiluEventListQuerySchema,
  pemiluEventListResponseSchema,
  pemiluEventResponseSchema,
} from "@abdimas/contracts";
import { activity, citizen, getDb, pemiluEvent } from "@abdimas/db";

import { logAdminActivity } from "../lib/admin-logs.js";
import { notFound } from "../lib/errors.js";
import { ok } from "../lib/response.js";
import { toIso } from "../lib/serialize.js";
import { parseJson, parseParams, parseQuery } from "../lib/validation.js";
import { adminMiddleware, authMiddleware, verifiedWargaMiddleware } from "../middleware/auth.js";

function mapPemiluEvent(row: typeof pemiluEvent.$inferSelect) {
  return {
    id: row.id,
    title: row.title,
    requirements: row.requirements ?? [],
    pollingStations: row.pollingStations ?? [],
    electionDate: row.electionDate,
    startTime: row.startTime ?? null,
    endTime: row.endTime ?? null,
    activityId: row.activityId ?? null,
    createdBy: row.createdBy,
    createdAt: toIso(row.createdAt) ?? new Date().toISOString(),
    updatedAt: toIso(row.updatedAt) ?? new Date().toISOString(),
  };
}

async function resolveCitizenPemiluAssignment(userId: string) {
  const db = getDb();
  const [citizenRow] = await db
    .select()
    .from(citizen)
    .where(eq(citizen.userId, userId))
    .limit(1);
  if (!citizenRow) return null;

  const today = new Date().toISOString().slice(0, 10);
  const upcomingRows = await db
    .select()
    .from(pemiluEvent)
    .where(sql`${pemiluEvent.electionDate} >= ${today}`)
    .orderBy(asc(pemiluEvent.electionDate), desc(pemiluEvent.createdAt));
  const fallbackRows = upcomingRows.length === 0
    ? await db
        .select()
        .from(pemiluEvent)
        .orderBy(desc(pemiluEvent.electionDate), desc(pemiluEvent.createdAt))
        .limit(1)
    : [];
  const currentEvent = upcomingRows[0] ?? fallbackRows[0];
  if (!currentEvent) return null;

  const normalizedRt = citizenRow.rt.replace(/^0+/, "") || citizenRow.rt;
  const matchedStation = (currentEvent.pollingStations ?? []).find((station) =>
    station.assignedRtScope.some((rt) => (rt.replace(/^0+/, "") || rt) === normalizedRt),
  );
  if (!matchedStation) return null;

  return {
    eventId: currentEvent.id,
    title: currentEvent.title,
    electionDate: currentEvent.electionDate,
    startTime: currentEvent.startTime ?? null,
    endTime: currentEvent.endTime ?? null,
    tpsLabel: matchedStation.label,
    tpsLocation: matchedStation.location,
    assignedRt: citizenRow.rt,
  };
}

export const adminPemiluRoutes = new Hono<{ Variables: { sessionUser: { id: string; role: string } } }>()
  .use("*", adminMiddleware)
  .get("/", async (c) => {
    const query = parseQuery(
      {
        page: c.req.query("page"),
        limit: c.req.query("limit"),
        date: c.req.query("date") || undefined,
      },
      pemiluEventListQuerySchema,
    );
    const rows = await getDb()
      .select()
      .from(pemiluEvent)
      .where(query.date ? eq(pemiluEvent.electionDate, query.date) : undefined)
      .orderBy(desc(pemiluEvent.electionDate), desc(pemiluEvent.createdAt))
      .limit(query.limit);

    const payload = { success: true as const, data: rows.map(mapPemiluEvent) };
    pemiluEventListResponseSchema.parse(payload);
    return ok(c, payload.data);
  })
  .get("/:id", async (c) => {
    const { id } = parseParams(c.req.param(), pemiluEventIdParamSchema);
    const [row] = await getDb().select().from(pemiluEvent).where(eq(pemiluEvent.id, id)).limit(1);
    if (!row) throw notFound("Pemilu event not found");
    const payload = { success: true as const, data: mapPemiluEvent(row) };
    pemiluEventResponseSchema.parse(payload);
    return ok(c, payload.data);
  })
  .post("/", async (c) => {
    const sessionUser = c.get("sessionUser");
    const body = await parseJson(c.req.raw, createPemiluEventSchema);
    const db = getDb();

    const [createdActivity] = await db
      .insert(activity)
      .values({
        title: body.title,
        description: `Agenda pemilu untuk ${body.pollingStations.length} TPS dan ${body.requirements.length} persyaratan.`,
        location: body.pollingStations.map((station) => station.location).join(" | "),
        category: "lainnya",
        date: body.electionDate,
        startTime: body.startTime ?? null,
        endTime: body.endTime ?? null,
        createdBy: sessionUser.id,
      })
      .returning();

    const [createdRow] = await db
      .insert(pemiluEvent)
      .values({
        title: body.title,
        requirements: body.requirements,
        pollingStations: body.pollingStations,
        electionDate: body.electionDate,
        startTime: body.startTime ?? null,
        endTime: body.endTime ?? null,
        activityId: createdActivity.id,
        createdBy: sessionUser.id,
      })
      .returning();

    await logAdminActivity({
      adminId: sessionUser.id,
      action: "PEMILU_CREATED",
      entityType: "PEMILU",
      entityId: createdRow.id,
      metadata: { activityId: createdActivity.id },
    });

    const payload = { success: true as const, data: mapPemiluEvent(createdRow) };
    pemiluEventResponseSchema.parse(payload);
    return ok(c, payload.data, undefined, 201);
  });

export const pemiluRoutes = new Hono<{ Variables: { sessionUser: { id: string; role: string } } }>()
  .use("*", authMiddleware)
  .use("*", verifiedWargaMiddleware)
  .get("/assignment", async (c) => {
    const sessionUser = c.get("sessionUser");
    const assignment = await resolveCitizenPemiluAssignment(sessionUser.id);
    const payload = { success: true as const, data: assignment };
    pemiluAssignmentResponseSchema.parse(payload);
    return ok(c, payload.data);
  });

export { resolveCitizenPemiluAssignment };
