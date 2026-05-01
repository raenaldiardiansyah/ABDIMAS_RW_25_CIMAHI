import { redirect } from "next/navigation";

import WargaShellClient from "./_components/warga-shell-client";
import { requireSession } from "@/lib/auth-server";
import { getUserIdentityByUserId, maskedNik } from "@/lib/identity";

export const dynamic = "force-dynamic";

export default async function WargaLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  const identity = await getUserIdentityByUserId(session.user.id);
  if (!identity) redirect("/register");

  return (
    <WargaShellClient
      identity={{
        userName: session.user.name,
        userEmail: session.user.email,
        maskedNik: maskedNik(identity),
        verificationStatus: identity.verificationStatus,
      }}
    >
      {children}
    </WargaShellClient>
  );
}
