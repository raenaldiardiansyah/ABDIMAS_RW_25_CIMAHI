import { and, eq, ne, or } from "drizzle-orm";

import { citizen, getDb, household, householdMember, userIdentity } from "@abdimas/db";

import { createAuditLogService } from "../lib/admin-logs.js";
import { decryptNik } from "../lib/nik.js";
import { conflict, notFound, validationError } from "../lib/errors.js";
import { normalizeHouseholdRelationship } from "./households.js";

function assertIdentityProfileComplete(identity: typeof userIdentity.$inferSelect) {
  const requiredFields = [
    identity.fullName,
    identity.gender,
    identity.birthPlace,
    identity.birthDate,
    identity.religion,
    identity.maritalStatus,
    identity.occupation,
    identity.education,
    identity.address,
    identity.rt,
    identity.rw,
    identity.citizenStatus,
  ];

  if (requiredFields.some((value) => !value)) {
    throw validationError("Verification data is incomplete. Ask the user to complete onboarding data first.");
  }
}

export async function approveVerificationService(input: { adminId: string; userId: string }) {
  const db = getDb();
  const [identity] = await db.select().from(userIdentity).where(eq(userIdentity.userId, input.userId)).limit(1);
  if (!identity) throw notFound("Verification target not found");
  if (identity.verificationStatus !== "PENDING") {
    throw conflict("Verification is no longer pending");
  }

  const duplicateNik = await db
    .select({ userId: userIdentity.userId })
    .from(userIdentity)
    .where(and(eq(userIdentity.nikHash, identity.nikHash), ne(userIdentity.userId, input.userId), eq(userIdentity.verificationStatus, "VERIFIED")))
    .limit(1);
  if (duplicateNik.length > 0) {
    throw conflict("Another verified user already uses this NIK");
  }

  assertIdentityProfileComplete(identity);

  const encryptionKey = process.env.NIK_ENCRYPTION_KEY_BASE64;
  if (!encryptionKey) {
    throw validationError("NIK encryption key is not configured");
  }

  const nik = decryptNik(identity.nikEncrypted, encryptionKey);
  const now = new Date();

  const updated = await db.transaction(async (tx) => {
    const [existingCitizen] = await tx
      .select()
      .from(citizen)
      .where(or(eq(citizen.userId, input.userId), eq(citizen.nik, nik)))
      .limit(1);

    if (existingCitizen?.userId && existingCitizen.userId !== input.userId) {
      throw conflict("Citizen record is already linked to another user");
    }

    const citizenPayload = {
      userId: input.userId,
      nik,
      name: identity.fullName!,
      gender: identity.gender!,
      birthPlace: identity.birthPlace!,
      birthDate: identity.birthDate!,
      religion: identity.religion!,
      maritalStatus: identity.maritalStatus!,
      occupation: identity.occupation!,
      education: identity.education!,
      bloodType: identity.bloodType ?? null,
      address: identity.address!,
      rt: identity.rt!,
      rw: identity.rw!,
      status: identity.citizenStatus!,
      isArchived: false,
      updatedAt: now,
    };

    const [citizenRow] = existingCitizen
      ? await tx
          .update(citizen)
          .set(citizenPayload)
          .where(eq(citizen.id, existingCitizen.id))
          .returning()
      : await tx
          .insert(citizen)
          .values({
            ...citizenPayload,
            createdAt: now,
          })
          .returning();

    if (identity.kkNumber?.trim()) {
      const relationship = normalizeHouseholdRelationship(identity.familyRelationship || "OTHER");
      const [existingHousehold] = await tx
        .select()
        .from(household)
        .where(eq(household.kkNumber, identity.kkNumber.trim()))
        .limit(1);

      if (relationship === "HEAD_OF_FAMILY") {
        if (!existingHousehold) {
          const [createdHousehold] = await tx
            .insert(household)
            .values({
              kkNumber: identity.kkNumber.trim(),
              headCitizenId: citizenRow.id,
              address: identity.address!,
              rt: identity.rt!,
              rw: identity.rw!,
              status: "ACTIVE",
              createdAt: now,
              updatedAt: now,
            })
            .returning();

          await tx.insert(householdMember).values({
            householdId: createdHousehold.id,
            citizenId: citizenRow.id,
            relationship: "HEAD_OF_FAMILY",
            createdAt: now,
            updatedAt: now,
          });
        } else if (existingHousehold.headCitizenId !== citizenRow.id) {
          throw conflict("KK number is already assigned to another head of family");
        }
      }

      const [existingMembership] = await tx
        .select({ id: householdMember.id })
        .from(householdMember)
        .where(eq(householdMember.citizenId, citizenRow.id))
        .limit(1);

      if (!existingMembership && existingHousehold) {
        await tx.insert(householdMember).values({
          householdId: existingHousehold.id,
          citizenId: citizenRow.id,
          relationship,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    const [verifiedIdentity] = await tx
      .update(userIdentity)
      .set({
        verificationStatus: "VERIFIED",
        rejectionReason: null,
        verifiedAt: now,
        verifiedBy: input.adminId,
      })
      .where(eq(userIdentity.userId, input.userId))
      .returning();

    return verifiedIdentity;
  });

  await createAuditLogService({
    adminId: input.adminId,
    action: "VERIFICATION_APPROVED",
    entityType: "VERIFICATION",
    entityId: input.userId,
    metadata: { userId: input.userId },
  });

  return updated;
}

export async function rejectVerificationService(input: { adminId: string; userId: string; reason: string }) {
  const reason = input.reason.trim();
  if (!reason) throw validationError("Reason is required");

  const db = getDb();
  const [identity] = await db.select().from(userIdentity).where(eq(userIdentity.userId, input.userId)).limit(1);
  if (!identity) throw notFound("Verification target not found");
  if (identity.verificationStatus !== "PENDING") {
    throw conflict("Verification is no longer pending");
  }

  const [updated] = await db
    .update(userIdentity)
    .set({
      verificationStatus: "REJECTED",
      rejectionReason: reason,
      verifiedAt: new Date(),
      verifiedBy: input.adminId,
    })
    .where(eq(userIdentity.userId, input.userId))
    .returning();

  await createAuditLogService({
    adminId: input.adminId,
    action: "VERIFICATION_REJECTED",
    entityType: "VERIFICATION",
    entityId: input.userId,
    metadata: { userId: input.userId, reason },
  });

  return updated;
}
