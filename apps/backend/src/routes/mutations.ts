import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { Hono } from "hono";

import {
  createMutationSchema,
  mutationAttachmentSchema,
  mutationListQuerySchema,
  mutationListResponseSchema,
  mutationResponseSchema,
  updateMutationStatusSchema,
} from "@abdimas/contracts";
import { citizen, getDb, mutation, mutationAttachment } from "@abdimas/db";

import { logAdminActivity } from "../lib/admin-logs";
import { AppError, internalError, notFound, validationError } from "../lib/errors";
import { buildPageMeta, getOffset } from "../lib/pagination";
import { ok } from "../lib/response";
import { toIso } from "../lib/serialize";
import { parseJson, parseQuery } from "../lib/validation";
import {
  buildObjectKey,
  buildObjectUrl,
  deleteObject,
  ensureStorageConfigured,
  uploadObject,
  validateUpload,
} from "../lib/storage";
import { adminMiddleware } from "../middleware/auth";

function toDateString(value: Date | string | null | undefined) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value;
}

function mapMutation(row: typeof mutation.$inferSelect) {
  return {
    id: row.id,
    citizenId: row.citizenId,
    type: row.type,
    status: row.status,
    mutationDate: toDateString(row.mutationDate),
    fromAddress: row.fromAddress ?? null,
    toAddress: row.toAddress ?? null,
    targetRt: row.targetRt ?? null,
    phone: row.phone ?? null,
    reason: row.reason ?? null,
    requestedBy: row.requestedBy,
    reviewedBy: row.reviewedBy ?? null,
    reviewedAt: toIso(row.reviewedAt),
    createdAt: toIso(row.createdAt) ?? new Date().toISOString(),
    updatedAt: toIso(row.updatedAt) ?? new Date().toISOString(),
  };
}

async function mapMutationAttachment(row: typeof mutationAttachment.$inferSelect) {
  const mapped = {
    id: row.id,
    mutationId: row.mutationId,
    kind: row.kind,
    objectKey: row.objectKey,
    fileName: row.fileName,
    contentType: row.contentType,
    sizeBytes: row.sizeBytes,
    url: await buildObjectUrl(row.objectKey).catch(() => null),
    createdAt: toIso(row.createdAt) ?? new Date().toISOString(),
  };
  return mutationAttachmentSchema.parse(mapped);
}

function getRequiredText(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string" || !value.trim()) {
    throw validationError(`${key} is required`);
  }
  return value.trim();
}

