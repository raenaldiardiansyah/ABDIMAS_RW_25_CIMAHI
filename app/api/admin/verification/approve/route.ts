import { NextResponse } from "next/server";
import { z } from "zod";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

import auth from "@/lib/auth";
import { getDb } from "@/lib/db";
import { userIdentity } from "@/lib/db/schema";
import { getUserRole } from "@/lib/user-role";

const bodySchema = z.object({
  userId: z.string().min(1),
});

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = await getUserRole(session.user.id);
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let input: unknown = null;
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    input = await req.json().catch(() => null);
  } else {
    const fd = await req.formData().catch(() => null);
    if (fd) input = { userId: String(fd.get("userId") || "") };
  }
  const parsed = bodySchema.safeParse(input);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const db = getDb();
  const [updated] = await db
    .update(userIdentity)
    .set({
      verificationStatus: "VERIFIED",
      verifiedBy: session.user.id,
      verifiedAt: new Date(),
      rejectionReason: null,
    })
    .where(eq(userIdentity.userId, parsed.data.userId))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: { userId: updated.userId, verificationStatus: updated.verificationStatus } });
}
