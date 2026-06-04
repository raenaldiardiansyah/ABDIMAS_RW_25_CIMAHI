import { and, eq, sql } from "drizzle-orm";

import { citizen, getDb, household, householdMember } from "@abdimas/db";

import { logAdminActivity } from "../lib/admin-logs.js";
import { conflict, notFound, validationError } from "../lib/errors.js";

type CreateHouseholdPayload = {
  kkNumber: string;
  headCitizenId?: string;
  headCitizenName?: string;
  address: string;
  rt: string;
  rw: string;
  status: string;
};

export function normalizeHouseholdRelationship(input: string) {
  const value = input.trim();
  const map: Record<string, "HEAD_OF_FAMILY" | "SPOUSE" | "CHILD" | "PARENT" | "SIBLING" | "OTHER"> = {
    HEAD_OF_FAMILY: "HEAD_OF_FAMILY",
    "KEPALA KELUARGA": "HEAD_OF_FAMILY",
    SUAMI: "SPOUSE",
    ISTRI: "SPOUSE",
    SPOUSE: "SPOUSE",
    ANAK: "CHILD",
    CHILD: "CHILD",
    "ORANG TUA": "PARENT",
    PARENT: "PARENT",
    SAUDARA: "SIBLING",
    SIBLING: "SIBLING",
    OTHER: "OTHER",
    LAINNYA: "OTHER",
  };
  return map[value.toUpperCase()] ?? "OTHER";
}

export async function createHouseholdService(input: { adminId: string; body: CreateHouseholdPayload }) {
  const db = getDb();
  if (!input.body.headCitizenId && !input.body.headCitizenName) {
    throw validationError("headCitizenId or headCitizenName is required");
  }

  const [existingHousehold] = await Promise.all([
    db.select({ id: household.id }).from(household).where(eq(household.kkNumber, input.body.kkNumber)).limit(1),
  ]);

  if (existingHousehold[0]) throw conflict("KK number already exists");

  let headCitizenId = input.body.headCitizenId;
  let resolvedRt = input.body.rt;
  let resolvedRw = input.body.rw;
  if (headCitizenId) {
    const [headCitizen] = await db
      .select({ id: citizen.id, rt: citizen.rt, rw: citizen.rw })
      .from(citizen)
      .where(and(eq(citizen.id, headCitizenId), eq(citizen.isArchived, false)))
      .limit(1);
    if (!headCitizen) throw notFound("Head citizen not found");
    resolvedRt = headCitizen.rt;
    resolvedRw = headCitizen.rw;
  } else {
    const matches = await db
      .select({ id: citizen.id, rt: citizen.rt, rw: citizen.rw })
      .from(citizen)
      .where(and(eq(citizen.name, input.body.headCitizenName!), eq(citizen.rt, input.body.rt), eq(citizen.rw, input.body.rw), eq(citizen.isArchived, false)))
      .limit(2);
    if (matches.length > 1) throw conflict("Multiple citizens match this head citizen name. Use a more specific citizen record first.");

    if (matches.length === 1) {
      headCitizenId = matches[0].id;
      resolvedRt = matches[0].rt;
      resolvedRw = matches[0].rw;
    } else {
      const [duplicateNik] = await db
        .select({ id: citizen.id })
        .from(citizen)
        .where(and(eq(citizen.nik, input.body.kkNumber), eq(citizen.isArchived, false)))
        .limit(1);
      if (duplicateNik) {
        throw conflict("KK number is already used as a citizen NIK. Create or select the head citizen explicitly.");
      }

      const [createdCitizen] = await db
        .insert(citizen)
        .values({
          nik: input.body.kkNumber,
          name: input.body.headCitizenName!,
          gender: "L",
          birthPlace: "-",
          birthDate: new Date().toISOString().slice(0, 10),
          religion: "-",
          maritalStatus: "-",
          occupation: "-",
          education: "-",
          bloodType: null,
          address: input.body.address,
          rt: input.body.rt,
          rw: input.body.rw,
          status: "PENDUDUK_TETAP",
          isArchived: false,
        })
        .returning();
      headCitizenId = createdCitizen.id;
    }
  }

  const existingHeadMembership = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(householdMember)
    .where(eq(householdMember.citizenId, headCitizenId!))
    .limit(1);
  if (Number(existingHeadMembership[0]?.total || 0) > 0) {
    throw conflict("Head citizen already belongs to an active household");
  }

  const [created] = await db
    .insert(household)
      .values({
        kkNumber: input.body.kkNumber,
        headCitizenId: headCitizenId!,
        address: input.body.address,
        rt: resolvedRt,
        rw: resolvedRw,
        status: input.body.status,
      })
    .returning();
  await db.insert(householdMember).values({
    householdId: created.id,
    citizenId: headCitizenId!,
    relationship: "HEAD_OF_FAMILY",
  });

  await logAdminActivity({
    adminId: input.adminId,
    action: "HOUSEHOLD_CREATED",
    entityType: "HOUSEHOLD",
    entityId: created.id,
    metadata: { kkNumber: created.kkNumber, headCitizenId: created.headCitizenId },
  });

  return created;
}

export async function addHouseholdMemberService(input: {
  adminId: string;
  householdId: string;
  citizenId: string;
  relationship: "HEAD_OF_FAMILY" | "SPOUSE" | "CHILD" | "PARENT" | "SIBLING" | "OTHER" | string;
}) {
  const db = getDb();
  const [householdRow, citizenRow] = await Promise.all([
    db.select().from(household).where(eq(household.id, input.householdId)).limit(1),
    db.select().from(citizen).where(and(eq(citizen.id, input.citizenId), eq(citizen.isArchived, false))).limit(1),
  ]);
  if (!householdRow[0]) throw notFound("Household not found");
  if (!citizenRow[0]) throw notFound("Citizen not found");

  const [duplicateInHousehold, activeMembership] = await Promise.all([
    db
      .select({ id: householdMember.id })
      .from(householdMember)
      .where(and(eq(householdMember.householdId, input.householdId), eq(householdMember.citizenId, input.citizenId)))
      .limit(1),
    db
      .select({ id: householdMember.id })
      .from(householdMember)
      .where(eq(householdMember.citizenId, input.citizenId))
      .limit(1),
  ]);
  if (duplicateInHousehold[0]) throw conflict("Citizen already belongs to this household");
  if (activeMembership[0]) throw conflict("Citizen already belongs to another active household");

  const relationship = normalizeHouseholdRelationship(input.relationship);

  if (relationship === "HEAD_OF_FAMILY") {
    const existingHead = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(householdMember)
      .where(and(eq(householdMember.householdId, input.householdId), eq(householdMember.relationship, "HEAD_OF_FAMILY")));
    if (Number(existingHead[0]?.total || 0) > 0) throw conflict("Household already has a head of family");
  }

  const [inserted] = await db
    .insert(householdMember)
    .values({
      householdId: input.householdId,
      citizenId: input.citizenId,
      relationship,
    })
    .returning();

  await logAdminActivity({
    adminId: input.adminId,
    action: "HOUSEHOLD_MEMBER_ADDED",
    entityType: "HOUSEHOLD",
    entityId: input.householdId,
    metadata: { citizenId: input.citizenId, relationship },
  });

  return inserted;
}
