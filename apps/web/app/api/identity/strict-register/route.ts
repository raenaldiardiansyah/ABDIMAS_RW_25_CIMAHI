import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, or } from "drizzle-orm";
import { splitSetCookieHeader } from "better-auth/cookies";

import { getDb } from "@/lib/db";
import { env } from "@/lib/env";
import { user, userIdentity } from "@/lib/db/schema";
import { encryptNik, hashNik, nikParts, normalizeNik } from "@/lib/security/nik";

/**
 * IMPORTANT PRODUCTION REQUIREMENTS:
 *
 * Pastikan di schema database kamu ada UNIQUE constraint untuk:
 * - user.email
 * - user.username
 * - userIdentity.nikHash
 * - userIdentity.userId
 *
 * Pre-check di API hanya untuk UX.
 * Pertahanan final terhadap duplicate/race condition tetap harus di database.
 */

const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username minimal 3 karakter")
  .max(30, "Username maksimal 30 karakter")
  .regex(/^[a-zA-Z0-9]+$/, "Username hanya boleh huruf dan angka")
  .transform((value) => value.toLowerCase());

const emailSchema = z
  .string()
  .trim()
  .email("Email tidak valid")
  .transform((value) => value.toLowerCase());

const passwordSchema = z
  .string()
  .min(8, "Password minimal 8 karakter")
  .max(200, "Password terlalu panjang")
  .refine((value) => /[A-Za-z]/.test(value), {
    message: "Password harus mengandung huruf",
  })
  .refine((value) => /\d/.test(value), {
    message: "Password harus mengandung angka",
  });

const bodySchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  nik: z.string().trim().min(16).max(16),
  fullName: z
    .string()
    .trim()
    .min(2, "Nama lengkap minimal 2 karakter")
    .max(120, "Nama lengkap maksimal 120 karakter")
    .optional(),
});

type ApiErrorCode =
  | "INVALID_INPUT"
  | "INVALID_NIK"
  | "DUPLICATE_DATA"
  | "SIGNUP_FAILED"
  | "IDENTITY_SAVE_FAILED"
  | "SERVER_ERROR";

function jsonError(
  message: string,
  status: number,
  code: ApiErrorCode,
  details?: unknown
) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    { status }
  );
}

function jsonSuccess<TData>(data: TData, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function isUniqueViolation(error: unknown) {
  const e = error as {
    code?: string;
    constraint?: string;
    message?: string;
    cause?: {
      code?: string;
      constraint?: string;
      message?: string;
    };
  };

  return (
    e?.code === "23505" ||
    e?.cause?.code === "23505" ||
    e?.message?.toLowerCase?.().includes("unique")
  );
}

function getRequestOrigin(req: Request) {
  /**
   * Lebih aman kalau kamu punya APP_URL / BETTER_AUTH_URL di env.
   * Tapi karena env helper kamu belum terlihat, fallback ke req.url tetap dipakai.
   */
  return new URL(req.url).origin;
}

function getRequestHost(req: Request) {
  return new URL(req.url).host;
}

function getClientIp(req: Request) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isSuspiciousNikPattern(nik: string) {
  const repeatedDigits = /^(\d)\1{15}$/.test(nik);
  const sequentialAscending = nik === "1234567890123456";
  const sequentialDescending = nik === "6543210987654321";

  return repeatedDigits || sequentialAscending || sequentialDescending;
}

function isValidNikDatePart(nik: string) {
  /**
   * Format umum NIK:
   * - 2 digit kode provinsi
   * - 2 digit kode kab/kota
   * - 2 digit kode kecamatan
   * - 6 digit tanggal lahir DDMMYY
   * - 4 digit nomor urut
   *
   * Untuk perempuan, tanggal lahir ditambah 40.
   */
  const dayRaw = Number(nik.slice(6, 8));
  const month = Number(nik.slice(8, 10));

  const day = dayRaw > 40 ? dayRaw - 40 : dayRaw;

  if (day < 1 || day > 31) return false;
  if (month < 1 || month > 12) return false;

  return true;
}

function validateNikStructure(nik: string) {
  if (!/^\d{16}$/.test(nik)) {
    return {
      valid: false,
      message: "NIK harus berisi 16 digit angka",
    };
  }

  if (isSuspiciousNikPattern(nik)) {
    return {
      valid: false,
      message: "Format NIK tidak valid",
    };
  }

  if (!isValidNikDatePart(nik)) {
    return {
      valid: false,
      message: "Tanggal lahir pada NIK tidak valid",
    };
  }

  return {
    valid: true,
    message: null,
  };
}

function passwordContainsUserData(password: string, email: string, username: string) {
  const lowerPassword = password.toLowerCase();
  const emailPrefix = email.split("@")[0]?.toLowerCase();

  return (
    lowerPassword.includes(username.toLowerCase()) ||
    (!!emailPrefix && emailPrefix.length >= 3 && lowerPassword.includes(emailPrefix))
  );
}

function appendAuthCookies(res: NextResponse, setCookieHeader: string) {
  if (!setCookieHeader) return;

  const cookies = splitSetCookieHeader(setCookieHeader);
  for (const cookie of cookies) {
    res.headers.append("set-cookie", cookie);
  }
}

function appendClearBetterAuthCookies(res: NextResponse) {
  /**
   * Ini masih best-effort karena nama cookie Better Auth bisa berbeda
   * tergantung konfigurasi.
   *
   * Kalau kamu pakai cross-subdomain cookies / secure prefix,
   * sesuaikan cookie name, domain, dan secure attributenya.
   */
  const expiredCookies = [
    "better-auth.session_token=; Path=/; Max-Age=0; SameSite=Lax",
    "better-auth.session_data=; Path=/; Max-Age=0; SameSite=Lax",
    "__Secure-better-auth.session_token=; Path=/; Max-Age=0; SameSite=Lax; Secure",
    "__Secure-better-auth.session_data=; Path=/; Max-Age=0; SameSite=Lax; Secure",
  ];

  for (const cookie of expiredCookies) {
    res.headers.append("set-cookie", cookie);
  }
}

/**
 * Placeholder rate limit.
 *
 * Untuk production beneran, jangan biarkan ini kosong.
 * Gunakan Redis/Upstash/Vercel KV/Cloudflare KV.
 *
 * Minimal key:
 * - register:ip:{ip}
 * - register:email:{email}
 * - register:username:{username}
 * - register:nik:{nikHash}
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function assertRateLimit(_params: {
  ip: string;
  email: string;
  username: string;
  nikHash: string;
}) {
  /**
   * Sengaja tidak implement in-memory rate limit di sini,
   * karena serverless production tidak reliable untuk memory state.
   *
   * Implementasikan di lib/rate-limit.ts dengan Redis.
   */
  return {
    allowed: true,
    retryAfterSeconds: null as number | null,
  };
}

