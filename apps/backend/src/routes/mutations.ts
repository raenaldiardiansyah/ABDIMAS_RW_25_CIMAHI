import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { Hono } from "hono";

import {
  createMutationSchema,
  mutationListQuerySchema,
  mutationListResponseSchema,
  mutationResponseSchema,
  updateMutationStatusSchema,
} from "@abdimas/contracts";
import { citizen, getDb, mutation } from "@abdimas/db";

import { logAdminActivity } from "../lib/admin-logs";
import { notFound } from "../lib/errors";
import { buildPageMeta, getOffset } from "../lib/pagination";
import { ok } from "../lib/response";
import { toIso } from "../lib/serialize";
import { parseJson, parseQuery } from "../lib/validation";
import { adminMiddleware } from "../middleware/auth";

function mapMutation(row: typeof mutation.$inferSelect) {
  return {
    id: row.id,
    citizenId: row.citizenId,
    type: row.type,
    status: row.status,
    fromAddress: row.fromAddress ?? null,
    toAddress: row.toAddress ?? null,
    reason: row.reason ?? null,
    requestedBy: row.requestedBy,
    reviewedBy: row.reviewedBy ?? null,
    reviewedAt: toIso(row.reviewedAt),
    createdAt: toIso(row.createdAt) ?? new Date().toISOString(),
    updatedAt: toIso(row.updatedAt) ?? new Date().toISOString(),
  };
}

