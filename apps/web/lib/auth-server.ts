import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { MeIdentityResponse, SessionResponse } from "@abdimas/contracts";

import auth from "@/lib/auth";
import { getUserIdentityByUserId, maskedNik } from "@/lib/identity";

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

export async function hasSessionCookie() {
  const headerStore = await headers();
  const cookieHeader = headerStore.get("cookie") || undefined;
  return Boolean(getSessionToken(cookieHeader));
}

export async function getSessionOrNull(): Promise<SessionResponse | null> {
  const headerStore = await headers();
  const session = await auth.api.getSession({
    headers: headerStore,
  });
  if (!session?.user) return null;

  return {
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      username: session.user.username ?? undefined,
      role: session.user.role === "ADMIN" ? "ADMIN" : "USER",
    },
  };
}

export async function getIdentityOrNull(): Promise<MeIdentityResponse | null> {
  const session = await getSessionOrNull();
  if (!session) return null;

  const identity = await getUserIdentityByUserId(session.user.id);
  if (!identity) return null;

  return {
    userName: session.user.name,
    userEmail: session.user.email,
    maskedNik: maskedNik(identity),
    verificationStatus: identity.verificationStatus,
  };
}

export async function requireSession() {
  const session = await getSessionOrNull();
  if (!session) redirect("/sign-in");
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  if (session.user.role !== "ADMIN") redirect("/warga");
  return session;
}
