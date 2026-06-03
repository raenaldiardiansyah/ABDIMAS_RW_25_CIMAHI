import { and, desc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";

import {
  requestDecisionSchema,
  requestListQuerySchema,
  serviceRequestListResponseSchema,
  serviceRequestResponseSchema,
} from "@abdimas/contracts";
import { getDb, household, householdMember, mutation, serviceRequest } from "@abdimas/db";

import { logAdminActivity } from "../lib/admin-logs";
import { notFound } from "../lib/errors";
import { buildPageMeta, getOffset } from "../lib/pagination";
import { ok } from "../lib/response";
import { toIso } from "../lib/serialize";
import { parseJson, parseQuery } from "../lib/validation";
import { adminMiddleware } from "../middleware/auth";

function mapRequest(row: typeof serviceRequest.$inferSelect) {
  return {
    id: row.id,
    type: row.type,
    status: row.status,
    payload: row.payload ?? {},
    requestedBy: row.requestedBy,
    reviewedBy: row.reviewedBy ?? null,
    reviewedAt: toIso(row.reviewedAt),
    rejectionReason: row.rejectionReason ?? null,
    createdAt: toIso(row.createdAt) ?? new Date().toISOString(),
    updatedAt: toIso(row.updatedAt) ?? new Date().toISOString(),
  };
}

type HouseholdCreatePayload = {
  household: {
    kkNumber: string;
    headCitizenId: string;
    address: string;
    rt: string;
    rw: string;
    status?: string;
  };
  members?: Array<{ citizenId: string; relationship: string }>;
};

type MutationPayload = {
  citizenId: string;
  fromAddress?: string;
  toAddress?: string;
  reason?: string;
};

async function applyRequestApproval(row: typeof serviceRequest.$inferSelect, adminId: string) {
  const db = getDb();

  if (row.type === "HOUSEHOLD_CREATE") {
    const payload = row.payload as HouseholdCreatePayload;
    const [createdHousehold] = await db
      .insert(household)
      .values({
        kkNumber: payload.household.kkNumber,
        headCitizenId: payload.household.headCitizenId,
        address: payload.household.address,
        rt: payload.household.rt,
        rw: payload.household.rw,
        status: payload.household.status ?? "ACTIVE",
      })
      .returning();

    const members = payload.members ?? [];
    const normalizedMembers = new Map<string, string>();
    normalizedMembers.set(payload.household.headCitizenId, "Kepala Keluarga");
    for (const member of members) normalizedMembers.set(member.citizenId, member.relationship);

    await db.insert(householdMember).values(
      Array.from(normalizedMembers.entries()).map(([citizenId, relationship]) => ({
        householdId: createdHousehold.id,
        citizenId,
        relationship,
      })),
    );

    await logAdminActivity({
      adminId,
      action: "REQUEST_APPROVED",
      entityType: "HOUSEHOLD",
      entityId: createdHousehold.id,
      metadata: { requestId: row.id, requestType: row.type },
    });
    return;
  }

  const payload = row.payload as MutationPayload;
  const [createdMutation] = await db
    .insert(mutation)
    .values({
      citizenId: payload.citizenId,
      type: row.type === "MUTATION_IN" ? "IN" : "OUT",
      status: "APPROVED",
      fromAddress: payload.fromAddress ?? null,
      toAddress: payload.toAddress ?? null,
      reason: payload.reason ?? null,
      requestedBy: row.requestedBy,
      reviewedBy: adminId,
      reviewedAt: new Date(),
    })
    .returning();

  await logAdminActivity({
    adminId,
    action: "REQUEST_APPROVED",
    entityType: "MUTATION",
    entityId: createdMutation.id,
    metadata: { requestId: row.id, requestType: row.type },
  });
}

export const requestsRoutes = new Hono<{ Variables: { sessionUser: { id: string; role: string } } }>()
  .use("*", adminMiddleware)
  .get("/", async (c) => {
    const query = parseQuery(
      {
        page: c.req.query("page"),
        limit: c.req.query("limit"),
        type: c.req.query("type") || undefined,
        status: c.req.query("status") || undefined,
      },
      requestListQuerySchema,
    );

    const filters = [];
    if (query.type) filters.push(eq(serviceRequest.type, query.type));
    if (query.status) filters.push(eq(serviceRequest.status, query.status));
    const where = filters.length > 0 ? and(...filters) : undefined;
    const db = getDb();
    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(serviceRequest)
      .where(where);

    const rows = await db
      .select()
      .from(serviceRequest)
      .where(where)
      .orderBy(desc(serviceRequest.createdAt))
      .limit(query.limit)
      .offset(getOffset(query.page, query.limit));

    const meta = buildPageMeta({ page: query.page, limit: query.limit, total: Number(total || 0) });
    const payload = { success: true as const, data: rows.map(mapRequest), meta };
    serviceRequestListResponseSchema.parse(payload);
    return ok(c, payload.data, meta);
  })
  .get("/:id", async (c) => {
    const row = await getDb()
      .select()
      .from(serviceRequest)
      .where(eq(serviceRequest.id, c.req.param("id")))
      .limit(1);
    if (!row[0]) throw notFound("Request not found");
    const payload = { success: true as const, data: mapRequest(row[0]) };
    serviceRequestResponseSchema.parse(payload);
    return ok(c, payload.data);
  })
  .post("/:id/approve", async (c) => {
    const requestId = c.req.param("id");
    const sessionUser = c.get("sessionUser");
    const db = getDb();
    const [row] = await db
      .select()
      .from(serviceRequest)
      .where(eq(serviceRequest.id, requestId))
      .limit(1);
    if (!row) throw notFound("Request not found");

    const [updated] = await db
      .update(serviceRequest)
      .set({
        status: "APPROVED",
        reviewedBy: sessionUser.id,
        reviewedAt: new Date(),
        rejectionReason: null,
      })
      .where(eq(serviceRequest.id, requestId))
      .returning();

    await applyRequestApproval(updated, sessionUser.id);
    const payload = { success: true as const, data: mapRequest(updated) };
    serviceRequestResponseSchema.parse(payload);
    return ok(c, payload.data);
  })
  .post("/:id/reject", async (c) => {
    const requestId = c.req.param("id");
    const sessionUser = c.get("sessionUser");
    const body = await parseJson(c.req.raw, requestDecisionSchema);
    const [updated] = await getDb()
      .update(serviceRequest)
      .set({
        status: "REJECTED",
        reviewedBy: sessionUser.id,
        reviewedAt: new Date(),
        rejectionReason: body.reason ?? "Rejected by admin",
      })
      .where(eq(serviceRequest.id, requestId))
      .returning();
    if (!updated) throw notFound("Request not found");

    await logAdminActivity({
      adminId: sessionUser.id,
      action: "REQUEST_REJECTED",
      entityType: "REQUEST",
      entityId: requestId,
      metadata: { requestType: updated.type, reason: body.reason ?? null },
    });

    const payload = { success: true as const, data: mapRequest(updated) };
    serviceRequestResponseSchema.parse(payload);
    return ok(c, payload.data);
  });
