import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { Hono } from "hono";

import {
  addHouseholdMemberSchema,
  createHouseholdSchema,
  householdAuditLogResponseSchema,
  idParamSchema,
  householdListQuerySchema,
  householdListResponseSchema,
  householdResponseSchema,
  updateHouseholdMemberSchema,
  updateHouseholdSchema,
} from "@abdimas/contracts";
import { adminActivityLog, citizen, getDb, household, householdMember, mutation } from "@abdimas/db";

import { logAdminActivity } from "../lib/admin-logs.js";
import { conflict, notFound, validationError } from "../lib/errors.js";
import { buildPageMeta, getOffset } from "../lib/pagination.js";
import { created, ok } from "../lib/response.js";
import { toIso } from "../lib/serialize.js";
import { parseJson, parseParams, parseQuery, sanitizeSearchTerm } from "../lib/validation.js";
import { adminMiddleware } from "../middleware/auth.js";
import { addHouseholdMemberService, createHouseholdService, normalizeHouseholdRelationship } from "../services/households.js";

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

function mapHouseholdBase(
  row: typeof household.$inferSelect & { memberCount?: number; headCitizen?: typeof citizen.$inferSelect | null },
) {
  return {
    id: row.id,
    kkNumber: row.kkNumber,
    headCitizenId: row.headCitizenId,
    address: row.address,
    rt: row.rt,
    rw: row.rw,
    status: row.status,
    memberCount: row.memberCount,
    createdAt: toIso(row.createdAt) ?? new Date().toISOString(),
    updatedAt: toIso(row.updatedAt) ?? new Date().toISOString(),
    ...(row.headCitizen ? { headCitizen: mapCitizen(row.headCitizen) } : {}),
  };
}

