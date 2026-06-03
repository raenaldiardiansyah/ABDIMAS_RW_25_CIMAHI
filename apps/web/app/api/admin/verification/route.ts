import { NextResponse } from "next/server";
import { and, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";
import { headers } from "next/headers";

import auth from "@/lib/auth";
import { getDb } from "@/lib/db";
import { user, userIdentity } from "@/lib/db/schema";
import { maskNikFromParts } from "@/lib/security/nik";
import { getUserRole } from "@/lib/user-role";

const querySchema = z.object({
  status: z.enum(["PENDING", "VERIFIED", "REJECTED"]).optional(),
  query: z.string().optional(),
});

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = await getUserRole(session.user.id);
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    status: url.searchParams.get("status") || undefined,
    query: url.searchParams.get("query") || undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: "Invalid query" }, { status: 400 });

  const status = parsed.data.status ?? "PENDING";
  const q = parsed.data.query?.trim();

  const where = q
    ? and(
        eq(userIdentity.verificationStatus, status),
        or(ilike(user.email, `%${q}%`), ilike(user.username, `%${q}%`), ilike(user.name, `%${q}%`))
      )
    : eq(userIdentity.verificationStatus, status);

  const db = getDb();
  const rows = await db
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

  return NextResponse.json({
    data: rows.map((r) => ({
      userId: r.userId,
      username: r.username,
      email: r.email,
      createdAt: r.createdAt,
      verificationStatus: r.verificationStatus,
      maskedNik: maskNikFromParts(r.nikFirst4, r.nikLast4),
      rejectionReason: r.rejectionReason,
      verifiedAt: r.verifiedAt,
      verifiedBy: r.verifiedBy,
    })),
  });
}
