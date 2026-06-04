import { beforeEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { createMiddleware } from "hono/factory";

const sessionUser = { id: "admin-1", role: "ADMIN" };

const dbState = vi.hoisted(() => ({
  selectQueue: [] as unknown[][],
  insertQueue: [] as unknown[][],
  updateQueue: [] as unknown[][],
}));

const storageState = vi.hoisted(() => ({
  ensureStorageConfigured: vi.fn(),
  validateUpload: vi.fn(),
  uploadObject: vi.fn(),
  deleteObject: vi.fn(),
  buildObjectKey: vi.fn(),
  buildObjectUrl: vi.fn(),
}));

const logAdminActivity = vi.hoisted(() => vi.fn());

vi.mock("@abdimas/db", () => {
  const createSelectChain = () => ({
    from: vi.fn(() => createSelectChain()),
    innerJoin: vi.fn(() => createSelectChain()),
    where: vi.fn(() => createSelectChain()),
    orderBy: vi.fn(() => createSelectChain()),
    limit: vi.fn(async () => dbState.selectQueue.shift() ?? []),
    offset: vi.fn(async () => dbState.selectQueue.shift() ?? []),
  });

  const createInsertChain = () => ({
    values: vi.fn(() => createInsertChain()),
    returning: vi.fn(async () => dbState.insertQueue.shift() ?? []),
    onConflictDoNothing: vi.fn(async () => undefined),
  });

  const createUpdateChain = () => ({
    set: vi.fn(() => createUpdateChain()),
    where: vi.fn(() => createUpdateChain()),
    returning: vi.fn(async () => dbState.updateQueue.shift() ?? []),
  });

  return {
    getDb: () => ({
      select: vi.fn(() => createSelectChain()),
      insert: vi.fn(() => createInsertChain()),
      update: vi.fn(() => createUpdateChain()),
    }),
    citizen: {
      id: "citizen.id",
      nik: "citizen.nik",
      name: "citizen.name",
    },
    mutation: {
      id: "mutation.id",
      citizenId: "mutation.citizenId",
      type: "mutation.type",
      status: "mutation.status",
      mutationDate: "mutation.mutationDate",
      fromAddress: "mutation.fromAddress",
      toAddress: "mutation.toAddress",
      targetRt: "mutation.targetRt",
      phone: "mutation.phone",
      reason: "mutation.reason",
      requestedBy: "mutation.requestedBy",
      reviewedBy: "mutation.reviewedBy",
      reviewedAt: "mutation.reviewedAt",
      createdAt: "mutation.createdAt",
      updatedAt: "mutation.updatedAt",
    },
    mutationAttachment: {
      id: "mutationAttachment.id",
      mutationId: "mutationAttachment.mutationId",
      kind: "mutationAttachment.kind",
      objectKey: "mutationAttachment.objectKey",
      fileName: "mutationAttachment.fileName",
      contentType: "mutationAttachment.contentType",
      sizeBytes: "mutationAttachment.sizeBytes",
      createdAt: "mutationAttachment.createdAt",
    },
  };
});

vi.mock("../../../src/lib/admin-logs", () => ({
  logAdminActivity,
}));

vi.mock("../../../src/lib/storage", () => storageState);

vi.mock("../../../src/middleware/auth", () => ({
  adminMiddleware: createMiddleware(async (c, next) => {
    c.set("sessionUser", sessionUser);
    await next();
  }),
}));

const { mutationsRoutes } = await import("../../../src/routes/mutations");
const { AppError } = await import("../../../src/lib/errors");
const { fail } = await import("../../../src/lib/response");

function createApp() {
  const app = new Hono();
  app.onError((error, c) => {
    if (error instanceof AppError) {
      return fail(c, error.code, error.message, error.status);
    }
    if (error instanceof HTTPException) {
      return fail(c, "INTERNAL_ERROR", error.message, error.status);
    }
    return fail(c, "INTERNAL_ERROR", "Internal server error", 500);
  });
  app.route("/admin/mutations", mutationsRoutes);
  return app;
}

function createMultipartRequest(fields: Record<string, string>, files?: Record<string, File>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  for (const [key, file] of Object.entries(files ?? {})) formData.set(key, file);
  return formData;
}

beforeEach(() => {
  dbState.selectQueue = [];
  dbState.insertQueue = [];
  dbState.updateQueue = [];
  storageState.validateUpload.mockReset();
  storageState.ensureStorageConfigured.mockReset();
  storageState.uploadObject.mockReset();
  storageState.deleteObject.mockReset();
  storageState.buildObjectKey.mockReset();
  storageState.buildObjectUrl.mockReset();
  logAdminActivity.mockReset();
});

describe("mutationsRoutes", () => {
  it("[OK] [AC-01] creates a mutation for an existing citizen with attachment upload", async () => {
    const existingCitizen = {
      id: "citizen-1",
      nik: "3276010101010001",
      name: "Budi",
      gender: "L",
      birthPlace: "Bandung",
      birthDate: "2024-01-01",
      religion: "Islam",
      maritalStatus: "Belum Kawin",
      occupation: "Karyawan",
      education: "SMA",
      bloodType: null,
      address: "Jl Lama",
      rt: "01",
      rw: "25",
      status: "PENDUDUK_TETAP",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-01T00:00:00Z"),
    };
    const createdMutation = {
      id: "mutation-1",
      citizenId: existingCitizen.id,
      type: "IN",
      status: "PENDING",
      mutationDate: "2024-05-01",
      fromAddress: "Jl Asal",
      toAddress: "Jl Tujuan",
      targetRt: "02",
      phone: "8123",
      reason: "Pekerjaan",
      requestedBy: sessionUser.id,
      reviewedBy: null,
      reviewedAt: null,
      createdAt: new Date("2024-05-01T00:00:00Z"),
      updatedAt: new Date("2024-05-01T00:00:00Z"),
    };
    const createdAttachment = {
      id: "attachment-1",
      mutationId: createdMutation.id,
      kind: "KTP",
      objectKey: "mutations/mutation-1/ktp-1.pdf",
      fileName: "ktp.pdf",
      contentType: "application/pdf",
      sizeBytes: "4",
      createdAt: new Date("2024-05-01T00:00:00Z"),
    };

    dbState.selectQueue.push([existingCitizen]);
    dbState.insertQueue.push([createdMutation], [createdAttachment]);
    storageState.buildObjectKey.mockReturnValue(createdAttachment.objectKey);
    storageState.buildObjectUrl.mockResolvedValue("https://cdn.example/ktp.pdf");

    const app = createApp();
    const response = await app.request("/admin/mutations", {
      method: "POST",
      body: createMultipartRequest(
        {
          nik: existingCitizen.nik,
          name: existingCitizen.name,
          gender: "L",
          occupation: "Karyawan",
          type: "IN",
          mutationDate: "2024-05-01",
          fromAddress: "Jl Asal",
          toAddress: "Jl Tujuan",
          targetRt: "02",
          phone: "8123",
          reason: "Pekerjaan",
        },
        {
          ktp: new File(["test"], "ktp.pdf", { type: "application/pdf" }),
        },
      ),
    });

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.data.citizenId).toBe(existingCitizen.id);
    expect(json.data.attachments).toHaveLength(1);
    expect(storageState.validateUpload).toHaveBeenCalledTimes(1);
    expect(storageState.uploadObject).toHaveBeenCalledTimes(1);
    expect(logAdminActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        adminId: sessionUser.id,
        action: "MUTATION_CREATED",
        entityId: createdMutation.id,
      }),
    );
  });

  it("[OK] [AC-02] creates a citizen first when NIK is not found", async () => {
    const createdCitizen = {
      id: "citizen-2",
      nik: "3276010101010002",
      name: "Siti",
      gender: "P",
      birthPlace: "Tidak Diketahui",
      birthDate: "2024-05-02",
      religion: "Tidak Diketahui",
      maritalStatus: "Belum Kawin",
      occupation: "Guru",
      education: "Tidak Diketahui",
      bloodType: null,
      address: "Jl Baru",
      rt: "03",
      rw: "25",
      status: "PENDUDUK_TETAP",
      createdAt: new Date("2024-05-02T00:00:00Z"),
      updatedAt: new Date("2024-05-02T00:00:00Z"),
    };
    const createdMutation = {
      id: "mutation-2",
      citizenId: createdCitizen.id,
      type: "OUT",
      status: "PENDING",
      mutationDate: "2024-05-02",
      fromAddress: "Jl Asal",
      toAddress: "Jl Baru",
      targetRt: "03",
      phone: null,
      reason: "Keluarga",
      requestedBy: sessionUser.id,
      reviewedBy: null,
      reviewedAt: null,
      createdAt: new Date("2024-05-02T00:00:00Z"),
      updatedAt: new Date("2024-05-02T00:00:00Z"),
    };

    dbState.selectQueue.push([]);
    dbState.insertQueue.push([createdCitizen], [createdMutation]);

    const app = createApp();
    const response = await app.request("/admin/mutations", {
      method: "POST",
      body: createMultipartRequest({
        nik: createdCitizen.nik,
        name: createdCitizen.name,
        gender: "P",
        occupation: "Guru",
        type: "OUT",
        mutationDate: "2024-05-02",
        fromAddress: "Jl Asal",
        toAddress: "Jl Baru",
        targetRt: "03",
        reason: "Keluarga",
      }),
    });

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.data.citizenId).toBe(createdCitizen.id);
    expect(json.data.attachments).toEqual([]);
    expect(storageState.uploadObject).not.toHaveBeenCalled();
  });

  it("[ERR] [AC-03] returns validation error for invalid multipart fields", async () => {
    const app = createApp();
    const response = await app.request("/admin/mutations", {
      method: "POST",
      body: createMultipartRequest({
        nik: "123",
        name: "A",
        gender: "X",
        occupation: "B",
        type: "IN",
        mutationDate: "2024-05-02",
      }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: { code: "VALIDATION_ERROR" },
    });
  });

  it("[ERR] [AC-04] cleans up uploaded objects when a later upload step fails", async () => {
    const existingCitizen = {
      id: "citizen-1",
      nik: "3276010101010001",
      name: "Budi",
      gender: "L",
      birthPlace: "Bandung",
      birthDate: "2024-01-01",
      religion: "Islam",
      maritalStatus: "Belum Kawin",
      occupation: "Karyawan",
      education: "SMA",
      bloodType: null,
      address: "Jl Lama",
      rt: "01",
      rw: "25",
      status: "PENDUDUK_TETAP",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-01T00:00:00Z"),
    };
    const createdMutation = {
      id: "mutation-3",
      citizenId: existingCitizen.id,
      type: "IN",
      status: "PENDING",
      mutationDate: "2024-05-03",
      fromAddress: "Jl Asal",
      toAddress: "Jl Tujuan",
      targetRt: "02",
      phone: "8123",
      reason: "Pekerjaan",
      requestedBy: sessionUser.id,
      reviewedBy: null,
      reviewedAt: null,
      createdAt: new Date("2024-05-03T00:00:00Z"),
      updatedAt: new Date("2024-05-03T00:00:00Z"),
    };
    const firstKey = "mutations/mutation-3/surat_keterangan-1.pdf";

    dbState.selectQueue.push([existingCitizen]);
    dbState.insertQueue.push([createdMutation]);
    storageState.buildObjectKey
      .mockReturnValueOnce(firstKey)
      .mockReturnValueOnce("mutations/mutation-3/ktp-2.pdf");
    storageState.uploadObject
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("upload failed"));

    const app = createApp();
    const response = await app.request("/admin/mutations", {
      method: "POST",
      body: createMultipartRequest(
        {
          nik: existingCitizen.nik,
          name: existingCitizen.name,
          gender: "L",
          occupation: "Karyawan",
          type: "IN",
          mutationDate: "2024-05-03",
        },
        {
          suratKeterangan: new File(["a"], "sk.pdf", { type: "application/pdf" }),
          ktp: new File(["b"], "ktp.pdf", { type: "application/pdf" }),
        },
      ),
    });

    expect(response.status).toBe(500);
    expect(storageState.deleteObject).toHaveBeenCalledWith(firstKey);
  });
});
