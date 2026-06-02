import { headers } from "next/headers";
import { redirect } from "next/navigation";

import auth from "@/lib/auth";
import { getUserRole } from "@/lib/user-role";

export async function getSessionOrNull() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireSession() {
  // BYPASS: Return a mock session to allow UI testing without login
  return {
    user: { id: "mock-id", name: "Faiq Haqqani", role: "ADMIN" },
    session: { id: "mock-session" }
  } as any;
  
  // const session = await getSessionOrNull();
  // if (!session) redirect("/sign-in");
  // return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  
  // BYPASS: Automatically allow admin access
  return session;

  // const role = await getUserRole(session.user.id);
  // if (role !== "ADMIN") redirect("/warga");
  // return session;
}