export const householdsRoutes = new Hono<{ Variables: { sessionUser: { id: string; role: string } } }>()
  .use("*", adminMiddleware)
  .get("/", async (c) => {
    const query = parseQuery(
      {
        page: c.req.query("page"),
        limit: c.req.query("limit"),
        q: sanitizeSearchTerm(c.req.query("q") || undefined),
        rt: c.req.query("rt") || undefined,
      },
      householdListQuerySchema,
    );

    const filters = [];
    if (query.q) {
      filters.push(
        or(
          ilike(household.kkNumber, `%${query.q}%`),
          ilike(household.address, `%${query.q}%`),
          ilike(citizen.name, `%${query.q}%`),
          ilike(citizen.nik, `%${query.q}%`),
        ),
      );
    }
    if (query.rt) filters.push(eq(household.rt, query.rt));
    const where = filters.length > 0 ? and(...filters) : undefined;

    const db = getDb();
    const [{ total }] = await db
      .select({ total: sql<number>`count(distinct ${household.id})::int` })
      .from(household)
      .leftJoin(citizen, eq(citizen.id, household.headCitizenId))
      .where(where);

    const rows = await db
      .select({
        id: household.id,
        kkNumber: household.kkNumber,
        headCitizenId: household.headCitizenId,
        address: household.address,
        rt: household.rt,
        rw: household.rw,
        status: household.status,
        createdAt: household.createdAt,
        updatedAt: household.updatedAt,
        headCitizen: citizen,
        memberCount: sql<number>`(
          select count(*)::int from household_members hm where hm.household_id = ${household.id}
        )`,
      })
      .from(household)
      .leftJoin(citizen, eq(citizen.id, household.headCitizenId))
      .where(where)
      .orderBy(desc(household.createdAt))
      .limit(query.limit)
      .offset(getOffset(query.page, query.limit));

    const meta = buildPageMeta({ page: query.page, limit: query.limit, total: Number(total || 0) });
    const payload = {
      success: true as const,
      data: rows.map((row) =>
        mapHouseholdBase({
          ...row,
          headCitizen: row.headCitizen,
          memberCount: Number(row.memberCount || 0),
        }),
      ),
      meta,
    };
    householdListResponseSchema.parse(payload);
    return ok(c, payload.data, meta);
  })
  .post("/", async (c) => {
    const body = await parseJson(c.req.raw, createHouseholdSchema);
    const inserted = await createHouseholdService({
      adminId: c.get("sessionUser").id,
      body: {
        kkNumber: body.kkNumber,
        headCitizenId: body.headCitizenId,
        headCitizenName: body.headCitizenName,
        address: body.address,
        rt: body.rt,
        rw: body.rw,
        status: body.status,
      },
    });

    const [headCitizenRow] = await getDb()
      .select()
      .from(citizen)
      .where(eq(citizen.id, inserted.headCitizenId))
      .limit(1);

    const payload = {
      success: true as const,
      data: {
        ...mapHouseholdBase({ ...inserted, headCitizen: headCitizenRow, memberCount: 1 }),
        members: [
          {
            id: "",
            householdId: inserted.id,
            citizenId: inserted.headCitizenId,
            relationship: "HEAD_OF_FAMILY",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            citizen: mapCitizen(headCitizenRow),
          },
        ],
      },
    };
    householdResponseSchema.parse(payload);
    return created(c, payload.data);
  })
  .get("/:id", async (c) => {
    const { id: householdId } = parseParams(c.req.param(), idParamSchema);
    const db = getDb();
    const [base, members] = await Promise.all([
      db
        .select({
          id: household.id,
          kkNumber: household.kkNumber,
          headCitizenId: household.headCitizenId,
          address: household.address,
          rt: household.rt,
          rw: household.rw,
          status: household.status,
          createdAt: household.createdAt,
          updatedAt: household.updatedAt,
          headCitizen: citizen,
        })
        .from(household)
        .leftJoin(citizen, eq(citizen.id, household.headCitizenId))
        .where(eq(household.id, householdId))
        .limit(1),
      db
        .select({
          id: householdMember.id,
          householdId: householdMember.householdId,
          citizenId: householdMember.citizenId,
          relationship: householdMember.relationship,
          createdAt: householdMember.createdAt,
          updatedAt: householdMember.updatedAt,
          citizen,
        })
        .from(householdMember)
        .innerJoin(citizen, eq(citizen.id, householdMember.citizenId))
        .where(eq(householdMember.householdId, householdId))
        .orderBy(householdMember.createdAt),
    ]);

    if (!base[0]) throw notFound("Household not found");

    const payload = {
      success: true as const,
      data: {
        ...mapHouseholdBase({
          ...base[0],
          headCitizen: base[0].headCitizen,
          memberCount: members.length,
        }),
        members: members.map((member) => ({
          id: member.id,
          householdId: member.householdId,
          citizenId: member.citizenId,
          relationship: member.relationship,
          createdAt: toIso(member.createdAt) ?? new Date().toISOString(),
          updatedAt: toIso(member.updatedAt) ?? new Date().toISOString(),
          citizen: mapCitizen(member.citizen),
        })),
      },
    };
    householdResponseSchema.parse(payload);
    return ok(c, payload.data);
  })
  .patch("/:id", async (c) => {
    const { id: householdId } = parseParams(c.req.param(), idParamSchema);
    const body = await parseJson(c.req.raw, updateHouseholdSchema);
    const db = getDb();

    if (body.kkNumber) {
      const duplicate = await db
        .select({ id: household.id })
        .from(household)
        .where(and(eq(household.kkNumber, body.kkNumber), sql`${household.id} <> ${householdId}`))
        .limit(1);
      if (duplicate.length > 0) throw conflict("KK number already exists");
    }

    if (body.headCitizenId) {
      const exists = await db
        .select({ id: citizen.id })
        .from(citizen)
        .where(eq(citizen.id, body.headCitizenId))
        .limit(1);
      if (exists.length === 0) throw notFound("Head citizen not found");
    }

    if (body.headCitizenId) {
      const existingMembership = await db
        .select({ id: householdMember.id })
        .from(householdMember)
        .where(and(eq(householdMember.citizenId, body.headCitizenId), sql`${householdMember.householdId} <> ${householdId}`))
        .limit(1);
      if (existingMembership[0]) throw conflict("Head citizen already belongs to another active household");
    }

    const [updated] = await db.update(household).set(body).where(eq(household.id, householdId)).returning();
    if (!updated) throw notFound("Household not found");
    const [headCitizenRow] = await db
      .select()
      .from(citizen)
      .where(eq(citizen.id, updated.headCitizenId))
      .limit(1);

    const payload = {
      success: true as const,
      data: {
        ...mapHouseholdBase({ ...updated, headCitizen: headCitizenRow }),
      },
    };
    householdResponseSchema.parse(payload);
    return ok(c, payload.data);
  })
  .delete("/:id", async (c) => {
    const { id: householdId } = parseParams(c.req.param(), idParamSchema);
    const db = getDb();
    const [householdRow, members] = await Promise.all([
      db
        .select()
        .from(household)
        .where(eq(household.id, householdId))
        .limit(1),
      db
        .select({
          citizenId: householdMember.citizenId,
          relationship: householdMember.relationship,
        })
        .from(householdMember)
        .where(eq(householdMember.householdId, householdId)),
    ]);

    if (!householdRow[0]) throw notFound("Household not found");
    const memberCitizenIds = [...new Set(members.map((member) => member.citizenId))];
    const membershipCounts =
      memberCitizenIds.length > 0
        ? await db
            .select({
              citizenId: householdMember.citizenId,
              householdCount: sql<number>`count(*)::int`,
            })
            .from(householdMember)
            .where(inArray(householdMember.citizenId, memberCitizenIds))
            .groupBy(householdMember.citizenId)
        : [];

    const retainedCitizenIds = membershipCounts
      .filter((row) => Number(row.householdCount || 0) > 1)
      .map((row) => row.citizenId);
    const deletedCitizenIds = memberCitizenIds.filter((citizenId) => !retainedCitizenIds.includes(citizenId));

    const [deletedHousehold] = await db.delete(household).where(eq(household.id, householdId)).returning();
    if (deletedCitizenIds.length > 0) {
      await db.delete(mutation).where(inArray(mutation.citizenId, deletedCitizenIds)).returning();
      await db.delete(citizen).where(inArray(citizen.id, deletedCitizenIds)).returning();
    }

    await logAdminActivity({
      adminId: c.get("sessionUser").id,
      action: "HOUSEHOLD_DELETED",
      entityType: "HOUSEHOLD",
      entityId: deletedHousehold.id,
      metadata: { kkNumber: deletedHousehold.kkNumber },
    });

    return ok(c, {
      id: deletedHousehold.id,
      deletedCitizenIds,
      retainedCitizenIds,
    });
  })
  .post("/:id/members", async (c) => {
    const { id: householdId } = parseParams(c.req.param(), idParamSchema);
    const body = await parseJson(c.req.raw, addHouseholdMemberSchema);
    const inserted = await addHouseholdMemberService({
      adminId: c.get("sessionUser").id,
      householdId,
      citizenId: body.citizenId,
      relationship: body.relationship,
    });
    const [citizenRow] = await getDb().select().from(citizen).where(eq(citizen.id, body.citizenId)).limit(1);

    const payload = {
      success: true as const,
      data: {
        id: inserted.id,
        householdId: inserted.householdId,
        citizenId: inserted.citizenId,
        relationship: inserted.relationship,
        createdAt: toIso(inserted.createdAt) ?? new Date().toISOString(),
        updatedAt: toIso(inserted.updatedAt) ?? new Date().toISOString(),
        citizen: mapCitizen(citizenRow),
      },
    };
    return created(c, payload.data);
  })
  .patch("/:id/members/:memberId", async (c) => {
    const { id: householdId } = parseParams({ id: c.req.param("id") }, idParamSchema);
    const { id: memberId } = parseParams({ id: c.req.param("memberId") }, idParamSchema);
    const body = await parseJson(c.req.raw, updateHouseholdMemberSchema);
    const db = getDb();

    // Find member to get citizenId
    const [member] = await db
      .select()
      .from(householdMember)
      .where(and(eq(householdMember.id, memberId), eq(householdMember.householdId, householdId)))
      .limit(1);

    if (!member) throw notFound("Household member not found");

    if (body.relationship) {
      const normalizedRelationship = normalizeHouseholdRelationship(body.relationship);
      if (normalizedRelationship === "HEAD_OF_FAMILY") {
        const existingHead = await db
          .select({ id: householdMember.id })
          .from(householdMember)
          .where(
            and(
              eq(householdMember.householdId, householdId),
              eq(householdMember.relationship, "HEAD_OF_FAMILY"),
              sql`${householdMember.id} <> ${memberId}`,
            ),
          )
          .limit(1);
        if (existingHead[0]) throw conflict("Household already has a head of family");
      }

      await db
        .update(householdMember)
        .set({ relationship: normalizedRelationship })
        .where(eq(householdMember.id, memberId));
    }

    if (body.birthDate || body.occupation) {
      const citizenUpdates: Record<string, any> = {};
      if (body.birthDate) citizenUpdates.birthDate = new Date(body.birthDate);
      if (body.occupation) citizenUpdates.occupation = body.occupation;
      await db.update(citizen).set(citizenUpdates).where(eq(citizen.id, member.citizenId));
    }

    return ok(c, { id: member.id });
  })
  .delete("/:id/members/:memberId", async (c) => {
    const { id: householdId } = parseParams({ id: c.req.param("id") }, idParamSchema);
    const { id: memberId } = parseParams({ id: c.req.param("memberId") }, idParamSchema);
    const [memberRow] = await getDb()
      .select()
      .from(householdMember)
      .where(and(eq(householdMember.id, memberId), eq(householdMember.householdId, householdId)))
      .limit(1);
    if (!memberRow) throw notFound("Household member not found");
    if (memberRow.relationship === "HEAD_OF_FAMILY") {
      throw validationError("Head of family cannot be removed before reassigning the role");
    }
    const [deleted] = await getDb()
      .delete(householdMember)
      .where(and(eq(householdMember.id, memberId), eq(householdMember.householdId, householdId)))
      .returning();

    if (!deleted) throw notFound("Household member not found");
    return ok(c, { id: deleted.id });
  })
  .get("/:id/audit-log", async (c) => {
    const { id: householdId } = parseParams(c.req.param(), idParamSchema);
    const rows = await getDb()
      .select()
      .from(adminActivityLog)
      .where(and(eq(adminActivityLog.entityType, "HOUSEHOLD"), eq(adminActivityLog.entityId, householdId)))
      .orderBy(desc(adminActivityLog.createdAt));

    const payload = {
      success: true as const,
      data: rows.map((row) => ({
        id: row.id,
        adminId: row.adminId,
        action: row.action,
        entityType: row.entityType,
        entityId: row.entityId ?? null,
        metadata: row.metadata ?? {},
        createdAt: toIso(row.createdAt) ?? new Date().toISOString(),
      })),
    };
    householdAuditLogResponseSchema.parse(payload);
    return ok(c, payload.data);
  });