export async function POST(req: Request) {
  const db = getDb();

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);

  if (!parsed.success) {
    return jsonError("Input tidak valid", 400, "INVALID_INPUT", {
      fields: parsed.error.flatten().fieldErrors,
    });
  }

  const {
    username: normalizedUsername,
    email: normalizedEmail,
    password,
    fullName,
  } = parsed.data;

  if (passwordContainsUserData(password, normalizedEmail, normalizedUsername)) {
    return jsonError(
      "Password tidak boleh mengandung username atau email",
      400,
      "INVALID_INPUT"
    );
  }

  let nik: string;

  try {
    nik = normalizeNik(parsed.data.nik);
  } catch {
    return jsonError("NIK harus berisi 16 digit angka", 400, "INVALID_NIK");
  }

  const nikValidation = validateNikStructure(nik);
  if (!nikValidation.valid) {
    return jsonError(
      nikValidation.message ?? "NIK tidak valid",
      400,
      "INVALID_NIK"
    );
  }

  let nikHash: string;
  let nikEncrypted: string;
  let nikMaskParts: { first4: string; last4: string };

  try {
    const pepper = env.NIK_HASH_PEPPER();
    const encryptionKey = env.NIK_ENCRYPTION_KEY_BASE64();

    nikHash = hashNik(nik, pepper);
    nikEncrypted = encryptNik(nik, encryptionKey);
    nikMaskParts = nikParts(nik);
  } catch (error) {
    /**
     * Jangan expose detail env/config ke client.
     * Detail cukup masuk log server.
     */
    console.error("[REGISTER_NIK_SECURITY_CONFIG_ERROR]", {
      error,
      production: isProduction(),
    });

    return jsonError("Terjadi kesalahan server", 500, "SERVER_ERROR");
  }

  const ip = getClientIp(req);

  const rateLimit = await assertRateLimit({
    ip,
    email: normalizedEmail,
    username: normalizedUsername,
    nikHash,
  });

  if (!rateLimit.allowed) {
    const res = jsonError(
      "Terlalu banyak percobaan. Coba lagi nanti.",
      429,
      "INVALID_INPUT"
    );

    if (rateLimit.retryAfterSeconds) {
      res.headers.set("Retry-After", String(rateLimit.retryAfterSeconds));
    }

    return res;
  }

  /**
   * Pre-check duplicate untuk UX.
   * Tetap wajib punya unique constraint di database.
   */
  try {
    const existingNik = await db
      .select({ id: userIdentity.id })
      .from(userIdentity)
      .where(eq(userIdentity.nikHash, nikHash))
      .limit(1);

    if (existingNik.length > 0) {
      return jsonError("Data sudah terdaftar", 409, "DUPLICATE_DATA");
    }

    const existingUser = await db
      .select({ id: user.id })
      .from(user)
      .where(
        or(
          eq(user.email, normalizedEmail),
          eq(user.username, normalizedUsername)
        )
      )
      .limit(1);

    if (existingUser.length > 0) {
      return jsonError("Email atau username sudah dipakai", 409, "DUPLICATE_DATA");
    }
  } catch (error) {
    console.error("[REGISTER_PRECHECK_ERROR]", {
      error,
      email: normalizedEmail,
      username: normalizedUsername,
    });

    return jsonError("Terjadi kesalahan server", 500, "SERVER_ERROR");
  }

  /**
   * Catatan:
   * Ini masih memakai internal fetch ke Better Auth mengikuti struktur kode awalmu.
   * Lebih ideal kalau kamu memakai server-side API dari auth instance secara langsung.
   */
  const origin = getRequestOrigin(req);
  const host = getRequestHost(req);
  const cookie = req.headers.get("cookie") ?? "";

  let signUpHttpRes: Response;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let signUpJson: any = {};
  let setCookie = "";

  try {
    signUpHttpRes = await fetch(`${origin}/api/auth/sign-up/email`, {
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
        name: (fullName || normalizedUsername).trim(),
        email: normalizedEmail,
        password,
        username: normalizedUsername,
        displayUsername: normalizedUsername,
      }),
    });

    setCookie = signUpHttpRes.headers.get("set-cookie") ?? "";
    signUpJson = await signUpHttpRes.json().catch(() => ({}));
  } catch (error) {
    console.error("[REGISTER_BETTER_AUTH_FETCH_ERROR]", {
      error,
      email: normalizedEmail,
      username: normalizedUsername,
    });

    return jsonError("Gagal membuat akun", 500, "SIGNUP_FAILED");
  }

  if (!signUpHttpRes.ok) {
    const safeMessage =
      signUpHttpRes.status >= 500
        ? "Gagal membuat akun"
        : signUpJson?.error?.message ||
          signUpJson?.message ||
          signUpJson?.error ||
          "Gagal membuat akun";

    return jsonError(safeMessage, signUpHttpRes.status, "SIGNUP_FAILED");
  }

  const createdUser = signUpJson?.user;

  if (!createdUser?.id) {
    console.error("[REGISTER_BETTER_AUTH_INVALID_RESPONSE]", {
      signUpJson,
      email: normalizedEmail,
      username: normalizedUsername,
    });

    return jsonError("Gagal membuat akun", 500, "SIGNUP_FAILED");
  }

  try {
    await db.insert(userIdentity).values({
      userId: createdUser.id,
      nikEncrypted,
      nikHash,
      nikFirst4: nikMaskParts.first4,
      nikLast4: nikMaskParts.last4,
      fullName: fullName ?? null,
      verificationStatus: "PENDING",
    });

    const adminEmails = new Set(
      env.ADMIN_EMAILS().map((email) => email.toLowerCase().trim())
    );

    if (adminEmails.has(normalizedEmail)) {
      await db
        .update(user)
        .set({ role: "ADMIN" })
        .where(eq(user.id, createdUser.id));
    }
  } catch (error) {
    console.error("[REGISTER_IDENTITY_INSERT_ERROR]", {
      error,
      userId: createdUser.id,
      email: normalizedEmail,
      username: normalizedUsername,
      isUniqueViolation: isUniqueViolation(error),
    });

    /**
     * Compensation rollback.
     * Ini bukan transaction rollback sempurna.
     * Tapi lebih aman daripada membiarkan user orphan.
     */
    try {
      await db.delete(user).where(eq(user.id, createdUser.id));
    } catch (rollbackError) {
      console.error("[REGISTER_ROLLBACK_USER_DELETE_FAILED]", {
        rollbackError,
        userId: createdUser.id,
      });
    }

    if (isUniqueViolation(error)) {
      const res = jsonError("Data sudah terdaftar", 409, "DUPLICATE_DATA");
      appendClearBetterAuthCookies(res);
      return res;
    }

    const res = jsonError(
      "Gagal menyimpan identitas",
      500,
      "IDENTITY_SAVE_FAILED"
    );

    appendClearBetterAuthCookies(res);
    return res;
  }

  const res = jsonSuccess(
    {
      verificationStatus: "PENDING",
      maskedNik: `${nikMaskParts.first4}********${nikMaskParts.last4}`,
    },
    201
  );

  appendAuthCookies(res, setCookie);

  return res;
}