export const mutationsRoutes = new Hono<{ Variables: { sessionUser: { id: string; role: string } } }>()
  .use("*", adminMiddleware)
  .get("/export", async (c) => {
    const query = parseQuery(
      {
        page: c.req.query("page"),
        limit: c.req.query("limit"),
        q: c.req.query("q") || undefined,
        type: c.req.query("type") || undefined,
        status: c.req.query("status") || undefined,
      },
      mutationListQuerySchema,
    );

    const filters = [];
    if (query.type) filters.push(eq(mutation.type, query.type));
    if (query.status) filters.push(eq(mutation.status, query.status));
    if (query.q) {
      filters.push(
        or(
          ilike(citizen.name, `%${query.q}%`),
          ilike(citizen.nik, `%${query.q}%`),
          ilike(mutation.reason, `%${query.q}%`),
        ),
      );
    }
    const where = filters.length > 0 ? and(...filters) : undefined;

    const rows = await getDb()
      .select({
        id: mutation.id,
        citizenId: mutation.citizenId,
        type: mutation.type,
        status: mutation.status,
        fromAddress: mutation.fromAddress,
        toAddress: mutation.toAddress,
        reason: mutation.reason,
        requestedBy: mutation.requestedBy,
        reviewedBy: mutation.reviewedBy,
        reviewedAt: mutation.reviewedAt,
        createdAt: mutation.createdAt,
        updatedAt: mutation.updatedAt,
      })
      .from(mutation)
      .innerJoin(citizen, eq(citizen.id, mutation.citizenId))
      .where(where)
      .orderBy(desc(mutation.createdAt));

    const header = [
      "id",
      "citizenId",
      "type",
      "status",
      "fromAddress",
      "toAddress",
      "reason",
      "requestedBy",
      "reviewedBy",
      "reviewedAt",
      "createdAt",
      "updatedAt",
    ];
    const lines = [
      header.join(","),
      ...rows.map((row) =>
        [
          row.id,
          row.citizenId,
          row.type,
          row.status,
          row.fromAddress ?? "",
          row.toAddress ?? "",
          (row.reason ?? "").replace(/,/g, " "),
          row.requestedBy,
          row.reviewedBy ?? "",
          toIso(row.reviewedAt) ?? "",
          toIso(row.createdAt) ?? "",
          toIso(row.updatedAt) ?? "",
        ].join(","),
      ),
    ].join("\n");

    c.header("content-type", "text/csv; charset=utf-8");
    c.header("content-disposition", 'attachment; filename="mutations.csv"');
    return c.body(lines);
  })
  .get("/", async (c) => {
    const query = parseQuery(
      {
        page: c.req.query("page"),
        limit: c.req.query("limit"),
        q: c.req.query("q") || undefined,
        type: c.req.query("type") || undefined,
        status: c.req.query("status") || undefined,
      },
      mutationListQuerySchema,
    );

    const filters = [];
    if (query.type) filters.push(eq(mutation.type, query.type));
    if (query.status) filters.push(eq(mutation.status, query.status));
    if (query.q) {
      filters.push(
        or(
          ilike(citizen.name, `%${query.q}%`),
          ilike(citizen.nik, `%${query.q}%`),
          ilike(mutation.reason, `%${query.q}%`),
        ),
      );
    }
    const where = filters.length > 0 ? and(...filters) : undefined;
    const db = getDb();

    const [{ total }] = await db
      .select({ total: sql<number>`count(distinct ${mutation.id})::int` })
      .from(mutation)
      .innerJoin(citizen, eq(citizen.id, mutation.citizenId))
      .where(where);

    const rows = await db
      .select({
        id: mutation.id,
        citizenId: mutation.citizenId,
        type: mutation.type,
        status: mutation.status,
        fromAddress: mutation.fromAddress,
        toAddress: mutation.toAddress,
        reason: mutation.reason,
        requestedBy: mutation.requestedBy,
        reviewedBy: mutation.reviewedBy,
        reviewedAt: mutation.reviewedAt,
        createdAt: mutation.createdAt,
        updatedAt: mutation.updatedAt,
      })
      .from(mutation)
      .innerJoin(citizen, eq(citizen.id, mutation.citizenId))
      .where(where)
      .orderBy(desc(mutation.createdAt))
      .limit(query.limit)
      .offset(getOffset(query.page, query.limit));

    const meta = buildPageMeta({ page: query.page, limit: query.limit, total: Number(total || 0) });
    const payload = { success: true as const, data: rows.map(mapMutation), meta };
    mutationListResponseSchema.parse(payload);
    return ok(c, payload.data, meta);
  })
  .post("/", async (c) => {
    const sessionUser = c.get("sessionUser");
    const body = await parseJson(c.req.raw, createMutationSchema);
    const [citizenRow] = await getDb()
      .select({ id: citizen.id })
      .from(citizen)
      .where(eq(citizen.id, body.citizenId))
      .limit(1);
    if (!citizenRow) throw notFound("Citizen not found");

    const [createdRow] = await getDb()
      .insert(mutation)
      .values({
        citizenId: body.citizenId,
        type: body.type,
        status: "PENDING",
        fromAddress: body.fromAddress ?? null,
        toAddress: body.toAddress ?? null,
        reason: body.reason ?? null,
        requestedBy: sessionUser.id,
      })
      .returning();

    const payload = { success: true as const, data: mapMutation(createdRow) };
    mutationResponseSchema.parse(payload);
    return ok(c, payload.data, undefined, 201);
  })
  .get("/:id", async (c) => {
    const [row] = await getDb()
      .select()
      .from(mutation)
      .where(eq(mutation.id, c.req.param("id")))
      .limit(1);
    if (!row) throw notFound("Mutation not found");
    const payload = { success: true as const, data: mapMutation(row) };
    mutationResponseSchema.parse(payload);
    return ok(c, payload.data);
  })
  .patch("/:id/status", async (c) => {
    const sessionUser = c.get("sessionUser");
    const body = await parseJson(c.req.raw, updateMutationStatusSchema);
    const [updated] = await getDb()
      .update(mutation)
      .set({
        status: body.status,
        reviewedBy: sessionUser.id,
        reviewedAt: new Date(),
        ...(body.reason !== undefined ? { reason: body.reason } : {}),
      })
      .where(eq(mutation.id, c.req.param("id")))
      .returning();
    if (!updated) throw notFound("Mutation not found");

    await logAdminActivity({
      adminId: sessionUser.id,
      action: "MUTATION_STATUS_UPDATED",
      entityType: "MUTATION",
      entityId: updated.id,
      metadata: { status: body.status, reason: body.reason ?? null },
    });

    const payload = { success: true as const, data: mapMutation(updated) };
    mutationResponseSchema.parse(payload);
    return ok(c, payload.data);
  })
  ;
