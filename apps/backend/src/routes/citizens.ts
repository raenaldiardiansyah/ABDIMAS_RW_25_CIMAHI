import { and, desc, eq, getTableColumns, ilike, or, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import {
  citizenListQuerySchema,
  citizenListResponseSchema,
  citizenResponseSchema,
  citizenSchema,
  createCitizenSchema,
  idParamSchema,
  updateCitizenSchema,
} from "@abdimas/contracts";
import { citizen, getDb, household, householdMember } from "@abdimas/db";

import { notFound } from "../lib/errors.js";
import { buildPageMeta, getOffset } from "../lib/pagination.js";
import { created, ok } from "../lib/response.js";
import { toIso } from "../lib/serialize.js";
import { parseJson, parseParams, parseQuery, sanitizeSearchTerm } from "../lib/validation.js";
import { adminMiddleware } from "../middleware/auth.js";
import { createCitizenRegistrationService, createCitizenService, deleteCitizenService, updateCitizenService } from "../services/citizens.js";

const citizenColumns = getTableColumns(citizen);
const householdSummarySchema = z.object({
  id: z.string(),
  kkNumber: z.string(),
  headCitizenId: z.string(),
  address: z.string(),
  rt: z.string(),
  rw: z.string(),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const citizenRegistrationMemberSchema = createCitizenSchema.extend({
  relationship: z.string().trim().min(1).max(60),
});

const createCitizenRegistrationSchema = z
  .object({
    citizen: createCitizenSchema,
    household: z
      .object({
        isHeadOfFamily: z.boolean().default(false),
        kkNumber: z.string().regex(/^\d{16}$/, "KK number must be exactly 16 numeric digits").optional(),
        relationship: z.string().trim().min(1).max(60).optional(),
        members: z.array(citizenRegistrationMemberSchema).default([]),
      })
      .optional(),
  })
  .superRefine((value, ctx) => {
    const householdPayload = value.household;
    if (!householdPayload) return;

    if (householdPayload.isHeadOfFamily && !householdPayload.kkNumber) {
      ctx.addIssue({
        code: "custom",
        path: ["household", "kkNumber"],
        message: "KK number is required when creating a new household",
      });
    }

    if (!householdPayload.isHeadOfFamily && householdPayload.members.length > 0) {
      ctx.addIssue({
        code: "custom",
        path: ["household", "members"],
        message: "Additional members can only be submitted for a new household",
      });
    }

    if (!householdPayload.isHeadOfFamily && householdPayload.kkNumber && !householdPayload.relationship) {
      ctx.addIssue({
        code: "custom",
        path: ["household", "relationship"],
        message: "Relationship is required when KK number is provided",
      });
    }
  });

const citizenRegistrationResponseSchema = z.object({
  citizen: citizenSchema,
  household: householdSummarySchema.nullable(),
  members: z.array(
    z.object({
      id: z.string(),
      citizenId: z.string(),
      relationship: z.string(),
    }),
  ),
});

function mapCitizen(
  row: typeof citizen.$inferSelect & {
    noKK?: string | null;
  },
) {
  return {
    id: row.id,
    userId: row.userId ?? null,
    noKK: row.noKK ?? null,
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
    isArchived: row.isArchived,
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
        q: sanitizeSearchTerm(c.req.query("q") || undefined),
        status: c.req.query("status") || undefined,
        rt: c.req.query("rt") || undefined,
        rw: c.req.query("rw") || undefined,
      },
      citizenListQuerySchema,
    );

    const filters = [];
    if (query.q) {
      filters.push(or(ilike(citizen.name, `%${query.q}%`), ilike(citizen.nik, `%${query.q}%`)));
    }
    if (query.status) filters.push(eq(citizen.status, query.status));
    if (query.rt) filters.push(eq(citizen.rt, query.rt));
    if (query.rw) filters.push(eq(citizen.rw, query.rw));
    const where = filters.length > 0 ? and(eq(citizen.isArchived, false), ...filters) : eq(citizen.isArchived, false);

    const db = getDb();
    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(citizen)
      .where(where);

    const rows = await db
      .select({
        ...citizenColumns,
        noKK: household.kkNumber,
      })
      .from(citizen)
      .leftJoin(householdMember, eq(householdMember.citizenId, citizen.id))
      .leftJoin(household, eq(household.id, householdMember.householdId))
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
    const inserted = await createCitizenService({ adminId: c.get("sessionUser").id, body });

    const payload = { success: true as const, data: mapCitizen(inserted) };
    citizenResponseSchema.parse(payload);
    return created(c, payload.data);
  })
  .post("/registration", async (c) => {
    const body = await parseJson(c.req.raw, createCitizenRegistrationSchema);
    const inserted = await createCitizenRegistrationService({
      adminId: c.get("sessionUser").id,
      citizen: body.citizen,
      household: body.household,
    });

    const payload = {
      success: true as const,
      data: {
        citizen: mapCitizen(inserted.citizen),
        household: inserted.household
          ? {
              id: inserted.household.id,
              kkNumber: inserted.household.kkNumber,
              headCitizenId: inserted.household.headCitizenId,
              address: inserted.household.address,
              rt: inserted.household.rt,
              rw: inserted.household.rw,
              status: inserted.household.status,
              createdAt: toIso(inserted.household.createdAt) ?? new Date().toISOString(),
              updatedAt: toIso(inserted.household.updatedAt) ?? new Date().toISOString(),
            }
          : null,
        members: inserted.members.map((member) => ({
          id: member.membershipId,
          citizenId: member.citizen.id,
          relationship: member.relationship,
        })),
      },
    };

    citizenRegistrationResponseSchema.parse(payload.data);
    return created(c, payload.data);
  })
  .get("/:id", async (c) => {
    const { id } = parseParams(c.req.param(), idParamSchema);
    const row = await getDb()
      .select({
        ...citizenColumns,
        noKK: household.kkNumber,
      })
      .from(citizen)
      .leftJoin(householdMember, eq(householdMember.citizenId, citizen.id))
      .leftJoin(household, eq(household.id, householdMember.householdId))
      .where(eq(citizen.id, id))
      .limit(1);
    if (!row[0]) throw notFound("Citizen not found");
    const payload = { success: true as const, data: mapCitizen(row[0]) };
    citizenResponseSchema.parse(payload);
    return ok(c, payload.data);
  })
  .patch("/:id", async (c) => {
    const body = await parseJson(c.req.raw, updateCitizenSchema);
    const { id } = parseParams(c.req.param(), idParamSchema);
    const updated = await updateCitizenService({ adminId: c.get("sessionUser").id, citizenId: id, body });
    const payload = { success: true as const, data: mapCitizen(updated) };
    citizenResponseSchema.parse(payload);
    return ok(c, payload.data);
  })
  .delete("/:id", async (c) => {
    const { id } = parseParams(c.req.param(), idParamSchema);
    const result = await deleteCitizenService({ adminId: c.get("sessionUser").id, citizenId: id });
    return ok(c, {
      id: result.row.id,
      mode: result.mode,
      message: result.mode === "archived" ? "Citizen archived because related records exist" : "Citizen deleted successfully",
    });
  });
