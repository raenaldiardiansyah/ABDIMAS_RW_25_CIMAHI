import { and, eq, ilike, or, sql } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

import {
  adminVerificationBucketsSchema,
  adminVerificationListSchema,
  maskNikFromParts,
  meIdentityResponseSchema,
  sessionResponseSchema,
  userIdParamSchema,
} from "@abdimas/contracts";
import { getDb, user, userIdentity } from "@abdimas/db";

import { adminUsersRoutes } from "./routes/admin-users.js";
import { adminActivitiesRoutes, scheduleRoutes } from "./routes/activities.js";
import { aspirationsRoutes } from "./routes/aspirations.js";
import { dashboardRoutes } from "./routes/dashboard.js";
import { historyRoutes } from "./routes/history.js";
import { householdsRoutes } from "./routes/households.js";
import { mutationsRoutes } from "./routes/mutations.js";
import { preferencesRoutes } from "./routes/preferences.js";
import { reportsRoutes } from "./routes/reports.js";
import { requestsRoutes } from "./routes/requests.js";
import { servicesRoutes } from "./routes/services.js";
import { citizensRoutes } from "./routes/citizens.js";
import { AppError } from "./lib/errors.js";
import { createRateLimitMiddleware } from "./lib/rate-limit.js";
import { fail, ok } from "./lib/response.js";
import { parseParams, sanitizeSearchTerm } from "./lib/validation.js";
import { adminMiddleware, authMiddleware } from "./middleware/auth.js";
import { resolveIdentity } from "./session.js";
import { approveVerificationService, rejectVerificationService } from "./services/verification.js";
import { frontendBackendTrace } from "./trace.js";

const querySchema = z.object({
  status: z.enum(["PENDING", "VERIFIED", "REJECTED"]).optional(),
  q: z.string().optional(),
});

const rejectVerificationSchema = z.object({
  reason: z.string().trim().min(1, "Reason is required").max(255),
});