function getOptionalText(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function getOptionalFile(formData: FormData, key: string) {
  const value = formData.get(key);
  if (!(value instanceof File) || value.size === 0) return null;
  return value;
}

export const mutationsRoutes = new Hono<{ Variables: { sessionUser: { id: string; role: string } } }>()
  .use("*", adminMiddleware)
  .get("/export", async (c) => {
    const query = parseQuery(
      {
        page: c.req.query("page"),
        limit: c.req.query("limit"),
        q: c.req.query("q") || undefined,
        type: c.req.query("type") || undefined,
        status: c.req.query("status") || undefined,
      },
      mutationListQuerySchema,
    );

    const filters = [];
    if (query.type) filters.push(eq(mutation.type, query.type));
    if (query.status) filters.push(eq(mutation.status, query.status));
    if (query.q) {
      filters.push(
        or(
          ilike(citizen.name, `%${query.q}%`),
          ilike(citizen.nik, `%${query.q}%`),
          ilike(mutation.reason, `%${query.q}%`),
        ),
      );
    }
    const where = filters.length > 0 ? and(...filters) : undefined;

    const rows = await getDb()
      .select({
        id: mutation.id,
        citizenId: mutation.citizenId,
        type: mutation.type,
        status: mutation.status,
        mutationDate: mutation.mutationDate,
        fromAddress: mutation.fromAddress,
        toAddress: mutation.toAddress,
        targetRt: mutation.targetRt,
        phone: mutation.phone,
        reason: mutation.reason,
        requestedBy: mutation.requestedBy,
        reviewedBy: mutation.reviewedBy,
        reviewedAt: mutation.reviewedAt,
        createdAt: mutation.createdAt,
        updatedAt: mutation.updatedAt,
      })
      .from(mutation)
      .innerJoin(citizen, eq(citizen.id, mutation.citizenId))
      .where(where)
      .orderBy(desc(mutation.createdAt));

    const header = [
      "id",
      "citizenId",
      "type",
      "status",
      "mutationDate",
      "fromAddress",
      "toAddress",
      "targetRt",
      "phone",
      "reason",
      "requestedBy",
      "reviewedBy",
      "reviewedAt",
      "createdAt",
      "updatedAt",
    ];
    const lines = [
      header.join(","),
      ...rows.map((row) =>
        [
          row.id,
          row.citizenId,
          row.type,
          row.status,
          toDateString(row.mutationDate) ?? "",
          row.fromAddress ?? "",
          row.toAddress ?? "",
          row.targetRt ?? "",
          row.phone ?? "",
          (row.reason ?? "").replace(/,/g, " "),
          row.requestedBy,
          row.reviewedBy ?? "",
          toIso(row.reviewedAt) ?? "",
          toIso(row.createdAt) ?? "",
          toIso(row.updatedAt) ?? "",
        ].join(","),
      ),
    ].join("\n");

    c.header("content-type", "text/csv; charset=utf-8");
    c.header("content-disposition", 'attachment; filename="mutations.csv"');
    return c.body(lines);
  })
  .get("/", async (c) => {
    const query = parseQuery(
      {
        page: c.req.query("page"),
        limit: c.req.query("limit"),
        q: c.req.query("q") || undefined,
        type: c.req.query("type") || undefined,
        status: c.req.query("status") || undefined,
      },
      mutationListQuerySchema,
    );

    const filters = [];
    if (query.type) filters.push(eq(mutation.type, query.type));
    if (query.status) filters.push(eq(mutation.status, query.status));
    if (query.q) {
      filters.push(
        or(
          ilike(citizen.name, `%${query.q}%`),
          ilike(citizen.nik, `%${query.q}%`),
          ilike(mutation.reason, `%${query.q}%`),
        ),
      );
    }
    const where = filters.length > 0 ? and(...filters) : undefined;
    const db = getDb();

    const [{ total }] = await db
      .select({ total: sql<number>`count(distinct ${mutation.id})::int` })
      .from(mutation)
      .innerJoin(citizen, eq(citizen.id, mutation.citizenId))
      .where(where);

    const rows = await db
      .select({
        id: mutation.id,
        citizenId: mutation.citizenId,
        citizenName: citizen.name,
        citizenNik: citizen.nik,
        type: mutation.type,
        status: mutation.status,
        mutationDate: mutation.mutationDate,
        fromAddress: mutation.fromAddress,
        toAddress: mutation.toAddress,
        targetRt: mutation.targetRt,
        phone: mutation.phone,
        reason: mutation.reason,
        requestedBy: mutation.requestedBy,
        reviewedBy: mutation.reviewedBy,
        reviewedAt: mutation.reviewedAt,
        createdAt: mutation.createdAt,
        updatedAt: mutation.updatedAt,
      })
      .from(mutation)
      .innerJoin(citizen, eq(citizen.id, mutation.citizenId))
      .where(where)
      .orderBy(desc(mutation.createdAt))
      .limit(query.limit)
      .offset(getOffset(query.page, query.limit));

    const meta = buildPageMeta({ page: query.page, limit: query.limit, total: Number(total || 0) });
    const payload = {
      success: true as const,
      data: rows.map((row) => ({
        ...mapMutation(row),
        citizen: {
          id: row.citizenId,
          name: row.citizenName,
          nik: row.citizenNik,
        },
      })),
      meta,
    };
    mutationListResponseSchema.parse(payload);
    return ok(c, payload.data, meta);
  })
  .post("/", async (c) => {
    const sessionUser = c.get("sessionUser");
    const formData = await c.req.raw.formData();
    const parsed = createMutationSchema.safeParse({
      nik: getRequiredText(formData, "nik"),
      name: getRequiredText(formData, "name"),
      gender: getRequiredText(formData, "gender"),
      occupation: getRequiredText(formData, "occupation"),
      type: getRequiredText(formData, "type"),
      mutationDate: getRequiredText(formData, "mutationDate"),
      fromAddress: getOptionalText(formData, "fromAddress"),
      toAddress: getOptionalText(formData, "toAddress"),
      targetRt: getOptionalText(formData, "targetRt"),
      phone: getOptionalText(formData, "phone"),
      reason: getOptionalText(formData, "reason"),
    });
    if (!parsed.success) {
      throw validationError(parsed.error.issues[0]?.message || "Invalid mutation form");
    }

    const body = parsed.data;
    const db = getDb();
    const [existingCitizen] = await db
      .select()
      .from(citizen)
      .where(eq(citizen.nik, body.nik))
      .limit(1);

    const [citizenRow] = existingCitizen
      ? [existingCitizen]
      : await db
          .insert(citizen)
          .values({
            nik: body.nik,
            name: body.name,
            gender: body.gender,
            birthPlace: "Tidak Diketahui",
            birthDate: body.mutationDate,
            religion: "Tidak Diketahui",
            maritalStatus: "Belum Kawin",
            occupation: body.occupation,
            education: "Tidak Diketahui",
            bloodType: null,
            address: body.toAddress ?? body.fromAddress ?? "Tidak Diketahui",
            rt: body.targetRt ?? "01",
            rw: "25",
            status: "PENDUDUK_TETAP",
          })
          .returning();

    const [createdRow] = await db
      .insert(mutation)
      .values({
        citizenId: citizenRow.id,
        type: body.type,
        status: "PENDING",
        mutationDate: body.mutationDate,
        fromAddress: body.fromAddress ?? null,
        toAddress: body.toAddress ?? null,
        targetRt: body.targetRt ?? null,
        phone: body.phone ?? null,
        reason: body.reason ?? null,
        requestedBy: sessionUser.id,
      })
      .returning();

    const fileMap = [
      { field: "suratKeterangan", kind: "SURAT_KETERANGAN" as const },
      { field: "ktp", kind: "KTP" as const },
      { field: "kk", kind: "KK" as const },
    ];
    const selectedFiles = fileMap
      .map((item) => ({ ...item, file: getOptionalFile(formData, item.field) }))
      .filter(
        (item): item is (typeof fileMap)[number] & { file: File } =>
          item.file instanceof File,
      );
    const uploadedKeys: string[] = [];

    try {
      if (selectedFiles.length > 0) {
        ensureStorageConfigured();
      }

      const attachmentRows = [];
      for (const item of selectedFiles) {
        const file = item.file;
        validateUpload(file);

        const objectKey = buildObjectKey({
          mutationId: createdRow.id,
          kind: item.kind,
          fileName: file.name,
        });
        await uploadObject({ key: objectKey, file });
        uploadedKeys.push(objectKey);

        const [attachmentRow] = await db
          .insert(mutationAttachment)
          .values({
            mutationId: createdRow.id,
            kind: item.kind,
            objectKey,
            fileName: file.name,
            contentType: file.type,
            sizeBytes: String(file.size),
          })
          .returning();
        attachmentRows.push(attachmentRow);
      }

      await logAdminActivity({
        adminId: sessionUser.id,
        action: "MUTATION_CREATED",
        entityType: "MUTATION",
        entityId: createdRow.id,
        metadata: { citizenId: citizenRow.id, type: createdRow.type },
      });

      const payload = {
        success: true as const,
        data: {
          ...mapMutation(createdRow),
          attachments: await Promise.all(attachmentRows.map(mapMutationAttachment)),
        },
      };
      mutationResponseSchema.parse(payload);
      return ok(c, payload.data, undefined, 201);
    } catch (error) {
      await Promise.all(uploadedKeys.map((key) => deleteObject(key).catch(() => null)));
      if (error instanceof AppError) throw error;
      throw internalError("Failed to process mutation documents through Cloudflare R2.");
    }
  })
  .get("/:id", async (c) => {
    const db = getDb();
    const [row] = await db
      .select()
      .from(mutation)
      .where(eq(mutation.id, c.req.param("id")))
      .limit(1);
    if (!row) throw notFound("Mutation not found");
    const attachmentRows = await db
      .select()
      .from(mutationAttachment)
      .where(eq(mutationAttachment.mutationId, row.id))
      .orderBy(mutationAttachment.createdAt);

    const payload = {
      success: true as const,
      data: {
        ...mapMutation(row),
        attachments: await Promise.all(attachmentRows.map(mapMutationAttachment)),
      },
    };
    mutationResponseSchema.parse(payload);
    return ok(c, payload.data);
  })
  .patch("/:id/status", async (c) => {
    const sessionUser = c.get("sessionUser");
    const db = getDb();
    const body = await parseJson(c.req.raw, updateMutationStatusSchema);
    const [updated] = await db
      .update(mutation)
      .set({
        status: body.status,
        reviewedBy: sessionUser.id,
        reviewedAt: new Date(),
        ...(body.reason !== undefined ? { reason: body.reason } : {}),
      })
      .where(eq(mutation.id, c.req.param("id")))
      .returning();
    if (!updated) throw notFound("Mutation not found");

    await logAdminActivity({
      adminId: sessionUser.id,
      action: "MUTATION_STATUS_UPDATED",
      entityType: "MUTATION",
      entityId: updated.id,
      metadata: { status: body.status, reason: body.reason ?? null },
    });

    const attachmentRows = await db
      .select()
      .from(mutationAttachment)
      .where(eq(mutationAttachment.mutationId, updated.id))
      .orderBy(mutationAttachment.createdAt);

    const payload = {
      success: true as const,
      data: {
        ...mapMutation(updated),
        attachments: await Promise.all(attachmentRows.map(mapMutationAttachment)),
      },
    };
    mutationResponseSchema.parse(payload);
    return ok(c, payload.data);
  })
  ;
