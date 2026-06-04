import { and, eq, sql } from "drizzle-orm";
import { Hono } from "hono";

import { reportSummaryResponseSchema } from "@abdimas/contracts";
import {
  adminActivityLog,
  aspiration,
  citizen,
  getDb,
  household,
  mutation,
  serviceRequest,
  userIdentity,
} from "@abdimas/db";

import { ok } from "../lib/response.js";
import { adminMiddleware } from "../middleware/auth.js";

export const dashboardRoutes = new Hono<{ Variables: { sessionUser: { id: string; role: string } } }>()
  .use("*", adminMiddleware)
  .get("/", async (c) => {
    const db = getDb();
    const [
      [{ totalWarga }],
      [{ totalKK }],
      [{ totalMutasi }],
      [{ pendingRequests }],
      [{ pendingVerifications }],
      [{ pendingMutations }],
      [{ pendingAspirations }],
      [{ deltaWarga }],
      [{ deltaKK }],
      [{ deltaMutasi }],
      latestLogRows,
      latestAspirationRows,
    ] = await Promise.all([
      db.select({ totalWarga: sql<number>`count(*)::int` }).from(citizen).where(eq(citizen.isArchived, false)),
      db.select({ totalKK: sql<number>`count(*)::int` }).from(household),
      db.select({ totalMutasi: sql<number>`count(*)::int` }).from(mutation),
      db
        .select({ pendingRequests: sql<number>`count(*)::int` })
        .from(serviceRequest)
        .where(eq(serviceRequest.status, "PENDING")),
      db
        .select({ pendingVerifications: sql<number>`count(*)::int` })
        .from(userIdentity)
        .where(eq(userIdentity.verificationStatus, "PENDING")),
      db
        .select({ pendingMutations: sql<number>`count(*)::int` })
        .from(mutation)
        .where(eq(mutation.status, "PENDING")),
      db
        .select({ pendingAspirations: sql<number>`count(*)::int` })
        .from(aspiration)
        .where(eq(aspiration.status, "SUBMITTED")),
      db
        .select({ deltaWarga: sql<number>`count(*)::int` })
        .from(citizen)
        .where(and(eq(citizen.isArchived, false), sql`${citizen.createdAt} >= now() - interval '7 days'`)),
      db
        .select({ deltaKK: sql<number>`count(*)::int` })
        .from(household)
        .where(sql`${household.createdAt} >= now() - interval '7 days'`),
      db
        .select({ deltaMutasi: sql<number>`count(*)::int` })
        .from(mutation)
        .where(sql`${mutation.createdAt} >= now() - interval '7 days'`),
      db.select().from(adminActivityLog).orderBy(sql`${adminActivityLog.createdAt} desc`).limit(50),
      db.select().from(aspiration).orderBy(sql`${aspiration.createdAt} desc`).limit(20),
    ]);

    const dW = Number(deltaWarga || 0);
    const dK = Number(deltaKK || 0);
    const dM = Number(deltaMutasi || 0);

    const latestActivities = [
      ...latestLogRows.map((row) => ({
        id: row.id,
        title: row.action,
        subtitle: `${row.entityType}${row.entityId ? ` • ${row.entityId}` : ""}`,
        time: row.createdAt.toISOString(),
        action: row.action,
        entityType: row.entityType,
      })),
      ...latestAspirationRows.map((row) => ({
        id: `aspiration-${row.id}`,
        title: row.title,
        subtitle: `Aduan warga${row.category ? ` • ${row.category}` : ""}`,
        time: row.createdAt.toISOString(),
        action: "Aduan warga masuk",
        entityType: "ASPIRATION",
      })),
    ]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 50);

    const payload = {
      success: true as const,
      data: {
        stats: {
          totalWarga: Number(totalWarga || 0),
          totalKK: Number(totalKK || 0),
          totalMutasi: Number(totalMutasi || 0),
          pendingRequests: Number(pendingRequests || 0),
          ...(dW > 0 ? { deltaWarga: dW } : {}),
          ...(dK > 0 ? { deltaKK: dK } : {}),
          ...(dM > 0 ? { deltaMutasi: dM } : {}),
        },
        latestActivities,
        notificationBadges: {
          pendingVerifications: Number(pendingVerifications || 0),
          pendingRequests: Number(pendingRequests || 0),
          pendingMutations: Number(pendingMutations || 0),
          pendingAspirations: Number(pendingAspirations || 0),
        },
      },
    };
    reportSummaryResponseSchema.parse(payload);
    return ok(c, payload.data);
  });
