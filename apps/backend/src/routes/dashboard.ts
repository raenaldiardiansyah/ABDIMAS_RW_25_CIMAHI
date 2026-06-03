import { eq, sql } from "drizzle-orm";
import { Hono } from "hono";

import { reportSummaryResponseSchema } from "@abdimas/contracts";
import { adminActivityLog, citizen, getDb, household, mutation, serviceRequest, userIdentity } from "@abdimas/db";

import { ok } from "../lib/response";
import { adminMiddleware } from "../middleware/auth";

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
      latestLogRows,
    ] = await Promise.all([
      db.select({ totalWarga: sql<number>`count(*)::int` }).from(citizen),
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
      db.select().from(adminActivityLog).orderBy(sql`${adminActivityLog.createdAt} desc`).limit(10),
    ]);

    const payload = {
      success: true as const,
      data: {
        stats: {
          totalWarga: Number(totalWarga || 0),
          totalKK: Number(totalKK || 0),
          totalMutasi: Number(totalMutasi || 0),
          pendingRequests: Number(pendingRequests || 0),
        },
        latestActivities: latestLogRows.map((row) => ({
          title: row.action,
          subtitle: `${row.entityType}${row.entityId ? ` • ${row.entityId}` : ""}`,
          time: row.createdAt.toISOString(),
        })),
        notificationBadges: {
          pendingVerifications: Number(pendingVerifications || 0),
          pendingRequests: Number(pendingRequests || 0),
          pendingMutations: Number(pendingMutations || 0),
        },
      },
    };
    reportSummaryResponseSchema.parse(payload);
    return ok(c, payload.data);
  });
