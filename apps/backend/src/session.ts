import { and, eq, gt } from "drizzle-orm";
import { getDb, session, user, userIdentity } from "@abdimas/db";
import { maskNikFromParts } from "@abdimas/contracts";

function readCookie(cookieHeader: string | undefined, key: string) {
  if (!cookieHeader) return null;
  const chunk = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${key}=`));

  return chunk ? decodeURIComponent(chunk.slice(key.length + 1)) : null;
}

function getSessionToken(cookieHeader: string | undefined) {
  return (
    readCookie(cookieHeader, "__Secure-better-auth.session_token") ||
    readCookie(cookieHeader, "better-auth.session_token")
  );
}

export async function resolveSession(cookieHeader: string | undefined) {
  const token = getSessionToken(cookieHeader);
  if (!token) return null;

  const db = getDb();
  try {
    const rows = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        status: user.status,
      })
      .from(session)
      .innerJoin(user, eq(user.id, session.userId))
      .where(and(eq(session.token, token), gt(session.expiresAt, new Date()), eq(user.status, "ACTIVE")))
      .limit(1);

    return rows[0] ?? null;
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? (error as { code?: string }).code : undefined;
    if (code !== "42703") throw error;

    const rows = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
      })
      .from(session)
      .innerJoin(user, eq(user.id, session.userId))
      .where(and(eq(session.token, token), gt(session.expiresAt, new Date())))
      .limit(1);

    return rows[0] ?? null;
  }
}

export async function resolveIdentity(userId: string) {
  const db = getDb();
  const rows = await db
    .select({
      userName: user.name,
      userEmail: user.email,
      maskedNik: userIdentity.nikFirst4,
      maskedNikLast4: userIdentity.nikLast4,
      verificationStatus: userIdentity.verificationStatus,
    })
    .from(userIdentity)
    .innerJoin(user, eq(user.id, userIdentity.userId))
    .where(eq(userIdentity.userId, userId))
    .limit(1);

  const identity = rows[0];
  if (!identity) return null;

  return {
    userName: identity.userName,
    userEmail: identity.userEmail,
    maskedNik: maskNikFromParts(identity.maskedNik, identity.maskedNikLast4),
    verificationStatus: identity.verificationStatus,
  };
}
