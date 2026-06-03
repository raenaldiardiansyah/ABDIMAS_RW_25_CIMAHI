'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { UserPlus, Pencil, Trash2, FileText, ArrowLeft } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { platformFetch } from '@/lib/api/platform';

type Citizen = {
  id: string;
  nik: string;
  name: string;
  birthDate: string;
  occupation: string;
};

type HouseholdMember = {
  id: string;
  citizenId: string;
  relationship: string;
  citizen?: Citizen;
};

type HouseholdDetail = {
  id: string;
  kkNumber: string;
  address: string;
  rt: string;
  rw: string;
  headCitizenId: string;
  headCitizen?: Citizen;
  members?: HouseholdMember[];
};

type HouseholdAuditLog = {
  id: string;
  action: string;
  adminId: string;
  createdAt: string;
};

export default function DetailKartuKeluargaPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const householdId = params.id;

  const [detail, setDetail] = useState<HouseholdDetail | null>(null);
  const [auditLogs, setAuditLogs] = useState<HouseholdAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberToDelete, setMemberToDelete] = useState<HouseholdMember | null>(null);
  const [memberToEdit, setMemberToEdit] = useState<HouseholdMember | null>(null);
  const [editForm, setEditForm] = useState({ relationship: '' });

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [householdResponse, logsResponse] = await Promise.all([
          platformFetch<HouseholdDetail>(`/admin/households/${householdId}`),
          platformFetch<HouseholdAuditLog[]>(`/admin/households/${householdId}/audit-log`),
        ]);

        if (!active) return;
        setDetail(householdResponse.data);
        setAuditLogs(logsResponse.data);
      } catch (error) {
        console.error(error);
        if (!active) return;
        setDetail(null);
        setAuditLogs([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [householdId]);

  const handleDelete = async () => {
    if (!memberToDelete) return;

    try {
      await platformFetch<{ id: string }>(
        `/admin/households/${householdId}/members/${memberToDelete.id}`,
        { method: 'DELETE' },
      );

      setDetail((prev) =>
        prev
          ? {
              ...prev,
              members: (prev.members ?? []).filter((member) => member.id !== memberToDelete.id),
            }
          : prev,
      );
      setMemberToDelete(null);
    } catch (error) {
      console.error(error);
    }
  };

  const handleEditClick = (row: HouseholdMember) => {
    setMemberToEdit(row);
    setEditForm({ relationship: row.relationship });
  };

  const handleSaveEdit = async () => {
    if (!memberToEdit) return;

    try {
      const response = await platformFetch<HouseholdMember>(
        `/admin/households/${householdId}/members/${memberToEdit.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ relationship: editForm.relationship }),
        },
      );

      setDetail((prev) =>
        prev
          ? {
              ...prev,
              members: (prev.members ?? []).map((member) =>
                member.id === memberToEdit.id
                  ? { ...member, relationship: response.data.relationship }
                  : member,
              ),
            }
          : prev,
      );
      setMemberToEdit(null);
    } catch (error) {
      console.error(error);
    }
  };

  const members = detail?.members ?? [];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.back()}
            className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 hover:text-[#1E293B]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="text-sm text-[#64748B]">Detail Kartu Keluarga</p>
            <h1 className="mt-1 text-2xl font-bold text-[#1E293B]">
              {loading ? 'Memuat data...' : `Keluarga ${detail?.headCitizen?.name ?? '-'}`}
            </h1>
          </div>
        </div>
        <button
          onClick={() => console.log('Buka modal Tambah Anggota')}
          className="flex items-center gap-2 rounded-xl bg-[#1E293B] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#334155] active:scale-[0.98]"
        >
          <UserPlus className="h-4 w-4" />
          Tambah Anggota
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100">
        <div className="bg-[#3B82F6] px-6 py-3">
          <div className="grid grid-cols-3 text-sm font-semibold text-white">
            <span>Kepala Keluarga</span>
            <span>Nomor Kartu Keluarga</span>
            <span>Alamat Lengkap</span>
          </div>
        </div>
        <div className="bg-[#EFF6FF] px-6 py-4">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-semibold text-[#1E293B]">{detail?.headCitizen?.name ?? '-'}</p>
              <p className="text-xs text-[#3B82F6]">{detail?.headCitizen?.nik ?? '-'}</p>
            </div>
            <p className="text-[#64748B]">{detail?.kkNumber ?? '-'}</p>
            <p className="leading-relaxed text-[#64748B]">{detail?.address ?? '-'}</p>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-xl font-bold text-[#1E293B]">Daftar Anggota Keluarga</h2>
          <span className="rounded-full border border-[#3B82F6]/30 bg-[#EFF6FF] px-3 py-1 text-xs font-semibold text-[#3B82F6]">
            {members.length} Orang
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#3B82F6] text-white">
                <th className="px-5 py-3.5 text-left font-semibold">Nama Lengkap</th>
                <th className="px-5 py-3.5 text-left font-semibold">Hubungan</th>
                <th className="px-5 py-3.5 text-left font-semibold">Tanggal Lahir</th>
                <th className="px-5 py-3.5 text-left font-semibold">Pekerjaan</th>
                <th className="px-5 py-3.5 text-right font-semibold" />
              </tr>
            </thead>
            <tbody>
              {members.length > 0 ? (
                members.map((row, i) => (
                  <tr key={row.id} className={i % 2 === 0 ? 'bg-white' : 'bg-[#F5F7FF]'}>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[#1E293B]">{row.citizen?.name ?? '-'}</p>
                      <p className="text-xs text-[#3B82F6]">{row.citizen?.nik ?? '-'}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full border border-[#3B82F6]/20 px-3 py-1 text-xs font-medium text-[#3B82F6]">
                        {row.relationship}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[#64748B]">
                      {row.citizen?.birthDate
                        ? new Date(row.citizen.birthDate).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          })
                        : '-'}
                    </td>
                    <td className="px-5 py-4 text-[#64748B]">{row.citizen?.occupation ?? '-'}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-4">
                        <button
                          onClick={() => handleEditClick(row)}
                          className="text-[#3B82F6] transition hover:text-blue-700"
                          title="Edit Anggota"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setMemberToDelete(row)}
                          className="text-red-500 transition hover:text-red-700"
                          title="Hapus Anggota"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-[#64748B]">
                    {loading ? 'Memuat anggota keluarga...' : 'Tidak ada anggota keluarga.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-bold text-[#1E293B]">Riwayat Perubahan Data</h2>
        <div className="flex flex-col gap-4">
          {auditLogs.length > 0 ? (
            auditLogs.map((item) => (
              <div key={item.id} className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF]">
                  <FileText className="h-5 w-5 text-[#3B82F6]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#1E293B]">{item.action}</p>
                  <p className="text-xs text-[#64748B]">
                    Diperbarui oleh <span className="font-semibold text-[#3B82F6]">{item.adminId}</span>
                  </p>
                </div>
                <span className="shrink-0 text-sm text-[#3B82F6]">
                  {new Date(item.createdAt).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-[#64748B]">
              {loading ? 'Memuat riwayat...' : 'Belum ada riwayat perubahan.'}
            </p>
          )}
        </div>
      </div>

      <AlertDialog open={!!memberToDelete} onOpenChange={(open) => !open && setMemberToDelete(null)}>
        <AlertDialogContent className="max-w-sm rounded-3xl p-6 text-center">
          <AlertDialogHeader className="items-center text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <Trash2 className="h-8 w-8 text-red-600" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-[#1E293B]">Hapus Anggota?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-[#64748B]">
              Apakah Anda yakin ingin menghapus <b>{memberToDelete?.citizen?.name}</b> dari Kartu Keluarga ini?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex w-full flex-col gap-3 sm:flex-col sm:justify-center sm:space-x-0">
            <AlertDialogAction
              onClick={handleDelete}
              className="w-full rounded-xl bg-red-600 py-6 text-base font-bold text-white hover:bg-red-700"
            >
              Ya, Hapus
            </AlertDialogAction>
            <AlertDialogCancel className="w-full rounded-xl border-gray-200 py-6 text-base font-bold text-[#64748B] hover:bg-gray-100">
              Batal
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!memberToEdit} onOpenChange={(open) => !open && setMemberToEdit(null)}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#1E293B]">Edit Hubungan Anggota</DialogTitle>
            <DialogDescription className="text-sm font-medium text-[#64748B]">
              Perubahan di halaman ini hanya mengubah relasi anggota keluarga pada kartu keluarga.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="nama" className="font-bold text-[#1E293B]">
                Nama Lengkap
              </Label>
              <Input id="nama" value={memberToEdit?.citizen?.name ?? ''} disabled className="rounded-xl" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="nik" className="font-bold text-[#1E293B]">
                NIK
              </Label>
              <Input id="nik" value={memberToEdit?.citizen?.nik ?? ''} disabled className="rounded-xl" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="relationship" className="font-bold text-[#1E293B]">
                Hubungan
              </Label>
              <Input
                id="relationship"
                value={editForm.relationship}
                onChange={(e) => setEditForm({ relationship: e.target.value })}
                className="rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <button
              onClick={() => setMemberToEdit(null)}
              className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-bold text-[#64748B] transition hover:bg-gray-100"
            >
              Batal
            </button>
            <button
              onClick={handleSaveEdit}
              className="flex-1 rounded-xl bg-[#3B82F6] py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Simpan Perubahan
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
