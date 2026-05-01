import { and, eq, ilike, or } from "drizzle-orm";

import { requireAdmin } from "@/lib/auth-server";
import { getDb } from "@/lib/db";
import { user, userIdentity } from "@/lib/db/schema";
import { maskNikFromParts } from "@/lib/security/nik";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ status?: string; q?: string }>;
};

export default async function AdminVerificationPage({ searchParams }: Props) {
  await requireAdmin();

  const sp = await searchParams;
  const status = (sp.status || "PENDING") as "PENDING" | "VERIFIED" | "REJECTED";
  const q = sp.q?.trim();

  const where = q
    ? and(
        eq(userIdentity.verificationStatus, status),
        or(ilike(user.email, `%${q}%`), ilike(user.username, `%${q}%`), ilike(user.name, `%${q}%`))
      )
    : eq(userIdentity.verificationStatus, status);

  const db = getDb();
  const rows = await db
    .select({
      userId: user.id,
      username: user.username,
      email: user.email,
      createdAt: userIdentity.createdAt,
      verificationStatus: userIdentity.verificationStatus,
      nikFirst4: userIdentity.nikFirst4,
      nikLast4: userIdentity.nikLast4,
      rejectionReason: userIdentity.rejectionReason,
    })
    .from(userIdentity)
    .innerJoin(user, eq(user.id, userIdentity.userId))
    .where(where)
    .orderBy(userIdentity.createdAt);

  return (
    <div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Verifikasi User</h1>
            <p className="text-sm text-white/60 mt-1">
              Status: <span className="font-semibold">{status}</span>
            </p>
          </div>
          <form className="flex gap-2">
            <Input
              name="q"
              defaultValue={q || ""}
              placeholder="Cari username/email..."
              className="h-10 w-56 rounded-xl bg-secondary border-white/15 text-sm text-white placeholder:text-white/50"
            />
            <select
              name="status"
              defaultValue={status}
              className="px-3 py-2 rounded-xl bg-secondary border border-white/15 text-sm"
            >
              <option value="PENDING">PENDING</option>
              <option value="VERIFIED">VERIFIED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
            <Button
              type="submit"
              className="h-10 rounded-xl bg-[color:var(--panel-on-brand)] text-[color:var(--admin-background)] font-bold text-sm hover:opacity-95"
            >
              Filter
            </Button>
          </form>
        </div>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
          <table className="min-w-full text-sm">
            <thead className="bg-secondary/50">
              <tr>
                <th className="text-left p-3">Username</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">NIK</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.userId} className="border-t border-white/10">
                  <td className="p-3 font-semibold">{r.username}</td>
                  <td className="p-3">{r.email}</td>
                  <td className="p-3">{maskNikFromParts(r.nikFirst4, r.nikLast4)}</td>
                  <td className="p-3">{r.verificationStatus}</td>
                  <td className="p-3">
                    <AdminActions userId={r.userId} status={r.verificationStatus} />
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="p-6 text-white/60" colSpan={5}>
                    Tidak ada data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
    </div>
  );
}

function AdminActions(props: { userId: string; status: string }) {
  // Server Component renders a minimal form-based action to avoid client JS dependency for MVP
  if (props.status === "VERIFIED") return <span className="text-white/60">-</span>;

  return (
    <div className="flex gap-2">
      <form action="/api/admin/verification/approve" method="post">
        <input type="hidden" name="userId" value={props.userId} />
        <Button
          type="submit"
          size="sm"
          className="h-8 rounded-lg bg-emerald-400/90 px-3 text-[#0b1220] font-bold hover:opacity-95"
        >
          Approve
        </Button>
      </form>
      <form action="/api/admin/verification/reject" method="post">
        <input type="hidden" name="userId" value={props.userId} />
        <Input
          type="text"
          name="reason"
          placeholder="Reason"
          className="h-8 w-44 rounded-lg bg-secondary border-white/15 px-2 text-xs text-white placeholder:text-white/50"
          defaultValue="Data tidak sesuai"
        />
        <Button
          type="submit"
          size="sm"
          className="ml-2 h-8 rounded-lg bg-red-400/90 px-3 text-[#0b1220] font-bold hover:opacity-95"
        >
          Reject
        </Button>
      </form>
    </div>
  );
}
