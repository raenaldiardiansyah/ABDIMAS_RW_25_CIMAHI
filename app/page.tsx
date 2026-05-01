import { redirect } from "next/navigation";

import { getSessionOrNull } from "@/lib/auth-server";
import { getUserRole } from "@/lib/user-role";
import { OnboardingHero } from "@/app/_components/onboarding-hero";

export default async function HomePage() {
  const session = await getSessionOrNull();

  if (session) {
    const role = await getUserRole(session.user.id);
    redirect(role === "ADMIN" ? "/admin" : "/warga");
  }

  return <OnboardingHero />;
}
