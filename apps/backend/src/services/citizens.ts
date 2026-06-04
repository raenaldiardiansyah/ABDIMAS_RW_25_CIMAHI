import { and, eq, inArray, or, sql } from "drizzle-orm";

import { citizen, getDb, household, householdMember, mutation, serviceRequest } from "@abdimas/db";

import { createAuditLogService } from "../lib/admin-logs.js";
import { conflict, notFound } from "../lib/errors.js";

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
