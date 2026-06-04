import { eq } from "drizzle-orm";

import { citizen, getDb, mutation, mutationAttachment } from "@abdimas/db";

import { logAdminActivity } from "../lib/admin-logs.js";
import { AppError, conflict, notFound } from "../lib/errors.js";
import { buildObjectKeyForFile, deleteObject, ensureStorageConfigured, uploadObject, validateUpload } from "../lib/storage.js";

export async function uploadDocumentService(input: {
  mutationId: string;
  adminId: string;
  file: File;
  kind: "SURAT_KETERANGAN" | "KTP" | "KK";
}) {
  validateUpload(input.file);
  ensureStorageConfigured();

  const storageKey = buildObjectKeyForFile({
    mutationId: input.mutationId,
    kind: input.kind,
    file: input.file,
  });

  await uploadObject({ key: storageKey, file: input.file });

  return { storageKey };
}

export async function createMutationService(input: {
  adminId: string;
  body: {
    nik: string;
    name: string;
    gender: "L" | "P";
    occupation: string;
    type: "IN" | "OUT";
    mutationDate: string;
    fromAddress?: string;
    toAddress?: string;
    targetRt?: string;
    phone?: string;
    reason: string;
  };
  files: Array<{ kind: "SURAT_KETERANGAN" | "KTP" | "KK"; file: File }>;
}) {
  for (const item of input.files) validateUpload(item.file);
  if (input.files.length > 0) ensureStorageConfigured();

  const db = getDb();
  const [existingCitizen] = await db.select().from(citizen).where(eq(citizen.nik, input.body.nik)).limit(1);
  const [citizenRow] = existingCitizen
    ? [existingCitizen]
    : await db
        .insert(citizen)
        .values({
          nik: input.body.nik,
          name: input.body.name,
          gender: input.body.gender,
          birthPlace: "Tidak Diketahui",
          birthDate: input.body.mutationDate,
          religion: "Tidak Diketahui",
          maritalStatus: "Belum Kawin",
          occupation: input.body.occupation,
          education: "Tidak Diketahui",
          bloodType: null,
          address: input.body.toAddress ?? input.body.fromAddress ?? "Tidak Diketahui",
          rt: input.body.targetRt ?? "01",
          rw: "25",
          status: "PENDUDUK_TETAP",
        })
        .returning();

  const [createdRow] = await db
    .insert(mutation)
    .values({
      citizenId: citizenRow.id,
      type: input.body.type,
      status: "PENDING",
      mutationDate: input.body.mutationDate,
      fromAddress: input.body.fromAddress ?? null,
      toAddress: input.body.toAddress ?? null,
      targetRt: input.body.targetRt ?? null,
      phone: input.body.phone ?? null,
      reason: input.body.reason,
      requestedBy: input.adminId,
    })
    .returning();

  const uploadedKeys: string[] = [];
  const attachments = [];
  try {
    for (const item of input.files) {
      const uploaded = await uploadDocumentService({
        mutationId: createdRow.id,
        adminId: input.adminId,
        file: item.file,
        kind: item.kind,
      });
      uploadedKeys.push(uploaded.storageKey);

      const [attachment] = await db
        .insert(mutationAttachment)
        .values({
          mutationId: createdRow.id,
          entityType: "MUTATION",
          entityId: createdRow.id,
          kind: item.kind,
          storageKey: uploaded.storageKey,
          originalFilename: item.file.name,
          mimeType: item.file.type,
          size: item.file.size,
          uploadedBy: input.adminId,
        })
        .returning();
      attachments.push(attachment);
    }
  } catch (error) {
    await Promise.all(uploadedKeys.map((key) => deleteObject(key).catch(() => null)));
    await db.delete(mutationAttachment).where(eq(mutationAttachment.mutationId, createdRow.id));
    await db.delete(mutation).where(eq(mutation.id, createdRow.id));
    if (error instanceof AppError) throw error;
    throw error;
  }

  await logAdminActivity({
    adminId: input.adminId,
    action: "MUTATION_CREATED",
    entityType: "MUTATION",
    entityId: createdRow.id,
    metadata: { citizenId: citizenRow.id, type: createdRow.type },
  });

  return { mutation: createdRow, attachments };
}

export async function approveMutationService(input: { adminId: string; mutationId: string; status: "APPROVED" | "REJECTED"; reason?: string }) {
  const db = getDb();
  const [existing] = await db.select().from(mutation).where(eq(mutation.id, input.mutationId)).limit(1);
  if (!existing) throw notFound("Mutation not found");
  if (existing.status !== "PENDING") throw conflict("Mutation is no longer pending");
  if (input.status === "REJECTED" && !input.reason?.trim()) throw conflict("Reason is required when rejecting a mutation");

  const [updated] = await db
    .update(mutation)
    .set({
      status: input.status,
      reviewedBy: input.adminId,
      reviewedAt: new Date(),
      ...(input.reason !== undefined ? { reason: input.reason } : {}),
    })
    .where(eq(mutation.id, input.mutationId))
    .returning();

  await logAdminActivity({
    adminId: input.adminId,
    action: "MUTATION_STATUS_UPDATED",
    entityType: "MUTATION",
    entityId: updated.id,
    metadata: { status: input.status, reason: input.reason ?? null },
  });

  return updated;
}
