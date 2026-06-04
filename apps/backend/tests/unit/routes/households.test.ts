import { beforeEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { createMiddleware } from "hono/factory";

const dbState = vi.hoisted(() => ({
  selectQueue: [] as unknown[][],
  insertQueue: [] as unknown[][],
  deleteQueue: [] as unknown[][],
}));

vi.mock("@abdimas/db", () => {
  const createSelectChain = () => {
    const chain = {
      from: vi.fn(() => chain),
      innerJoin: vi.fn(() => chain),
      where: vi.fn(() => chain),
      groupBy: vi.fn(async () => dbState.selectQueue.shift() ?? []),
      orderBy: vi.fn(() => chain),
      limit: vi.fn(async () => dbState.selectQueue.shift() ?? []),
      offset: vi.fn(async () => dbState.selectQueue.shift() ?? []),
      then: (resolve: (value: unknown[]) => unknown) =>
        Promise.resolve(dbState.selectQueue.shift() ?? []).then(resolve),
    };

    return chain;
  };

  const createInsertChain = () => ({
    values: vi.fn(() => createInsertChain()),
    returning: vi.fn(async () => dbState.insertQueue.shift() ?? []),
    onConflictDoNothing: vi.fn(async () => undefined),
  });

  const createDeleteChain = () => ({
    where: vi.fn(() => createDeleteChain()),
    returning: vi.fn(async () => dbState.deleteQueue.shift() ?? []),
  });

  return {
    getDb: () => ({
      select: vi.fn(() => createSelectChain()),
      insert: vi.fn(() => createInsertChain()),
      delete: vi.fn(() => createDeleteChain()),
    }),
    adminActivityLog: {},
    citizen: {
      id: "citizen.id",
      name: "citizen.name",
      nik: "citizen.nik",
    },
    household: {
      id: "household.id",
      kkNumber: "household.kkNumber",
      headCitizenId: "household.headCitizenId",
      address: "household.address",
      rt: "household.rt",
      rw: "household.rw",
      status: "household.status",
      createdAt: "household.createdAt",
      updatedAt: "household.updatedAt",
    },
    householdMember: {
      id: "householdMember.id",
      householdId: "householdMember.householdId",
      citizenId: "householdMember.citizenId",
      relationship: "householdMember.relationship",
      createdAt: "householdMember.createdAt",
      updatedAt: "householdMember.updatedAt",
    },
    mutation: {
      id: "mutation.id",
      citizenId: "mutation.citizenId",
    },
  };
});

vi.mock("../../../src/lib/admin-logs", () => ({
  logAdminActivity: vi.fn(),
}));

vi.mock("../../../src/middleware/auth", () => ({
  adminMiddleware: createMiddleware(async (c, next) => {
    c.set("sessionUser", { id: "admin-1", role: "ADMIN" });
    await next();
  }),
}));

const { householdsRoutes } = await import("../../../src/routes/households");
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
  app.route("/admin/households", householdsRoutes);
  return app;
}

beforeEach(() => {
  dbState.selectQueue = [];
  dbState.insertQueue = [];
  dbState.deleteQueue = [];
});

describe("householdsRoutes", () => {
  it("[ERR] [AC-05] returns 400 when both headCitizenId and headCitizenName are missing", async () => {
    const app = createApp();
    const response = await app
      .request("/admin/households", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kkNumber: "3201010101010101",
          address: "Jl Merdeka No 1",
          rt: "01",
          rw: "25",
          status: "ACTIVE",
        }),
      })
      .catch((error) => error as Response);

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(400);
  });

  it("[OK] [AC-06] creates household with generated head citizen when only headCitizenName is provided", async () => {
    const createdCitizen = {
      id: "citizen-10",
      userId: null,
      nik: "3276010101010101",
      name: "Kepala Baru",
      gender: "L",
      birthPlace: "-",
      birthDate: "2024-05-01",
      religion: "-",
      maritalStatus: "-",
      occupation: "-",
      education: "-",
      bloodType: null,
      address: "Jl Merdeka No 1",
      rt: "01",
      rw: "25",
      status: "PENDUDUK_TETAP",
      createdAt: new Date("2024-05-01T00:00:00Z"),
      updatedAt: new Date("2024-05-01T00:00:00Z"),
    };
    const createdHousehold = {
      id: "household-1",
      kkNumber: "3201010101010101",
      headCitizenId: createdCitizen.id,
      address: "Jl Merdeka No 1",
      rt: "01",
      rw: "25",
      status: "ACTIVE",
      createdAt: new Date("2024-05-01T00:00:00Z"),
      updatedAt: new Date("2024-05-01T00:00:00Z"),
    };

    dbState.selectQueue.push([], [createdCitizen]);
    dbState.insertQueue.push([createdCitizen], [createdHousehold]);

    const app = createApp();
    const response = await app.request("/admin/households", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        kkNumber: "3201010101010101",
        headCitizenName: "Kepala Baru",
        address: "Jl Merdeka No 1",
        rt: "01",
        rw: "25",
        status: "ACTIVE",
      }),
    });

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.data.headCitizenId).toBe(createdCitizen.id);
    expect(json.data.members).toHaveLength(1);
    expect(json.data.members[0].relationship).toBe("Kepala Keluarga");
  });

  it("[OK] deletes household and related citizens that only belong to that household", async () => {
    dbState.selectQueue.push(
      [
        {
          id: "household-1",
          kkNumber: "3201010101010101",
          headCitizenId: "citizen-1",
          address: "Jl Merdeka No 1",
          rt: "01",
          rw: "25",
          status: "ACTIVE",
          createdAt: new Date("2024-05-01T00:00:00Z"),
          updatedAt: new Date("2024-05-01T00:00:00Z"),
        },
      ],
      [
        { citizenId: "citizen-1", relationship: "Kepala Keluarga" },
        { citizenId: "citizen-2", relationship: "Anak" },
      ],
      [
        { citizenId: "citizen-1", householdCount: 1 },
        { citizenId: "citizen-2", householdCount: 1 },
      ],
    );
    dbState.deleteQueue.push(
      [
        {
          id: "household-1",
          kkNumber: "3201010101010101",
          headCitizenId: "citizen-1",
          address: "Jl Merdeka No 1",
          rt: "01",
          rw: "25",
          status: "ACTIVE",
          createdAt: new Date("2024-05-01T00:00:00Z"),
          updatedAt: new Date("2024-05-01T00:00:00Z"),
        },
      ],
      [{ id: "mutation-1" }],
      [{ id: "citizen-1" }, { id: "citizen-2" }],
    );

    const app = createApp();
    const response = await app.request("/admin/households/household-1", {
      method: "DELETE",
    });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.data.id).toBe("household-1");
    expect(json.data.deletedCitizenIds).toEqual(["citizen-1", "citizen-2"]);
    expect(json.data.retainedCitizenIds).toEqual([]);
  });
});
