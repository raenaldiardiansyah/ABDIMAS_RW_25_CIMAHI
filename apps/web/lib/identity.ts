import { and, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { userIdentity } from "@/lib/db/schema";
import { maskNikFromParts } from "@/lib/security/nik";

export async function getUserIdentityByUserId(userId: string) {
  const db = getDb();
  const rows = await db.select().from(userIdentity).where(eq(userIdentity.userId, userId)).limit(1);
  return rows[0] ?? null;
}

export function maskedNik(identity: { nikFirst4?: string | null; nikLast4?: string | null }) {
  return maskNikFromParts(identity.nikFirst4, identity.nikLast4);
}

export async function setVerificationStatus(params: {
  userId: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  adminId: string;
  reason?: string | null;
}) {
  const db = getDb();
  const now = new Date();
  const update = await db
    .update(userIdentity)
    .set({
      verificationStatus: params.status,
      verifiedBy: params.adminId,
      verifiedAt: now,
      rejectionReason: params.status === "REJECTED" ? params.reason ?? null : null,
      updatedAt: now,
    })
    .where(and(eq(userIdentity.userId, params.userId)))
    .returning();

  return update[0] ?? null;
}
