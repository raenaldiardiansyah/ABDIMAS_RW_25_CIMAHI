import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, or } from "drizzle-orm";
import { splitSetCookieHeader } from "better-auth/cookies";

import { getDb } from "@/lib/db";
import { env } from "@/lib/env";
import { user, userIdentity } from "@/lib/db/schema";
import { encryptNik, hashNik, nikParts, normalizeNik } from "@/lib/security/nik";

const bodySchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9]+$/),
  email: z.string().email(),
  password: z.string().min(8).max(200),
  nik: z.string().min(16).max(16),
  fullName: z.string().min(2).max(120).optional(),
});

export async function POST(req: Request) {
  const db = getDb();

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Input tidak valid" }, { status: 400 });
  }

  let nik: string;
  try {
    nik = normalizeNik(parsed.data.nik);
  } catch {
    return NextResponse.json({ error: "NIK harus 16 digit" }, { status: 400 });
  }

  // Pre-check secrets/config so we never create an account if server misconfigured.
  let nikHash: string;
  let nikEncrypted: string;
  let nikMaskParts: { first4: string; last4: string };
  try {
    nikHash = hashNik(nik, env.NIK_HASH_PEPPER());
    nikEncrypted = encryptNik(nik, env.NIK_ENCRYPTION_KEY_BASE64());
    nikMaskParts = nikParts(nik);
  } catch (e: any) {
    const message = typeof e?.message === "string" ? e.message : "";
    if (message.includes("NIK_ENCRYPTION_KEY_BASE64")) {
      return NextResponse.json(
        { error: "Server misconfigured: NIK encryption key invalid" },
        { status: 500 }
      );
    }
    if (message.includes("NIK_HASH_PEPPER")) {
      return NextResponse.json(
        { error: "Server misconfigured: NIK hash pepper invalid" },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  // Pre-check uniqueness: NIK + username/email
  const existingNik = await db
    .select({ id: userIdentity.id })
    .from(userIdentity)
    .where(eq(userIdentity.nikHash, nikHash))
    .limit(1);
  if (existingNik.length > 0) {
    return NextResponse.json({ error: "NIK sudah terdaftar" }, { status: 409 });
  }

  const normalizedEmail = parsed.data.email.toLowerCase();
  const existingUser = await db
    .select({ id: user.id })
    .from(user)
    .where(or(eq(user.email, normalizedEmail), eq(user.username, parsed.data.username)))
    .limit(1);
  if (existingUser.length > 0) {
    return NextResponse.json({ error: "Email atau username sudah dipakai" }, { status: 409 });
  }

  // Create user using Better Auth (will also set session cookies).
  // Then, attach identity. If identity fails, delete user to keep system consistent.
  const origin = new URL(req.url).origin;
  const host = new URL(req.url).host;
  const cookie = req.headers.get("cookie") ?? "";
  const signUpHttpRes = await fetch(`${origin}/api/auth/sign-up/email`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie,
      origin,
      referer: `${origin}/register`,
      host,
      "x-forwarded-host": host,
      "x-forwarded-proto": origin.startsWith("https://") ? "https" : "http",
    },
    body: JSON.stringify({
      name: (parsed.data.fullName || parsed.data.username).trim(),
      email: normalizedEmail,
      password: parsed.data.password,
      username: parsed.data.username,
      displayUsername: parsed.data.username,
    }),
  });

  const setCookie = signUpHttpRes.headers.get("set-cookie") ?? "";
  const signUpJson = await signUpHttpRes.json().catch(() => ({}));
  if (!signUpHttpRes.ok) {
    const msg = signUpJson?.error?.message || signUpJson?.message || signUpJson?.error || "Gagal membuat akun";
    return NextResponse.json({ error: msg }, { status: signUpHttpRes.status });
  }

  const createdUser = signUpJson?.user;
  if (!createdUser?.id) {
    return NextResponse.json({ error: "Gagal membuat akun" }, { status: 400 });
  }

  try {
    await db.insert(userIdentity).values({
      userId: createdUser.id,
      nikEncrypted,
      nikHash,
      nikFirst4: nikMaskParts.first4,
      nikLast4: nikMaskParts.last4,
      fullName: parsed.data.fullName ?? null,
      verificationStatus: "PENDING",
    });

    const adminEmails = new Set(env.ADMIN_EMAILS().map((e) => e.toLowerCase()));
    if (adminEmails.has(normalizedEmail)) {
      await db.update(user).set({ role: "ADMIN" }).where(eq(user.id, createdUser.id));
    }
  } catch (e: any) {
    // Rollback user creation (compensation) so no account is left behind.
    await db.delete(user).where(eq(user.id, createdUser.id));

    // Best-effort: clear cookies if the client got auto-signed-in.
    if (e?.code === "23505") {
      return NextResponse.json({ error: "NIK sudah terdaftar" }, { status: 409 });
    }
    const res = NextResponse.json({ error: "Gagal menyimpan identitas" }, { status: 500 });
    res.headers.append("Set-Cookie", "better-auth.session_token=; Path=/; Max-Age=0; SameSite=Lax");
    res.headers.append("Set-Cookie", "better-auth.session_data=; Path=/; Max-Age=0; SameSite=Lax");
    return res;
  }

  const res = NextResponse.json({
    data: {
      verificationStatus: "PENDING",
      maskedNik: `${nikMaskParts.first4}********${nikMaskParts.last4}`,
    },
  });
  if (setCookie) {
    const cookies = splitSetCookieHeader(setCookie);
    for (const c of cookies) res.headers.append("set-cookie", c);
  }
  return res;
}
