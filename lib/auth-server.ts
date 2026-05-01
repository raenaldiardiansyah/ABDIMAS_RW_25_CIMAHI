import { headers } from "next/headers";
import { redirect } from "next/navigation";

import auth from "@/lib/auth";
import { getUserRole } from "@/lib/user-role";

export async function getSessionOrNull() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireSession() {
  const session = await getSessionOrNull();
  if (!session) redirect("/sign-in");
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  const role = await getUserRole(session.user.id);
  if (role !== "ADMIN") redirect("/warga");
  return session;
}
