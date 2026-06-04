import { and, eq, inArray, or, sql } from "drizzle-orm";

import { adminActivityLog, citizen, getDb, household, householdMember, mutation, serviceRequest } from "@abdimas/db";

import { createAuditLogService } from "../lib/admin-logs.js";
import { conflict, notFound, validationError } from "../lib/errors.js";
import { normalizeHouseholdRelationship } from "./households.js";

type CitizenPayload = {
  userId?: string;
  nik: string;
  name: string;
  gender: "L" | "P";
  birthPlace: string;
  birthDate: string;
  religion: string;
  maritalStatus: string;
  occupation: string;
  education: string;
  bloodType?: string | null;
  address: string;
  rt: string;
  rw: string;
  status: "PENDUDUK_TETAP" | "NGEKOST";
};

type CitizenHouseholdMemberPayload = CitizenPayload & {
  relationship: string;
};

type CitizenRegistrationPayload = {
  isHeadOfFamily: boolean;
  kkNumber?: string;
  relationship?: string;
  members?: CitizenHouseholdMemberPayload[];
};

export async function createCitizenService(input: { adminId: string; body: CitizenPayload }) {
  const db = getDb();
  const existingWhere = input.body.userId
    ? or(eq(citizen.nik, input.body.nik), eq(citizen.userId, input.body.userId))
    : eq(citizen.nik, input.body.nik);
  const existing = await db.select({ id: citizen.id }).from(citizen).where(existingWhere).limit(1);
  if (existing.length > 0) throw conflict("Citizen with same NIK or user is already registered");

  const [inserted] = await db
    .insert(citizen)
    .values({
      ...input.body,
      userId: input.body.userId ?? null,
      bloodType: input.body.bloodType ?? null,
    })
    .returning();

  await createAuditLogService({
    adminId: input.adminId,
    action: "CITIZEN_CREATED",
    entityType: "CITIZEN",
    entityId: inserted.id,
    metadata: { nik: inserted.nik, name: inserted.name },
  });

  return inserted;
}

