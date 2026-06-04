import { eq } from "drizzle-orm";

import { getDb, historyEntry, mutation, serviceRequest } from "@abdimas/db";

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

function requestTitle(type: "HOUSEHOLD_CREATE" | "MEMBER_CREATE" | "MUTATION_IN" | "MUTATION_OUT") {
  if (type === "HOUSEHOLD_CREATE") return "Permohonan Kartu Keluarga";
  if (type === "MEMBER_CREATE") return "Permohonan Tambah Anggota";
  if (type === "MUTATION_IN") return "Permohonan Mutasi Masuk";
  return "Permohonan Mutasi Keluar";
}

async function createRequestHistoryStatusEntry(input: {
  userId: string;
  requestId: string;
  type: "HOUSEHOLD_CREATE" | "MEMBER_CREATE" | "MUTATION_IN" | "MUTATION_OUT";
  status: "APPROVED" | "REJECTED";
  rejectionReason?: string | null;
}) {
  const title = requestTitle(input.type);
  const description =
    input.status === "APPROVED"
      ? `${title} telah disetujui admin.`
      : `${title} ditolak admin.${input.rejectionReason ? ` Alasan: ${input.rejectionReason}` : ""}`;

  await getDb().insert(historyEntry).values({
    userId: input.userId,
    type: "REQUEST",
    title,
    description,
    metadata: {
      requestId: input.requestId,
      requestType: input.type,
      status: input.status,
      rejectionReason: input.rejectionReason ?? null,
    },
  });
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

  if (row.type === "MEMBER_CREATE") {
    const payload = row.payload as Record<string, unknown>;
    const citizenPayload = payload.citizen as Record<string, unknown> | undefined;
    const householdId = payload.householdId as string | undefined;
    const relationship = payload.relationship as string | undefined;

    if (!citizenPayload || !householdId || !relationship) {
      throw validationError("Invalid member create request payload");
    }

    const { addHouseholdMemberService } = await import("./households.js");
    const { citizen, household } = await import("@abdimas/db");
    
    // Ambil data KK untuk copy alamat
    const [hh] = await db.select().from(household).where(eq(household.id, householdId)).limit(1);

    const [duplicateNik] = await db.select({ id: citizen.id }).from(citizen).where(eq(citizen.nik, String(citizenPayload.nik))).limit(1);
    
    let citizenId = duplicateNik?.id;

    if (!citizenId) {
      const [createdCitizen] = await db.insert(citizen).values({
        nik: String(citizenPayload.nik),
        name: String(citizenPayload.name),
        birthPlace: String(citizenPayload.birthPlace || "-"),
        birthDate: String(citizenPayload.birthDate || new Date().toISOString().slice(0, 10)),
        gender: String(citizenPayload.gender) as "L" | "P",
        religion: String(citizenPayload.religion || "-"),
        maritalStatus: String(citizenPayload.maritalStatus || "-"),
        education: String(citizenPayload.education || "-"),
        occupation: "Belum/Tidak Bekerja",
        address: hh?.address || "-",
        rt: hh?.rt || "-",
        rw: hh?.rw || "-",
        status: "PENDUDUK_TETAP",
        isArchived: false,
      }).returning();
      citizenId = createdCitizen.id;
    }

    await addHouseholdMemberService({
      adminId: input.adminId,
      householdId,
      citizenId,
      relationship,
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

  await createRequestHistoryStatusEntry({
    userId: updated.requestedBy,
    requestId: updated.id,
    type: updated.type,
    status: "APPROVED",
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

  await createRequestHistoryStatusEntry({
    userId: updated.requestedBy,
    requestId: updated.id,
    type: updated.type,
    status: "REJECTED",
    rejectionReason: updated.rejectionReason,
  });

  return updated;
}
