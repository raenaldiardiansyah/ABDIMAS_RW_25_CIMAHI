import { NextResponse } from "next/server";
import { z } from "zod";

import { getDb } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { userIdentity } from "@/lib/db/schema";
import auth from "@/lib/auth";
import { env } from "@/lib/env";
import { encryptNik, hashNik, nikParts, normalizeNik } from "@/lib/security/nik";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

const bodySchema = z.object({
  nik: z.string().min(16).max(16),
  fullName: z.string().min(2).max(120).optional(),
});

export async function POST(req: Request) {
  const db = getDb();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  let nik: string;
  try {
    nik = normalizeNik(parsed.data.nik);
  } catch {
    return NextResponse.json({ error: "NIK harus 16 digit" }, { status: 400 });
  }

  try {
    const nikHash = hashNik(nik, env.NIK_HASH_PEPPER());
    const nikEncrypted = encryptNik(nik, env.NIK_ENCRYPTION_KEY_BASE64());
    const { first4, last4 } = nikParts(nik);

    const [created] = await db
      .insert(userIdentity)
      .values({
        userId: session.user.id,
        nikEncrypted,
        nikHash,
        nikFirst4: first4,
        nikLast4: last4,
        fullName: parsed.data.fullName ?? null,
        verificationStatus: "PENDING",
      })
      .returning();

    const adminEmails = new Set(env.ADMIN_EMAILS().map((e) => e.toLowerCase()));
    if (adminEmails.has(session.user.email.toLowerCase())) {
      await db.update(user).set({ role: "ADMIN" }).where(eq(user.id, session.user.id));
    }

    return NextResponse.json({
      data: {
        verificationStatus: created.verificationStatus,
        maskedNik: `${first4}********${last4}`,
      },
    });
  } catch (e: any) {
    if (e?.code === "23505") {
      return NextResponse.json({ error: "NIK sudah terdaftar" }, { status: 409 });
    }
    const message = typeof e?.message === "string" ? e.message : "";
    if (message.includes("NIK_ENCRYPTION_KEY_BASE64")) {
      return NextResponse.json(
        {
          error: "Server misconfigured: NIK encryption key invalid",
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
