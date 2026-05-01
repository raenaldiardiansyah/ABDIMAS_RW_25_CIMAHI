import Link from "next/link";

import { requireAdmin } from "@/lib/auth-server";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const session = await requireAdmin();

  return (
    <div className="flex min-h-[80svh] items-center justify-center">
      <div className="w-full max-w-xl bg-secondary border border-white/15 rounded-3xl p-6 shadow-2xl">
        <h1 className="text-2xl font-bold">Admin RW/RT</h1>
        <p className="text-sm text-white/60 mt-1">Masuk sebagai: {session.user.email}</p>

        <div className="mt-6 grid gap-3">
          <Button
            asChild
            className="w-full h-auto px-4 py-3 rounded-xl bg-[color:var(--panel-on-brand)] text-[color:var(--admin-background)] font-bold text-sm text-center"
          >
            <Link href="/admin/verification">Dashboard Verifikasi</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
