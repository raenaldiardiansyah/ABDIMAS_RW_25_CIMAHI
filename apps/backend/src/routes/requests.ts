import { and, desc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";

import {
  idParamSchema,
  requestDecisionSchema,
  requestListQuerySchema,
  serviceRequestListResponseSchema,
  serviceRequestResponseSchema,
} from "@abdimas/contracts";
import { getDb, household, householdMember, mutation, serviceRequest } from "@abdimas/db";

import { logAdminActivity } from "../lib/admin-logs.js";
import { notFound } from "../lib/errors.js";
import { buildPageMeta, getOffset } from "../lib/pagination.js";
import { createRateLimitMiddleware } from "../lib/rate-limit.js";
import { ok } from "../lib/response.js";
import { toIso } from "../lib/serialize.js";
import { buildObjectUrl } from "../lib/storage.js";
import { parseJson, parseParams, parseQuery } from "../lib/validation.js";
import { adminMiddleware } from "../middleware/auth.js";
import { approveRequestService, rejectRequestService } from "../services/requests.js";

async function mapRequest(row: typeof serviceRequest.$inferSelect) {
  const payload = { ...(row.payload ?? {}) } as Record<string, unknown>;
  if (row.type === "BANSOS_APPLICATION" && Array.isArray(payload.attachments)) {
    payload.attachments = await Promise.all(
      payload.attachments.map(async (item) => {
        if (!item || typeof item !== "object") return item;
        const attachment = item as Record<string, unknown>;
        if (typeof attachment.storageKey !== "string") return attachment;
        return {
          ...attachment,
          url: await buildObjectUrl(attachment.storageKey, { signedOnly: true }).catch(() => null),
        };
      }),
    );
  }
  return {
    id: row.id,
    type: row.type,
    status: row.status,
    payload,
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
    const mappedRows = await Promise.all(rows.map(mapRequest));
    const payload = { success: true as const, data: mappedRows, meta };
    serviceRequestListResponseSchema.parse(payload);
    return ok(c, payload.data, meta);
  })
  .get("/:id", async (c) => {
    const { id } = parseParams(c.req.param(), idParamSchema);
    const row = await getDb()
      .select()
      .from(serviceRequest)
      .where(eq(serviceRequest.id, id))
      .limit(1);
    if (!row[0]) throw notFound("Request not found");
    const payload = { success: true as const, data: await mapRequest(row[0]) };
    serviceRequestResponseSchema.parse(payload);
    return ok(c, payload.data);
  })
  .post("/:id/approve", createRateLimitMiddleware({ key: "request-approve", limit: 20, windowMs: 60_000 }), async (c) => {
    const { id: requestId } = parseParams(c.req.param(), idParamSchema);
    const sessionUser = c.get("sessionUser");
    const updated = await approveRequestService({ adminId: sessionUser.id, requestId });
    const payload = { success: true as const, data: await mapRequest(updated) };
    serviceRequestResponseSchema.parse(payload);
    return ok(c, payload.data);
  })
  .post("/:id/reject", createRateLimitMiddleware({ key: "request-reject", limit: 20, windowMs: 60_000 }), async (c) => {
    const { id: requestId } = parseParams(c.req.param(), idParamSchema);
    const sessionUser = c.get("sessionUser");
    const body = await parseJson(c.req.raw, requestDecisionSchema);
    const updated = await rejectRequestService({ adminId: sessionUser.id, requestId, reason: body.reason });

    const payload = { success: true as const, data: await mapRequest(updated) };
    serviceRequestResponseSchema.parse(payload);
    return ok(c, payload.data);
  });
