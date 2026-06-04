import { and, desc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";

import {
  createHouseholdRequestSchema,
  createMemberRequestSchema,
  createMutationRequestSchema,
  idParamSchema,
  requestListQuerySchema,
  serviceRequestListResponseSchema,
  serviceRequestResponseSchema,
} from "@abdimas/contracts";
import { citizen, getDb, historyEntry, householdMember, serviceRequest } from "@abdimas/db";

import { conflict, notFound, validationError } from "../lib/errors.js";
import { buildPageMeta, getOffset } from "../lib/pagination.js";
import { created, ok } from "../lib/response.js";
import { toIso } from "../lib/serialize.js";
import { parseJson, parseParams, parseQuery } from "../lib/validation.js";
import { authMiddleware, verifiedWargaMiddleware } from "../middleware/auth.js";

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

async function createRequestHistoryEntry(input: {
  userId: string;
  requestId: string;
  type: "HOUSEHOLD_CREATE" | "MUTATION_IN" | "MUTATION_OUT";
  status: "PENDING" | "APPROVED" | "REJECTED";
  title: string;
  description: string;
  rejectionReason?: string | null;
}) {
  await getDb().insert(historyEntry).values({
    userId: input.userId,
    type: "REQUEST",
    title: input.title,
    description: input.description,
    metadata: {
      requestId: input.requestId,
      requestType: input.type,
      status: input.status,
      rejectionReason: input.rejectionReason ?? null,
    },
  });
}

export const userRequestsRoutes = new Hono<{ Variables: { sessionUser: { id: string; role: string; name?: string } } }>()
  .use("*", authMiddleware)
  .get("/", async (c) => {
    const sessionUser = c.get("sessionUser");
    const query = parseQuery(
      {
        page: c.req.query("page"),
        limit: c.req.query("limit"),
        type: c.req.query("type") || undefined,
        status: c.req.query("status") || undefined,
      },
      requestListQuerySchema,
    );

    const filters = [eq(serviceRequest.requestedBy, sessionUser.id)];
    if (query.type) filters.push(eq(serviceRequest.type, query.type));
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
    const payload = { success: true as const, data: rows.map(mapRequest), meta };
    serviceRequestListResponseSchema.parse(payload);
    return ok(c, payload.data, meta);
  })
  .get("/:id", async (c) => {
    const sessionUser = c.get("sessionUser");
    const { id } = parseParams(c.req.param(), idParamSchema);

    const [row] = await getDb()
      .select()
      .from(serviceRequest)
      .where(and(eq(serviceRequest.id, id), eq(serviceRequest.requestedBy, sessionUser.id)))
      .limit(1);
    if (!row) throw notFound("Request not found");

    const payload = { success: true as const, data: mapRequest(row) };
    serviceRequestResponseSchema.parse(payload);
    return ok(c, payload.data);
  })
  .use("*", verifiedWargaMiddleware)
  .post("/household-create", async (c) => {
    const sessionUser = c.get("sessionUser");
    const body = await parseJson(c.req.raw, createHouseholdRequestSchema);
    const db = getDb();

    const [citizenRow] = await db
      .select()
      .from(citizen)
      .where(and(eq(citizen.userId, sessionUser.id), eq(citizen.isArchived, false)))
      .limit(1);
    if (!citizenRow) throw notFound("Citizen profile not found");

    const [existingMembership] = await db
      .select({ id: householdMember.id })
      .from(householdMember)
      .where(eq(householdMember.citizenId, citizenRow.id))
      .limit(1);
    if (existingMembership) {
      throw conflict("You already belong to an active household");
    }

    const [createdRow] = await db
      .insert(serviceRequest)
      .values({
        type: "HOUSEHOLD_CREATE",
        status: "PENDING",
        requestedBy: sessionUser.id,
        payload: {
          household: {
            kkNumber: body.kkNumber,
            headCitizenId: citizenRow.id,
            address: body.address,
            rt: body.rt,
            rw: body.rw,
            status: "ACTIVE",
          },
          members: [
            {
              citizenId: citizenRow.id,
              nama: citizenRow.name,
              nik: citizenRow.nik,
              relationship: "HEAD_OF_FAMILY",
            },
          ],
        },
      })
      .returning();

    await createRequestHistoryEntry({
      userId: sessionUser.id,
      requestId: createdRow.id,
      type: "HOUSEHOLD_CREATE",
      status: "PENDING",
      title: "Permohonan Kartu Keluarga",
      description: "Permohonan pembuatan kartu keluarga baru telah dikirim.",
    });

    const payload = { success: true as const, data: mapRequest(createdRow) };
    serviceRequestResponseSchema.parse(payload);
    return created(c, payload.data);
  })
  .post("/member-create", async (c) => {
    const sessionUser = c.get("sessionUser");
    const body = await parseJson(c.req.raw, createMemberRequestSchema);
    const db = getDb();

    const [citizenRow] = await db
      .select()
      .from(citizen)
      .where(and(eq(citizen.userId, sessionUser.id), eq(citizen.isArchived, false)))
      .limit(1);
    if (!citizenRow) throw notFound("Citizen profile not found");

    const [existingMembership] = await db
      .select({ id: householdMember.id, householdId: householdMember.householdId })
      .from(householdMember)
      .where(eq(householdMember.citizenId, citizenRow.id))
      .limit(1);
    if (!existingMembership) {
      throw conflict("You must belong to an active household to add a member");
    }

    const [createdRow] = await db
      .insert(serviceRequest)
      .values({
        type: "MEMBER_CREATE",
        status: "PENDING",
        requestedBy: sessionUser.id,
        payload: {
          householdId: existingMembership.householdId,
          citizen: {
            nik: body.nik,
            name: body.name,
            birthPlace: body.birthPlace || "-",
            birthDate: body.birthDate || new Date().toISOString().slice(0, 10),
            gender: body.gender,
            religion: body.religion || "-",
            maritalStatus: body.maritalStatus || "-",
            education: body.education || "-",
          },
          relationship: body.relationship,
        },
      })
      .returning();

    await createRequestHistoryEntry({
      userId: sessionUser.id,
      requestId: createdRow.id,
      type: "MEMBER_CREATE" as any,
      status: "PENDING",
      title: "Permohonan Tambah Anggota",
      description: `Permohonan penambahan anggota keluarga (${body.name}) telah dikirim.`,
    });

    const payload = { success: true as const, data: mapRequest(createdRow) };
    serviceRequestResponseSchema.parse(payload);
    return created(c, payload.data);
  })
  .post("/mutation", async (c) => {
    const sessionUser = c.get("sessionUser");
    const body = await parseJson(c.req.raw, createMutationRequestSchema);
    const db = getDb();

    const [citizenRow] = await db
      .select()
      .from(citizen)
      .where(and(eq(citizen.userId, sessionUser.id), eq(citizen.isArchived, false)))
      .limit(1);
    if (!citizenRow) throw notFound("Citizen profile not found");

    const requestType = body.type === "MUTATION_IN" ? "MUTATION_IN" : "MUTATION_OUT";

    const [createdRow] = await db
      .insert(serviceRequest)
      .values({
        type: requestType,
        status: "PENDING",
        requestedBy: sessionUser.id,
        payload: {
          citizenId: citizenRow.id,
          nama: citizenRow.name,
          nik: citizenRow.nik,
          mutationDate: body.mutationDate,
          fromAddress: body.fromAddress ?? null,
          toAddress: body.toAddress ?? null,
          targetRt: body.targetRt ?? null,
          phone: body.phone ?? null,
          reason: body.reason,
        },
      })
      .returning();

    await createRequestHistoryEntry({
      userId: sessionUser.id,
      requestId: createdRow.id,
      type: requestType,
      status: "PENDING",
      title: requestType === "MUTATION_IN" ? "Permohonan Mutasi Masuk" : "Permohonan Mutasi Keluar",
      description: "Permohonan mutasi warga telah dikirim dan menunggu review admin.",
    });

    const payload = { success: true as const, data: mapRequest(createdRow) };
    serviceRequestResponseSchema.parse(payload);
    return created(c, payload.data);
  });
