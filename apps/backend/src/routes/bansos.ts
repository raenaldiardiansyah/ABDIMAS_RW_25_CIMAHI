import { and, desc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";

import {
  adminBansosApplicationListQuerySchema,
  adminBansosApplicationListResponseSchema,
  adminBansosApplicationResponseSchema,
  bansosProgramListQuerySchema,
  bansosProgramListResponseSchema,
  bansosProgramResponseSchema,
  createBansosProgramSchema,
  idParamSchema,
  requestDecisionSchema,
} from "@abdimas/contracts";
import { bansosProgram, getDb, serviceRequest } from "@abdimas/db";

import { notFound } from "../lib/errors.js";
import { buildPageMeta, getOffset } from "../lib/pagination.js";
import { createRateLimitMiddleware } from "../lib/rate-limit.js";
import { created, ok } from "../lib/response.js";
import { toIso } from "../lib/serialize.js";
import { buildObjectUrl } from "../lib/storage.js";
import { parseJson, parseParams, parseQuery } from "../lib/validation.js";
import { adminMiddleware, authMiddleware } from "../middleware/auth.js";
import { approveRequestService, rejectRequestService } from "../services/requests.js";

function mapProgram(row: typeof bansosProgram.$inferSelect) {
  return {
    id: row.id,
    title: row.title,
    assistanceType: row.assistanceType,
    startDate: row.startDate,
    endDate: row.endDate,
    startTime: row.startTime,
    endTime: row.endTime,
    fundingSource: row.fundingSource,
    generalRequirements: row.generalRequirements ?? [],
    allowedRtScope: row.allowedRtScope ?? [],
    createdBy: row.createdBy,
    createdAt: toIso(row.createdAt) ?? new Date().toISOString(),
    updatedAt: toIso(row.updatedAt) ?? new Date().toISOString(),
  };
}

type UserApplicationSummary = {
  requestId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  applicantName: string;
  incomeAmount: string | null;
  notes: string | null;
  createdAt: string;
};

function buildUserApplicationMap(rows: Array<typeof serviceRequest.$inferSelect>) {
  const result = new Map<string, UserApplicationSummary>();
  for (const row of rows) {
    const payload = row.payload as Record<string, unknown>;
    const programId = typeof payload.programId === "string" ? payload.programId : null;
    if (!programId || result.has(programId)) continue;
    result.set(programId, {
      requestId: row.id,
      status: row.status,
      applicantName: typeof payload.applicantName === "string" ? payload.applicantName : "Warga",
      incomeAmount: typeof payload.incomeAmount === "string" ? payload.incomeAmount : null,
      notes: typeof payload.notes === "string" ? payload.notes : null,
      createdAt: toIso(row.createdAt) ?? new Date().toISOString(),
    });
  }
  return result;
}

async function mapAdminBansosApplication(row: typeof serviceRequest.$inferSelect) {
  const payload = { ...(row.payload ?? {}) } as Record<string, unknown>;
  if (Array.isArray(payload.attachments)) {
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
    status: row.status,
    requestedBy: row.requestedBy,
    reviewedBy: row.reviewedBy ?? null,
    reviewedAt: toIso(row.reviewedAt),
    rejectionReason: row.rejectionReason ?? null,
    createdAt: toIso(row.createdAt) ?? new Date().toISOString(),
    updatedAt: toIso(row.updatedAt) ?? new Date().toISOString(),
    payload,
  };
}

export const adminBansosRoutes = new Hono<{ Variables: { sessionUser: { id: string; role: string } } }>()
  .use("*", adminMiddleware)
  .get("/", async (c) => {
    const query = parseQuery(
      {
        page: c.req.query("page"),
        limit: c.req.query("limit"),
        assistanceType: c.req.query("assistanceType") || undefined,
      },
      bansosProgramListQuerySchema,
    );

    const where = query.assistanceType ? eq(bansosProgram.assistanceType, query.assistanceType) : undefined;
    const db = getDb();
    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(bansosProgram)
      .where(where);

    const rows = await db
      .select()
      .from(bansosProgram)
      .where(where)
      .orderBy(desc(bansosProgram.createdAt))
      .limit(query.limit)
      .offset(getOffset(query.page, query.limit));

    const meta = buildPageMeta({ page: query.page, limit: query.limit, total: Number(total || 0) });
    const payload = { success: true as const, data: rows.map(mapProgram), meta };
    bansosProgramListResponseSchema.parse(payload);
    return ok(c, payload.data, meta);
  })
  .get("/applications", async (c) => {
    const query = parseQuery(
      {
        page: c.req.query("page"),
        limit: c.req.query("limit"),
        status: c.req.query("status") || undefined,
      },
      adminBansosApplicationListQuerySchema,
    );

    const filters = [eq(serviceRequest.type, "BANSOS_APPLICATION")];
    if (query.status) filters.push(eq(serviceRequest.status, query.status));
    const where = and(...filters);

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
    const payload = { success: true as const, data: await Promise.all(rows.map(mapAdminBansosApplication)), meta };
    adminBansosApplicationListResponseSchema.parse(payload);
    return ok(c, payload.data, meta);
  })
  .post("/applications/:id/approve", createRateLimitMiddleware({ key: "bansos-approve", limit: 20, windowMs: 60_000 }), async (c) => {
    const { id } = parseParams(c.req.param(), idParamSchema);
    const sessionUser = c.get("sessionUser");
    const updated = await approveRequestService({ adminId: sessionUser.id, requestId: id });
    const payload = { success: true as const, data: await mapAdminBansosApplication(updated) };
    adminBansosApplicationResponseSchema.parse(payload);
    return ok(c, payload.data);
  })
  .post("/applications/:id/reject", createRateLimitMiddleware({ key: "bansos-reject", limit: 20, windowMs: 60_000 }), async (c) => {
    const { id } = parseParams(c.req.param(), idParamSchema);
    const sessionUser = c.get("sessionUser");
    const body = await parseJson(c.req.raw, requestDecisionSchema);
    const updated = await rejectRequestService({ adminId: sessionUser.id, requestId: id, reason: body.reason });
    const payload = { success: true as const, data: await mapAdminBansosApplication(updated) };
    adminBansosApplicationResponseSchema.parse(payload);
    return ok(c, payload.data);
  })
  .get("/:id", async (c) => {
    const { id } = parseParams(c.req.param(), idParamSchema);
    const [row] = await getDb().select().from(bansosProgram).where(eq(bansosProgram.id, id)).limit(1);
    if (!row) throw notFound("Bansos program not found");
    const payload = { success: true as const, data: mapProgram(row) };
    bansosProgramResponseSchema.parse(payload);
    return ok(c, payload.data);
  })
  .post("/", async (c) => {
    const sessionUser = c.get("sessionUser");
    const body = await parseJson(c.req.raw, createBansosProgramSchema);

    const [createdRow] = await getDb()
      .insert(bansosProgram)
      .values({
        title: body.title,
        assistanceType: body.assistanceType,
        startDate: body.startDate,
        endDate: body.endDate,
        startTime: body.startTime,
        endTime: body.endTime,
        fundingSource: body.fundingSource,
        generalRequirements: body.generalRequirements,
        allowedRtScope: body.allowedRtScope,
        createdBy: sessionUser.id,
      })
      .returning();

    const payload = { success: true as const, data: mapProgram(createdRow) };
    bansosProgramResponseSchema.parse(payload);
    return created(c, payload.data);
  });

export const bansosRoutes = new Hono<{ Variables: { sessionUser: { id: string; role: string } } }>()
  .use("*", authMiddleware)
  .get("/programs", async (c) => {
    const sessionUser = c.get("sessionUser");
    const query = parseQuery(
      {
        page: c.req.query("page"),
        limit: c.req.query("limit"),
        assistanceType: c.req.query("assistanceType") || undefined,
      },
      bansosProgramListQuerySchema,
    );

    const filters = [];
    if (query.assistanceType) filters.push(eq(bansosProgram.assistanceType, query.assistanceType));
    const where = filters.length ? and(...filters) : undefined;

    const db = getDb();
    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(bansosProgram)
      .where(where);

    const rows = await db
      .select()
      .from(bansosProgram)
      .where(where)
      .orderBy(desc(bansosProgram.createdAt))
      .limit(query.limit)
      .offset(getOffset(query.page, query.limit));

    const requestRows = await db
      .select()
      .from(serviceRequest)
      .where(and(eq(serviceRequest.requestedBy, sessionUser.id), eq(serviceRequest.type, "BANSOS_APPLICATION")))
      .orderBy(desc(serviceRequest.createdAt));
    const userApplicationMap = buildUserApplicationMap(requestRows);

    const meta = buildPageMeta({ page: query.page, limit: query.limit, total: Number(total || 0) });
    const payload = {
      success: true as const,
      data: rows.map((row) => ({
        ...mapProgram(row),
        userApplication: userApplicationMap.get(row.id) ?? null,
      })),
      meta,
    };
    bansosProgramListResponseSchema.parse(payload);
    return ok(c, payload.data, meta);
  })
  .get("/programs/:id", async (c) => {
    const sessionUser = c.get("sessionUser");
    const { id } = parseParams(c.req.param(), idParamSchema);
    const [row] = await getDb().select().from(bansosProgram).where(eq(bansosProgram.id, id)).limit(1);
    if (!row) throw notFound("Bansos program not found");
    const requestRows = await getDb()
      .select()
      .from(serviceRequest)
      .where(and(eq(serviceRequest.requestedBy, sessionUser.id), eq(serviceRequest.type, "BANSOS_APPLICATION")))
      .orderBy(desc(serviceRequest.createdAt));
    const userApplicationMap = buildUserApplicationMap(requestRows);
    const payload = { success: true as const, data: { ...mapProgram(row), userApplication: userApplicationMap.get(row.id) ?? null } };
    bansosProgramResponseSchema.parse(payload);
    return ok(c, payload.data);
  });
