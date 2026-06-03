import { redirect } from "next/navigation";

import WargaShellClient from "./_components/warga-shell-client";
import { getIdentityOrNull, requireSession } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export default async function WargaLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const identity = await getIdentityOrNull();
  if (!identity) redirect("/register");

  return (
    <WargaShellClient
      identity={{
        userName: identity.userName || session.user.name,
        userEmail: identity.userEmail || session.user.email,
        maskedNik: identity.maskedNik,
        verificationStatus: identity.verificationStatus,
      }}
    >
      {children}
    </WargaShellClient>
  );
}
