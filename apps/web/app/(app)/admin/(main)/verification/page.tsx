import { requireAdmin } from "@/lib/auth-server";
import { getAdminVerifications } from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ status?: string; q?: string }>;
};

export default async function AdminVerificationPage({ searchParams }: Props) {
  await requireAdmin();

  const sp = await searchParams;
  const status = (sp.status || "PENDING") as "PENDING" | "VERIFIED" | "REJECTED";
  const q = sp.q?.trim();
  const rows = (await getAdminVerifications({ status, q })).data;

  return (
    <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Verifikasi Warga</h1>
            <p className="mt-1 text-sm text-slate-500">
              Status aktif: <span className="font-medium text-slate-700">{status}</span>
            </p>
          </div>
          <form className="flex flex-col gap-2 sm:flex-row">
            <Input
              name="q"
              defaultValue={q || ""}
              placeholder="Cari username/email..."
              className="h-10 w-full rounded-xl border-slate-200 bg-white text-sm sm:w-72"
            />
            <select
              name="status"
              defaultValue={status}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
            >
              <option value="PENDING">PENDING</option>
              <option value="VERIFIED">VERIFIED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
            <Button
              type="submit"
              className="h-10 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-[color:var(--brand-700)]"
            >
              Filter
            </Button>
          </form>
        </div>

        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-200 bg-slate-50/80">
            <CardTitle className="text-base font-semibold text-slate-900">Daftar verifikasi</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
          <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="p-4 text-left font-medium">Username</th>
                <th className="p-4 text-left font-medium">Email</th>
                <th className="p-4 text-left font-medium">NIK</th>
                <th className="p-4 text-left font-medium">Status</th>
                <th className="p-4 text-left font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.userId} className="border-t border-slate-100 text-slate-700">
                  <td className="p-4 font-medium text-slate-900">{r.username}</td>
                  <td className="p-4">{r.email}</td>
                  <td className="p-4 font-mono text-xs">{r.maskedNik}</td>
                  <td className="p-4">
                    <Badge variant="secondary" className="rounded-full border border-slate-200 bg-slate-100 text-slate-700">
                      {r.verificationStatus}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <AdminActions userId={r.userId} status={r.verificationStatus} />
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="p-10 text-center text-slate-500" colSpan={5}>
                    Tidak ada data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </CardContent>
        </Card>
    </div>
  );
}

function AdminActions(props: { userId: string; status: string }) {
  if (props.status === "VERIFIED") return <span className="text-slate-400">-</span>;

  return (
    <div className="flex flex-col gap-2 xl:flex-row">
      <form action={`/api/platform/admin/verifications/${props.userId}/approve`} method="post">
        <Button
          type="submit"
          size="sm"
          className="h-8 rounded-lg bg-emerald-500 px-3 text-white hover:bg-emerald-600"
        >
          Approve
        </Button>
      </form>
      <form action={`/api/platform/admin/verifications/${props.userId}/reject`} method="post" className="flex gap-2">
        <Input
          type="text"
          name="reason"
          placeholder="Reason"
          className="h-8 w-44 rounded-lg border-slate-200 bg-white px-2 text-xs text-slate-700"
          defaultValue="Data tidak sesuai"
        />
        <Button
          type="submit"
          size="sm"
          className="h-8 rounded-lg bg-rose-500 px-3 text-white hover:bg-rose-600"
        >
          Reject
        </Button>
      </form>
    </div>
  );
}
