import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { Hono } from "hono";

import {
  addHouseholdMemberSchema,
  createHouseholdSchema,
  householdAuditLogResponseSchema,
  householdListQuerySchema,
  householdListResponseSchema,
  householdResponseSchema,
  updateHouseholdMemberSchema,
  updateHouseholdSchema,
} from "@abdimas/contracts";
import { adminActivityLog, citizen, getDb, household, householdMember } from "@abdimas/db";

import { logAdminActivity } from "../lib/admin-logs";
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
        q: c.req.query("q") || undefined,
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
      .innerJoin(citizen, eq(citizen.id, household.headCitizenId))
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
      .innerJoin(citizen, eq(citizen.id, household.headCitizenId))
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
    const db = getDb();

    if (!body.headCitizenId && !body.headCitizenName) {
      throw fail(c, "BAD_REQUEST", "Either headCitizenId or headCitizenName must be provided");
    }

    const [existingHousehold] = await db
      .select({ id: household.id })
      .from(household)
      .where(eq(household.kkNumber, body.kkNumber))
      .limit(1);

    if (existingHousehold) throw conflict("KK number already exists");

    let finalHeadCitizenId = body.headCitizenId;

    if (finalHeadCitizenId) {
      const [existingHead] = await db
        .select({ id: citizen.id })
        .from(citizen)
        .where(eq(citizen.id, finalHeadCitizenId))
        .limit(1);
      if (!existingHead) throw notFound("Head citizen not found");
    } else {
      const dummyNik = Math.floor(Math.random() * 9000000000000000 + 1000000000000000).toString();
      const [newCitizen] = await db
        .insert(citizen)
        .values({
          nik: dummyNik,
          name: body.headCitizenName!,
          gender: "L",
          birthPlace: "-",
          birthDate: new Date().toISOString().split("T")[0],
          religion: "-",
          maritalStatus: "-",
          occupation: "-",
          education: "-",
          address: body.address,
          rt: body.rt,
          rw: body.rw,
          status: "PENDUDUK_TETAP",
        })
        .returning();
      finalHeadCitizenId = newCitizen.id;
    }

    const { headCitizenName, ...householdData } = body;
    const [inserted] = await db
      .insert(household)
      .values({ ...householdData, headCitizenId: finalHeadCitizenId! })
      .returning();

    await db
      .insert(householdMember)
      .values({ householdId: inserted.id, citizenId: finalHeadCitizenId!, relationship: "Kepala Keluarga" })
      .onConflictDoNothing();

    const [headCitizenRow] = await db
      .select()
      .from(citizen)
      .where(eq(citizen.id, finalHeadCitizenId!))
      .limit(1);

    const payload = {
      success: true as const,
      data: {
        ...mapHouseholdBase({ ...inserted, headCitizen: headCitizenRow, memberCount: 1 }),
        members: [
          {
            id: "",
            householdId: inserted.id,
            citizenId: finalHeadCitizenId!,
            relationship: "Kepala Keluarga",
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
    const householdId = c.req.param("id");
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
        .innerJoin(citizen, eq(citizen.id, household.headCitizenId))
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
    const householdId = c.req.param("id");
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
  .post("/:id/members", async (c) => {
    const householdId = c.req.param("id");
    const body = await parseJson(c.req.raw, addHouseholdMemberSchema);
    const db = getDb();
    const [householdRow, citizenRow, duplicate] = await Promise.all([
      db.select({ id: household.id }).from(household).where(eq(household.id, householdId)).limit(1),
      db.select().from(citizen).where(eq(citizen.id, body.citizenId)).limit(1),
      db
        .select({ id: householdMember.id })
        .from(householdMember)
        .where(and(eq(householdMember.householdId, householdId), eq(householdMember.citizenId, body.citizenId)))
        .limit(1),
    ]);

    if (!householdRow[0]) throw notFound("Household not found");
    if (!citizenRow[0]) throw notFound("Citizen not found");
    if (duplicate[0]) throw conflict("Citizen already belongs to this household");

    const [inserted] = await db
      .insert(householdMember)
      .values({ householdId, citizenId: body.citizenId, relationship: body.relationship })
      .returning();

    const payload = {
      success: true as const,
      data: {
        id: inserted.id,
        householdId: inserted.householdId,
        citizenId: inserted.citizenId,
        relationship: inserted.relationship,
        createdAt: toIso(inserted.createdAt) ?? new Date().toISOString(),
        updatedAt: toIso(inserted.updatedAt) ?? new Date().toISOString(),
        citizen: mapCitizen(citizenRow[0]),
      },
    };
    return created(c, payload.data);
  })
  .patch("/:id/members/:memberId", async (c) => {
    const householdId = c.req.param("id");
    const memberId = c.req.param("memberId");
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
      await db
        .update(householdMember)
        .set({ relationship: body.relationship })
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
    const householdId = c.req.param("id");
    const memberId = c.req.param("memberId");
    const [deleted] = await getDb()
      .delete(householdMember)
      .where(and(eq(householdMember.id, memberId), eq(householdMember.householdId, householdId)))
      .returning();

    if (!deleted) throw notFound("Household member not found");
    return ok(c, { id: deleted.id });
  })
  .get("/:id/audit-log", async (c) => {
    const householdId = c.req.param("id");
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