export function createApp() {
  const app = new Hono<{ Variables: { sessionUser: { id: string; name: string; email: string; username?: string; role: string; status?: string } } }>();

  app.use("/admin/*", async (c, next) => {
    const startedAt = Date.now();
    try {
      await next();
    } finally {
      console.info(`[admin] ${c.req.method} ${c.req.path} -> ${c.res.status} (${Date.now() - startedAt}ms)`);
    }
  });

  app.onError((error, c) => {
    if (error instanceof AppError) {
      return fail(c, error.code, error.message, error.status, error.details);
    }
    if (error instanceof Error && error.message === "Missing DATABASE_URL env var") {
      return fail(c, "INTERNAL_ERROR", "Backend database is not configured. Set DATABASE_URL and restart the backend.", 500);
    }
    if (error instanceof HTTPException) {
      return fail(c, "INTERNAL_ERROR", error.message, error.status);
    }
    console.error(error);
    return fail(c, "INTERNAL_ERROR", "Internal server error", 500);
  });
  app.notFound((c) => fail(c, "NOT_FOUND", "Route not found", 404));

  app.get("/health", async (c) => {
    const startedAt = Date.now();
    const result = await getDb().execute(sql<{ value: number }>`select 1 as value`);
    const value = Number(result.rows?.[0]?.value ?? 0);
    return ok(c, {
      ok: value === 1,
      service: "backend",
      database: { ok: value === 1 },
      checkedAt: new Date().toISOString(),
      responseTimeMs: Date.now() - startedAt,
    });
  });
  app.get("/health/db", async (c) => {
    const startedAt = Date.now();
    const result = await getDb().execute(sql<{ value: number }>`select 1 as value`);
    const value = Number(result.rows?.[0]?.value ?? 0);
    return ok(c, {
      ok: value === 1,
      database: { ok: value === 1 },
      checkedAt: new Date().toISOString(),
      responseTimeMs: Date.now() - startedAt,
    });
  });
  app.get("/trace/frontend-backend", (c) => c.json(frontendBackendTrace));

  app.get("/me", authMiddleware, async (c) => {
    const sessionUser = c.get("sessionUser");
    const payload = sessionResponseSchema.parse({ user: sessionUser });
    return c.json(payload);
  });

  app.get("/me/identity", authMiddleware, async (c) => {
    const sessionUser = c.get("sessionUser");
    const identity = await resolveIdentity(sessionUser.id);
    if (!identity) return fail(c, "NOT_FOUND", "Identity not found", 404);
    return c.json(meIdentityResponseSchema.parse(identity));
  });

  app.get("/admin/verifications", adminMiddleware, async (c) => {
    const parsed = querySchema.safeParse({
      status: c.req.query("status") || undefined,
      q: sanitizeSearchTerm(c.req.query("q") || undefined),
    });
    if (!parsed.success) return fail(c, "VALIDATION_ERROR", "Invalid query", 400);

    const q = parsed.data.q?.trim();
    const baseWhere = q
      ? or(ilike(user.email, `%${q}%`), ilike(user.username, `%${q}%`), ilike(user.name, `%${q}%`))
      : undefined;

    if (parsed.data.status) {
      const status = parsed.data.status;
      const where = baseWhere
        ? and(eq(userIdentity.verificationStatus, status), baseWhere)
        : eq(userIdentity.verificationStatus, status);

      const rows = await getDb()
        .select({
          userId: user.id,
          username: user.username,
          email: user.email,
          createdAt: userIdentity.createdAt,
          verificationStatus: userIdentity.verificationStatus,
          nikFirst4: userIdentity.nikFirst4,
          nikLast4: userIdentity.nikLast4,
          rejectionReason: userIdentity.rejectionReason,
          verifiedAt: userIdentity.verifiedAt,
          verifiedBy: userIdentity.verifiedBy,
        })
        .from(userIdentity)
        .innerJoin(user, eq(user.id, userIdentity.userId))
        .where(where)
        .orderBy(userIdentity.createdAt);

      const payload = adminVerificationListSchema.parse({
        data: rows.map((row) => ({
          userId: row.userId,
          username: row.username,
          email: row.email,
          createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
          verificationStatus: row.verificationStatus,
          maskedNik: maskNikFromParts(row.nikFirst4, row.nikLast4),
          rejectionReason: row.rejectionReason,
          verifiedAt: row.verifiedAt?.toISOString() ?? null,
          verifiedBy: row.verifiedBy,
        })),
      });

      return ok(c, payload.data);
    }

    const rows = await getDb()
      .select({
        userId: user.id,
        username: user.username,
        email: user.email,
        createdAt: userIdentity.createdAt,
        verificationStatus: userIdentity.verificationStatus,
        nikFirst4: userIdentity.nikFirst4,
        nikLast4: userIdentity.nikLast4,
        rejectionReason: userIdentity.rejectionReason,
        verifiedAt: userIdentity.verifiedAt,
        verifiedBy: userIdentity.verifiedBy,
      })
      .from(userIdentity)
      .innerJoin(user, eq(user.id, userIdentity.userId))
      .where(baseWhere)
      .orderBy(userIdentity.createdAt);

    const items = rows.map((row) => ({
      userId: row.userId,
      username: row.username,
      email: row.email,
      createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
      verificationStatus: row.verificationStatus,
      maskedNik: maskNikFromParts(row.nikFirst4, row.nikLast4),
      rejectionReason: row.rejectionReason,
      verifiedAt: row.verifiedAt?.toISOString() ?? null,
      verifiedBy: row.verifiedBy,
    }));

    const payload = adminVerificationBucketsSchema.parse({
      pending: items.filter((row) => row.verificationStatus === "PENDING"),
      verified: items.filter((row) => row.verificationStatus === "VERIFIED"),
      rejected: items.filter((row) => row.verificationStatus === "REJECTED"),
      counts: {
        pending: items.filter((row) => row.verificationStatus === "PENDING").length,
        verified: items.filter((row) => row.verificationStatus === "VERIFIED").length,
        rejected: items.filter((row) => row.verificationStatus === "REJECTED").length,
      },
    });

    return ok(c, payload);
  });

  app.post("/admin/verifications/:userId/approve", adminMiddleware, createRateLimitMiddleware({ key: "verify-approve", limit: 20, windowMs: 60_000 }), async (c) => {
    const adminUser = c.get("sessionUser");
    const { userId } = parseParams(c.req.param(), userIdParamSchema);
    const updated = await approveVerificationService({ adminId: adminUser.id, userId });
    return ok(c, {
      userId: updated.userId,
      verificationStatus: updated.verificationStatus,
      verifiedAt: updated.verifiedAt?.toISOString() ?? null,
      verifiedBy: updated.verifiedBy,
    });
  });

  app.post("/admin/verifications/:userId/reject", adminMiddleware, createRateLimitMiddleware({ key: "verify-reject", limit: 20, windowMs: 60_000 }), async (c) => {
    const adminUser = c.get("sessionUser");
    const { userId } = parseParams(c.req.param(), userIdParamSchema);
    const body = rejectVerificationSchema.parse(await c.req.json().catch(() => ({})));
    const updated = await rejectVerificationService({ adminId: adminUser.id, userId, reason: body.reason });
    return ok(c, {
      userId: updated.userId,
      verificationStatus: updated.verificationStatus,
      rejectionReason: updated.rejectionReason,
      verifiedAt: updated.verifiedAt?.toISOString() ?? null,
      verifiedBy: updated.verifiedBy,
    });
  });

  app.route("/admin/citizens", citizensRoutes);
  app.route("/admin/households", householdsRoutes);
  app.route("/admin/requests", requestsRoutes);
  app.route("/admin/mutations", mutationsRoutes);
  app.route("/admin/activities", adminActivitiesRoutes);
  app.route("/admin/dashboard", dashboardRoutes);
  app.route("/admin/admin-users", adminUsersRoutes);
  app.route("/admin/reports", reportsRoutes);
  app.route("/services", servicesRoutes);
  app.route("/history", historyRoutes);
  app.route("/schedule", scheduleRoutes);
  app.route("/me/preferences", preferencesRoutes);
  app.route("/aspirations", aspirationsRoutes);

  return app;
}
