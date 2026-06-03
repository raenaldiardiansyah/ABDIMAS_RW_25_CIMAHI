import { redirect } from "next/navigation";

import { getSessionOrNull } from "@/lib/auth-server";
import { getUserRole } from "@/lib/user-role";

import SignInShellClient from "./_components/sign-in-shell-client";

export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getSessionOrNull();
  if (session) {
    const role = await getUserRole(session.user.id);
    redirect(role === "ADMIN" ? "/admin" : "/warga");
  }

  const sp = await searchParams;
  return <SignInShellClient nextPath={sp.next} />;
}