export async function createCitizenRegistrationService(input: {
  adminId: string;
  citizen: CitizenPayload;
  household?: CitizenRegistrationPayload;
}) {
  const db = getDb();
  const householdPayload = input.household;
  const members = householdPayload?.members ?? [];

  if (!householdPayload?.isHeadOfFamily && members.length > 0) {
    throw validationError("Additional household members are only allowed when creating a new household");
  }

  const submittedNiks = [input.citizen.nik, ...members.map((member) => member.nik)];
  if (new Set(submittedNiks).size !== submittedNiks.length) {
    throw conflict("Duplicate NIK found in submitted household members");
  }

  const existingCitizens =
    submittedNiks.length > 0
      ? await db.select({ nik: citizen.nik }).from(citizen).where(inArray(citizen.nik, submittedNiks))
      : [];

  if (existingCitizens.length > 0) {
    throw conflict("Citizen with the same NIK is already registered");
  }

  const kkNumber = householdPayload?.kkNumber?.trim();
  if (householdPayload?.isHeadOfFamily && !kkNumber) {
    throw validationError("KK number is required when creating a new household");
  }

  if (!householdPayload?.isHeadOfFamily && kkNumber && !householdPayload?.relationship) {
    throw validationError("Household relationship is required when KK number is provided");
  }

  const now = new Date();

  return db.transaction(async (tx) => {
    const insertCitizen = async (payload: CitizenPayload) => {
      const [createdCitizen] = await tx
        .insert(citizen)
        .values({
          ...payload,
          userId: payload.userId ?? null,
          bloodType: payload.bloodType ?? null,
          isArchived: false,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return createdCitizen;
    };

    const auditRows: Array<typeof adminActivityLog.$inferInsert> = [];
    const createdMembers: Array<{
      citizen: typeof citizen.$inferSelect;
      relationship: string;
      membershipId: string;
    }> = [];

    const primaryCitizen = await insertCitizen(input.citizen);
    auditRows.push({
      adminId: input.adminId,
      action: "CITIZEN_CREATED",
      entityType: "CITIZEN",
      entityId: primaryCitizen.id,
      metadata: { nik: primaryCitizen.nik, name: primaryCitizen.name },
    });

    let resolvedHousehold: typeof household.$inferSelect | null = null;

    if (householdPayload?.isHeadOfFamily) {
      const [existingHousehold] = await tx
        .select({ id: household.id })
        .from(household)
        .where(eq(household.kkNumber, kkNumber!))
        .limit(1);

      if (existingHousehold) {
        throw conflict("KK number already exists");
      }

      const [createdHousehold] = await tx
        .insert(household)
        .values({
          kkNumber: kkNumber!,
          headCitizenId: primaryCitizen.id,
          address: input.citizen.address,
          rt: input.citizen.rt,
          rw: input.citizen.rw,
          status: "ACTIVE",
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      resolvedHousehold = createdHousehold;

      await tx.insert(householdMember).values({
        householdId: createdHousehold.id,
        citizenId: primaryCitizen.id,
        relationship: "HEAD_OF_FAMILY",
        createdAt: now,
        updatedAt: now,
      });

      auditRows.push({
        adminId: input.adminId,
        action: "HOUSEHOLD_CREATED",
        entityType: "HOUSEHOLD",
        entityId: createdHousehold.id,
        metadata: { kkNumber: createdHousehold.kkNumber, headCitizenId: createdHousehold.headCitizenId },
      });

      for (const member of members) {
        const relationship = normalizeHouseholdRelationship(member.relationship);
        if (relationship === "HEAD_OF_FAMILY") {
          throw conflict("Additional household members cannot be assigned as head of family");
        }

        const createdCitizen = await insertCitizen(member);
        const [createdMembership] = await tx
          .insert(householdMember)
          .values({
            householdId: createdHousehold.id,
            citizenId: createdCitizen.id,
            relationship,
            createdAt: now,
            updatedAt: now,
          })
          .returning();

        createdMembers.push({
          citizen: createdCitizen,
          relationship,
          membershipId: createdMembership.id,
        });

        auditRows.push({
          adminId: input.adminId,
          action: "CITIZEN_CREATED",
          entityType: "CITIZEN",
          entityId: createdCitizen.id,
          metadata: { nik: createdCitizen.nik, name: createdCitizen.name },
        });
        auditRows.push({
          adminId: input.adminId,
          action: "HOUSEHOLD_MEMBER_ADDED",
          entityType: "HOUSEHOLD",
          entityId: createdHousehold.id,
          metadata: { citizenId: createdCitizen.id, relationship },
        });
      }
    } else if (kkNumber && householdPayload?.relationship) {
      const [targetHousehold] = await tx
        .select()
        .from(household)
        .where(eq(household.kkNumber, kkNumber))
        .limit(1);

      if (!targetHousehold) {
        throw notFound("Household not found");
      }

      const relationship = normalizeHouseholdRelationship(householdPayload.relationship);
      if (relationship === "HEAD_OF_FAMILY") {
        throw conflict("Use the head of family flow to create a new household");
      }

      await tx.insert(householdMember).values({
        householdId: targetHousehold.id,
        citizenId: primaryCitizen.id,
        relationship,
        createdAt: now,
        updatedAt: now,
      });

      resolvedHousehold = targetHousehold;

      auditRows.push({
        adminId: input.adminId,
        action: "HOUSEHOLD_MEMBER_ADDED",
        entityType: "HOUSEHOLD",
        entityId: targetHousehold.id,
        metadata: { citizenId: primaryCitizen.id, relationship },
      });
    }

    if (auditRows.length > 0) {
      await tx.insert(adminActivityLog).values(auditRows);
    }

    return {
      citizen: primaryCitizen,
      household: resolvedHousehold,
      members: createdMembers,
    };
  });
}

export async function updateCitizenService(input: { adminId: string; citizenId: string; body: Partial<CitizenPayload & { isArchived: boolean }> }) {
  const db = getDb();
  if (input.body.nik) {
    const duplicate = await db
      .select({ id: citizen.id })
      .from(citizen)
      .where(and(eq(citizen.nik, input.body.nik), sql`${citizen.id} <> ${input.citizenId}`))
      .limit(1);
    if (duplicate.length > 0) throw conflict("Citizen NIK already exists");
  }

  const [updated] = await db.update(citizen).set(input.body).where(eq(citizen.id, input.citizenId)).returning();
  if (!updated) throw notFound("Citizen not found");

  await createAuditLogService({
    adminId: input.adminId,
    action: "CITIZEN_UPDATED",
    entityType: "CITIZEN",
    entityId: updated.id,
    metadata: Object.keys(input.body).reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = (input.body as Record<string, unknown>)[key];
      return acc;
    }, {}),
  });

  return updated;
}

export async function deleteCitizenService(input: { adminId: string; citizenId: string }) {
  const db = getDb();
  const [existing] = await db.select().from(citizen).where(eq(citizen.id, input.citizenId)).limit(1);
  if (!existing) throw notFound("Citizen not found");

  const [householdCount, mutationCount, requestCount] = await Promise.all([
    db.select({ total: sql<number>`count(*)::int` }).from(householdMember).where(eq(householdMember.citizenId, input.citizenId)),
    db.select({ total: sql<number>`count(*)::int` }).from(mutation).where(eq(mutation.citizenId, input.citizenId)),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(serviceRequest)
      .where(sql`${serviceRequest.payload}::text ilike ${`%${input.citizenId}%`}`),
  ]);

  const isReferenced =
    Number(householdCount[0]?.total || 0) > 0 ||
    Number(mutationCount[0]?.total || 0) > 0 ||
    Number(requestCount[0]?.total || 0) > 0;

  if (isReferenced) {
    const [archived] = await db
      .update(citizen)
      .set({ isArchived: true })
      .where(eq(citizen.id, input.citizenId))
      .returning();
    await createAuditLogService({
      adminId: input.adminId,
      action: "CITIZEN_ARCHIVED",
      entityType: "CITIZEN",
      entityId: archived.id,
      metadata: { nik: archived.nik, name: archived.name },
    });
    return { mode: "archived" as const, row: archived };
  }

  const [deleted] = await db.delete(citizen).where(eq(citizen.id, input.citizenId)).returning();
  await createAuditLogService({
    adminId: input.adminId,
    action: "CITIZEN_DELETED",
    entityType: "CITIZEN",
    entityId: deleted.id,
    metadata: { nik: deleted.nik, name: deleted.name },
  });
  return { mode: "deleted" as const, row: deleted };
}
