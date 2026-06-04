import { eq } from "drizzle-orm";

import { getDb, mutation, serviceRequest } from "@abdimas/db";

import { createAuditLogService } from "../lib/admin-logs.js";
import { conflict, notFound, validationError } from "../lib/errors.js";
import { createHouseholdService } from "./households.js";
import { approveMutationService } from "./mutations.js";

function resolveHeadCitizenFromLegacyRequest(payload: Record<string, unknown>) {
  const householdPayload = payload.household as Record<string, unknown> | undefined;
  const members = Array.isArray(payload.members) ? payload.members : [];
  const fallbackHead = members.find((member) => {
    if (!member || typeof member !== "object") return false;
    const relationship = "relationship" in member ? member.relationship : undefined;
    return relationship === "HEAD_OF_FAMILY" || relationship === "Kepala Keluarga";
  }) as Record<string, unknown> | undefined;

  return {
    householdPayload,
    headCitizenId:
      typeof householdPayload?.headCitizenId === "string"
        ? householdPayload.headCitizenId
        : typeof fallbackHead?.citizenId === "string"
          ? fallbackHead.citizenId
          : undefined,
    headCitizenName:
      typeof householdPayload?.headCitizenName === "string"
        ? householdPayload.headCitizenName
        : typeof fallbackHead?.nama === "string"
          ? fallbackHead.nama
          : undefined,
  };
}

export async function approveRequestService(input: { adminId: string; requestId: string }) {
  const db = getDb();
  const [row] = await db.select().from(serviceRequest).where(eq(serviceRequest.id, input.requestId)).limit(1);
  if (!row) throw notFound("Request not found");
  if (row.status !== "PENDING") throw conflict("Request is no longer pending");

  if (row.type === "HOUSEHOLD_CREATE") {
    const payload = row.payload as Record<string, unknown>;
    const { householdPayload, headCitizenId, headCitizenName } = resolveHeadCitizenFromLegacyRequest(payload);
    if (!householdPayload?.kkNumber || !householdPayload?.address || !householdPayload?.rt || !householdPayload?.rw || (!headCitizenId && !headCitizenName)) {
      throw validationError("Invalid household request payload");
    }
    await createHouseholdService({
      adminId: input.adminId,
      body: {
        kkNumber: String(householdPayload.kkNumber),
        headCitizenId,
        headCitizenName,
        address: String(householdPayload.address),
        rt: String(householdPayload.rt),
        rw: String(householdPayload.rw),
        status: String(householdPayload.status ?? "ACTIVE"),
      },
    });
  }

  if (row.type === "MUTATION_IN" || row.type === "MUTATION_OUT") {
    const payload = row.payload as Record<string, unknown>;
    if (payload.mutationId && typeof payload.mutationId === "string") {
      await approveMutationService({
        adminId: input.adminId,
        mutationId: payload.mutationId,
        status: "APPROVED",
      });
    } else if (payload.citizenId && typeof payload.citizenId === "string") {
      const [createdMutation] = await db
        .insert(mutation)
        .values({
          citizenId: payload.citizenId,
          type: row.type === "MUTATION_IN" ? "IN" : "OUT",
          status: "APPROVED",
          fromAddress: typeof payload.fromAddress === "string" ? payload.fromAddress : null,
          toAddress: typeof payload.toAddress === "string" ? payload.toAddress : null,
          reason: typeof payload.reason === "string" ? payload.reason : null,
          requestedBy: row.requestedBy,
          reviewedBy: input.adminId,
          reviewedAt: new Date(),
        })
        .returning();
      await createAuditLogService({
        adminId: input.adminId,
        action: "MUTATION_CREATED_FROM_REQUEST",
        entityType: "MUTATION",
        entityId: createdMutation.id,
        metadata: { requestId: row.id, requestType: row.type },
      });
    } else {
      throw validationError("Mutation request payload must include mutationId or citizenId");
    }
  }

  const [updated] = await db
    .update(serviceRequest)
    .set({
      status: "APPROVED",
      reviewedBy: input.adminId,
      reviewedAt: new Date(),
      rejectionReason: null,
    })
    .where(eq(serviceRequest.id, input.requestId))
    .returning();

  await createAuditLogService({
    adminId: input.adminId,
    action: "REQUEST_APPROVED",
    entityType: "REQUEST",
    entityId: updated.id,
    metadata: { requestType: updated.type },
  });

  return updated;
}

export async function rejectRequestService(input: { adminId: string; requestId: string; reason: string }) {
  const reason = input.reason.trim();
  if (!reason) throw validationError("Reason is required");

  const db = getDb();
  const [row] = await db.select().from(serviceRequest).where(eq(serviceRequest.id, input.requestId)).limit(1);
  if (!row) throw notFound("Request not found");
  if (row.status !== "PENDING") throw conflict("Request is no longer pending");

  const [updated] = await db
    .update(serviceRequest)
    .set({
      status: "REJECTED",
      reviewedBy: input.adminId,
      reviewedAt: new Date(),
      rejectionReason: reason,
    })
    .where(eq(serviceRequest.id, input.requestId))
    .returning();

  await createAuditLogService({
    adminId: input.adminId,
    action: "REQUEST_REJECTED",
    entityType: "REQUEST",
    entityId: updated.id,
    metadata: { requestType: updated.type, reason },
  });

  return updated;
}
