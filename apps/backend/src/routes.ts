import { and, eq, ilike, or } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

import {
  adminVerificationListSchema,
  maskNikFromParts,
  meIdentityResponseSchema,
  sessionResponseSchema,
} from "@abdimas/contracts";
import { getDb, user, userIdentity } from "@abdimas/db";

import { adminUsersRoutes } from "./routes/admin-users";
import { adminActivitiesRoutes, scheduleRoutes } from "./routes/activities";
import { aspirationsRoutes } from "./routes/aspirations";
import { dashboardRoutes } from "./routes/dashboard";
import { historyRoutes } from "./routes/history";
import { householdsRoutes } from "./routes/households";
import { mutationsRoutes } from "./routes/mutations";
import { preferencesRoutes } from "./routes/preferences";
import { reportsRoutes } from "./routes/reports";
import { requestsRoutes } from "./routes/requests";
import { servicesRoutes } from "./routes/services";
import { citizensRoutes } from "./routes/citizens";
import { AppError } from "./lib/errors";
import { fail, ok } from "./lib/response";
import { adminMiddleware, authMiddleware } from "./middleware/auth";
import { resolveIdentity } from "./session";
import { frontendBackendTrace } from "./trace";

const querySchema = z.object({
  status: z.enum(["PENDING", "VERIFIED", "REJECTED"]).optional(),
  q: z.string().optional(),
});

export function createApp() {
  const app = new Hono<{ Variables: { sessionUser: { id: string; name: string; email: string; username?: string; role: string; status?: string } } }>();

  app.onError((error, c) => {
    if (error instanceof AppError) {
      return fail(c, error.code, error.message, error.status);
    }
    if (error instanceof HTTPException) {
      return fail(c, "INTERNAL_ERROR", error.message, error.status);
    }
    console.error(error);
    return fail(c, "INTERNAL_ERROR", "Internal server error", 500);
  });

  app.get("/health", (c) => ok(c, { ok: true }));
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
      q: c.req.query("q") || undefined,
    });
    if (!parsed.success) return fail(c, "VALIDATION_ERROR", "Invalid query", 400);

    const status = parsed.data.status ?? "PENDING";
    const q = parsed.data.q?.trim();
    const where = q
      ? and(
          eq(userIdentity.verificationStatus, status),
          or(ilike(user.email, `%${q}%`), ilike(user.username, `%${q}%`), ilike(user.name, `%${q}%`)),
        )
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

    return c.json(payload);
  });

  app.post("/admin/verifications/:userId/approve", adminMiddleware, async (c) => {
    const adminUser = c.get("sessionUser");
    const userId = c.req.param("userId");

    await getDb()
      .update(userIdentity)
      .set({
        verificationStatus: "VERIFIED",
        rejectionReason: null,
        verifiedAt: new Date(),
        verifiedBy: adminUser.id,
      })
      .where(eq(userIdentity.userId, userId));

    const referer = c.req.header("referer") || "/admin/verification";
    return c.redirect(referer, 303);
  });

  app.post("/admin/verifications/:userId/reject", adminMiddleware, async (c) => {
    const adminUser = c.get("sessionUser");
    const userId = c.req.param("userId");
    const body = await c.req.parseBody();
    const reason = typeof body.reason === "string" && body.reason.trim() ? body.reason.trim() : "Data tidak sesuai";

    await getDb()
      .update(userIdentity)
      .set({
        verificationStatus: "REJECTED",
        rejectionReason: reason,
        verifiedAt: new Date(),
        verifiedBy: adminUser.id,
      })
      .where(eq(userIdentity.userId, userId));

    const referer = c.req.header("referer") || "/admin/verification";
    return c.redirect(referer, 303);
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
