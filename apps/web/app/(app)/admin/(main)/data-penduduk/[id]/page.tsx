import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, UserRound, BadgeInfo, Briefcase } from "lucide-react";

import { requireAdmin } from "@/lib/auth-server";
import { getBackendServerUrl } from "@/lib/api/backend";

type CitizenDetail = {
  id: string;
  nik: string;
  name: string;
  gender: string;
  birthPlace: string;
  birthDate: string;
  religion: string;
  maritalStatus: string;
  occupation: string;
  education: string;
  bloodType: string | null;
  address: string;
  rt: string;
  rw: string;
  status: string;
};

async function getCitizenDetail(id: string): Promise<CitizenDetail | null> {
  const headerStore = await headers();
  const cookie = headerStore.get("cookie");
  const res = await fetch(`${getBackendServerUrl()}/admin/citizens/${id}`, {
    headers: cookie ? { cookie } : undefined,
    cache: "no-store",
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch citizen detail (${res.status})`);

  const payload = (await res.json()) as { success: boolean; data?: CitizenDetail };
  if (!payload.success || !payload.data) throw new Error("Invalid citizen detail response");
  return payload.data;
}

export default async function CitizenDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const citizen = await getCitizenDetail(id);

  if (!citizen) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/data-penduduk"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#2563EB] hover:text-[#1D4ED8]"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Data Penduduk
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-[#1E293B]">{citizen.name}</h1>
          <p className="mt-1 text-sm text-[#64748B]">NIK {citizen.nik}</p>
        </div>
        <span className="rounded-full bg-[#EAF2FF] px-4 py-2 text-sm font-semibold text-[#2563EB]">
          {citizen.status}
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-[#D8DEE8] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#1E293B]">Profil Warga</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <DetailCard icon={UserRound} label="Jenis Kelamin" value={citizen.gender} />
            <DetailCard icon={BadgeInfo} label="Golongan Darah" value={citizen.bloodType ?? "-"} />
            <DetailCard
              icon={BadgeInfo}
              label="Tempat, Tanggal Lahir"
              value={`${citizen.birthPlace}, ${new Date(citizen.birthDate).toLocaleDateString("id-ID")}`}
            />
            <DetailCard icon={BadgeInfo} label="Agama" value={citizen.religion} />
            <DetailCard icon={BadgeInfo} label="Status Perkawinan" value={citizen.maritalStatus} />
            <DetailCard icon={Briefcase} label="Pekerjaan" value={citizen.occupation} />
            <DetailCard icon={BadgeInfo} label="Pendidikan" value={citizen.education} />
          </div>
        </section>

        <section className="rounded-3xl border border-[#D8DEE8] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#1E293B]">Domisili</h2>
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl bg-[#F4F8FF] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">Alamat</p>
              <p className="mt-2 text-sm leading-6 text-[#1E293B]">{citizen.address}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <DetailCard icon={MapPin} label="RT" value={citizen.rt} />
              <DetailCard icon={MapPin} label="RW" value={citizen.rw} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function DetailCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[#E4E7EC] bg-[#F8FBFF] p-4">
      <div className="flex items-center gap-2 text-[#2563EB]">
        <Icon className="h-4 w-4" />
        <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">{label}</p>
      </div>
      <p className="mt-2 text-sm font-medium text-[#1E293B]">{value}</p>
    </div>
  );
}
