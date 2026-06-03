import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { Hono } from "hono";

import {
  citizenListQuerySchema,
  citizenListResponseSchema,
  citizenResponseSchema,
  createCitizenSchema,
  updateCitizenSchema,
} from "@abdimas/contracts";
import { citizen, getDb } from "@abdimas/db";

import { conflict, notFound } from "../lib/errors";
import { buildPageMeta, getOffset } from "../lib/pagination";
import { created, ok } from "../lib/response";
import { toIso } from "../lib/serialize";
import { parseJson, parseQuery } from "../lib/validation";
import { adminMiddleware } from "../middleware/auth";

function mapCitizen(row: typeof citizen.$inferSelect) {
  return {
    id: row.id,
    userId: row.userId ?? null,
    nik: row.nik,
    name: row.name,
    gender: row.gender,
    birthPlace: row.birthPlace,
    birthDate: row.birthDate,
    religion: row.religion,
    maritalStatus: row.maritalStatus,
    occupation: row.occupation,
    education: row.education,
    bloodType: row.bloodType ?? null,
    address: row.address,
    rt: row.rt,
    rw: row.rw,
    status: row.status,
    createdAt: toIso(row.createdAt) ?? new Date().toISOString(),
    updatedAt: toIso(row.updatedAt) ?? new Date().toISOString(),
  };
}

export const citizensRoutes = new Hono<{ Variables: { sessionUser: { id: string; role: string } } }>()
  .use("*", adminMiddleware)
  .get("/", async (c) => {
    const query = parseQuery(
      {
        page: c.req.query("page"),
        limit: c.req.query("limit"),
        q: c.req.query("q") || undefined,
        status: c.req.query("status") || undefined,
      },
      citizenListQuerySchema,
    );

    const filters = [];
    if (query.q) {
      filters.push(or(ilike(citizen.name, `%${query.q}%`), ilike(citizen.nik, `%${query.q}%`)));
    }
    if (query.status) filters.push(eq(citizen.status, query.status));
    const where = filters.length > 0 ? and(...filters) : undefined;

    const db = getDb();
    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(citizen)
      .where(where);

    const rows = await db
      .select()
      .from(citizen)
      .where(where)
      .orderBy(desc(citizen.createdAt))
      .limit(query.limit)
      .offset(getOffset(query.page, query.limit));

    const meta = buildPageMeta({ page: query.page, limit: query.limit, total: Number(total || 0) });
    const payload = { success: true as const, data: rows.map(mapCitizen), meta };
    citizenListResponseSchema.parse(payload);
    return ok(c, payload.data, meta);
  })
  .post("/", async (c) => {
    const body = await parseJson(c.req.raw, createCitizenSchema);
    const db = getDb();

    const existingWhere = body.userId
      ? or(eq(citizen.nik, body.nik), eq(citizen.userId, body.userId))
      : eq(citizen.nik, body.nik);
    const existing = await db.select({ id: citizen.id }).from(citizen).where(existingWhere).limit(1);

    if (existing.length > 0) {
      throw conflict("Citizen with same NIK or user is already registered");
    }

    const [inserted] = await db
      .insert(citizen)
      .values({
        userId: body.userId ?? null,
        nik: body.nik,
        name: body.name,
        gender: body.gender,
        birthPlace: body.birthPlace,
        birthDate: body.birthDate,
        religion: body.religion,
        maritalStatus: body.maritalStatus,
        occupation: body.occupation,
        education: body.education,
        bloodType: body.bloodType ?? null,
        address: body.address,
        rt: body.rt,
        rw: body.rw,
        status: body.status,
      })
      .returning();

    const payload = { success: true as const, data: mapCitizen(inserted) };
    citizenResponseSchema.parse(payload);
    return created(c, payload.data);
  })
  .get("/:id", async (c) => {
    const row = await getDb().select().from(citizen).where(eq(citizen.id, c.req.param("id"))).limit(1);
    if (!row[0]) throw notFound("Citizen not found");
    const payload = { success: true as const, data: mapCitizen(row[0]) };
    citizenResponseSchema.parse(payload);
    return ok(c, payload.data);
  })
  .patch("/:id", async (c) => {
    const body = await parseJson(c.req.raw, updateCitizenSchema);
    const db = getDb();
    const citizenId = c.req.param("id");

    if (body.nik) {
      const duplicate = await db
        .select({ id: citizen.id })
        .from(citizen)
        .where(and(eq(citizen.nik, body.nik), sql`${citizen.id} <> ${citizenId}`))
        .limit(1);

      if (duplicate.length > 0) throw conflict("Citizen NIK already exists");
    }

    const [updated] = await db
      .update(citizen)
      .set({
        ...(body.userId !== undefined ? { userId: body.userId } : {}),
        ...(body.nik !== undefined ? { nik: body.nik } : {}),
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.gender !== undefined ? { gender: body.gender } : {}),
        ...(body.birthPlace !== undefined ? { birthPlace: body.birthPlace } : {}),
        ...(body.birthDate !== undefined ? { birthDate: body.birthDate } : {}),
        ...(body.religion !== undefined ? { religion: body.religion } : {}),
        ...(body.maritalStatus !== undefined ? { maritalStatus: body.maritalStatus } : {}),
        ...(body.occupation !== undefined ? { occupation: body.occupation } : {}),
        ...(body.education !== undefined ? { education: body.education } : {}),
        ...(body.bloodType !== undefined ? { bloodType: body.bloodType ?? null } : {}),
        ...(body.address !== undefined ? { address: body.address } : {}),
        ...(body.rt !== undefined ? { rt: body.rt } : {}),
        ...(body.rw !== undefined ? { rw: body.rw } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
      })
      .where(eq(citizen.id, citizenId))
      .returning();

    if (!updated) throw notFound("Citizen not found");
    const payload = { success: true as const, data: mapCitizen(updated) };
    citizenResponseSchema.parse(payload);
    return ok(c, payload.data);
  });
