'use client';
import { Button } from '@/components/ui/button';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { UserPlus, PencilSimple as Pencil, Trash as Trash2, FileText, ArrowLeft, DownloadSimple as Download, UserPlus as UserPlus2 } from '@phosphor-icons/react';

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
import AdminAsyncState from '@/components/admin/AdminAsyncState';
import { getPlatformErrorMessage, platformFetch } from '@/lib/api/platform';
import { useActionToast } from '@/lib/use-action-toast';

type Citizen = {
  id: string;
  nik: string;
  name: string;
  birthDate: string;
  occupation: string;
  gender?: string;
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

function getRelationshipBadge(rel: string) {
  const normalized = rel.toLowerCase();
  if (normalized.includes('kepala keluarga') || normalized.includes('anak laki-laki') || normalized.includes('anak laki laki')) {
    return 'bg-[#EEF2FF] text-[#3B82F6]';
  }
  if (normalized.includes('istri')) {
    return 'bg-pink-50 text-pink-500';
  }
  if (normalized.includes('anak perempuan')) {
    return 'bg-purple-50 text-purple-600';
  }
  return 'bg-[#EEF2FF] text-[#3B82F6]';
}

export default function DetailKartuKeluargaPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const householdId = params.id;
  const { runWithToast } = useActionToast();

  const [detail, setDetail] = useState<HouseholdDetail | null>(null);
  const [auditLogs, setAuditLogs] = useState<HouseholdAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<HouseholdMember | null>(null);
  const [memberToEdit, setMemberToEdit] = useState<HouseholdMember | null>(null);
  const [editForm, setEditForm] = useState({ relationship: '', birthDate: '', occupation: '' });

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
        setLoadError(null);
      } catch (error) {
        console.error(error);
        if (!active) return;
        setDetail(null);
        setAuditLogs([]);
        setLoadError(getPlatformErrorMessage(error, 'Gagal memuat detail kartu keluarga.'));
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
      await runWithToast(
        () =>
          platformFetch<{ id: string }>(
            `/admin/households/${householdId}/members/${memberToDelete.id}`,
            { method: 'DELETE' },
          ),
        {
          loading: 'Menghapus anggota keluarga...',
          success: 'Anggota keluarga dihapus',
          error: 'Gagal menghapus anggota keluarga',
        },
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
    setEditForm({ 
      relationship: row.relationship,
      birthDate: row.citizen?.birthDate ? new Date(row.citizen.birthDate).toISOString().split('T')[0] : '',
      occupation: row.citizen?.occupation ?? ''
    });
  };

  const handleSaveEdit = async () => {
    if (!memberToEdit) return;

    try {
      await runWithToast(
        () =>
          platformFetch<HouseholdMember>(
            `/admin/households/${householdId}/members/${memberToEdit.id}`,
            {
              method: 'PATCH',
              body: JSON.stringify(editForm),
            },
          ),
        {
          loading: 'Menyimpan perubahan anggota...',
          success: 'Data anggota keluarga diperbarui',
          error: 'Gagal memperbarui data anggota keluarga',
        },
      );

      setDetail((prev) =>
        prev
          ? {
              ...prev,
              members: (prev.members ?? []).map((member) =>
                member.id === memberToEdit.id
                  ? { 
                      ...member, 
                      relationship: editForm.relationship,
                      citizen: member.citizen ? {
                        ...member.citizen,
                        birthDate: editForm.birthDate ? new Date(editForm.birthDate).toISOString() : member.citizen.birthDate,
                        occupation: editForm.occupation
                      } : member.citizen
                    }
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

  if (loading && !detail && !loadError) {
    return (
      <AdminAsyncState
        mode="loading"
        page="Detail Kartu Keluarga"
        action="memuat detail kartu keluarga"
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {loadError ? (
        <AdminAsyncState
          mode="error"
          page="Detail Kartu Keluarga"
          action="memuat detail kartu keluarga"
          description={loadError}
          onRetry={() => router.refresh()}
        />
      ) : null}
      <div className="mb-2 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex flex-col">
          <p className="text-sm font-medium text-[#64748B]">Detail Kartu Keluarga</p>
          <h1 className="mt-1 text-3xl font-bold text-[#4B5563]">
            {loading ? 'Memuat data...' : `Keluarga ${detail?.headCitizen?.gender === 'P' ? 'Ibu' : 'Bapk.'} ${detail?.headCitizen?.name ?? '-'}`}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="flex items-center justify-center rounded-xl h-11 w-12 border-gray-200 text-[#3B82F6] transition hover:bg-gray-50"
          >
            <Download className="h-5 w-5" />
          </Button>
          <Link
            href={`/admin/kartu-keluarga/${householdId}/tambah`}
            className="flex h-11 items-center gap-2 rounded-xl bg-[#3B5BDB] px-6 text-sm font-semibold text-white transition hover:bg-[#2e4bb3] active:scale-[0.98]"
          >
            <UserPlus2 className="h-4 w-4" />
            Tambah Anggota
          </Link>
        </div>
      </div>

      {!loadError ? (
      <div className="overflow-hidden rounded-t-xl rounded-b-2xl border border-gray-100 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#3B5BDB] text-white">
              <th className="px-6 py-4 text-left font-semibold">Kepala Keluarga</th>
              <th className="px-6 py-4 text-left font-semibold">Nomor Kartu Keluarga</th>
              <th className="px-6 py-4 text-left font-semibold">Alamat Lengkap</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-[#EEF2FF]">
              <td className="px-6 py-5 align-top">
                <p className="font-bold text-[#1E293B]">{detail?.headCitizen?.name ?? '-'}</p>
                <p className="mt-0.5 text-xs text-[#3B82F6]">{detail?.headCitizen?.nik ?? '-'}</p>
              </td>
              <td className="px-6 py-5 align-top text-[#64748B] font-medium">{detail?.kkNumber ?? '-'}</td>
              <td className="px-6 py-5 align-top text-[#3B82F6] max-w-[280px] font-medium">{detail?.address ?? '-'}</td>
            </tr>
          </tbody>
        </table>
      </div>
      ) : null}

      {!loadError ? (
      <div>
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-2xl font-bold text-[#4B5563]">Daftar Anggota Keluarga</h2>
          <span className="rounded-full bg-[#EEF2FF] px-3 py-1 text-xs font-bold text-[#3B82F6]">
            {members.length} Orang
          </span>
        </div>

        <div className="overflow-hidden rounded-t-xl rounded-b-2xl border border-gray-100 shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#3B5BDB] text-white">
                <th className="px-6 py-4 text-left font-semibold">Nama Lengkap</th>
                <th className="px-6 py-4 text-left font-semibold">Hubungan</th>
                <th className="px-6 py-4 text-left font-semibold">Tanggal Lahir</th>
                <th className="px-6 py-4 text-left font-semibold">Pekerjaan</th>
                <th className="px-6 py-4 text-right font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {members.length > 0 ? (
                members.map((row, i) => (
                  <tr key={row.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-[#F5F7FF]'} hover:bg-blue-50/50 transition-colors`}>
                    <td className="px-6 py-4">
                      <p className="font-bold text-[#1E293B]">{row.citizen?.name ?? '-'}</p>
                      <p className="text-xs text-[#3B82F6]">{row.citizen?.nik ?? '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${getRelationshipBadge(row.relationship)}`}>
                        {row.relationship}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#3B82F6] font-medium">
                      {row.citizen?.birthDate
                        ? new Date(row.citizen.birthDate).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          })
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-[#3B82F6] font-medium">{row.citizen?.occupation ?? '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          onClick={() => handleEditClick(row)}
                          variant="ghost"
                          className="h-8 w-8 rounded-full p-0 text-[#3B82F6] hover:bg-[#EEF2FF] hover:text-[#3B5BDB]"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => setMemberToDelete(row)}
                          variant="ghost"
                          className="h-8 w-8 rounded-full p-0 text-[#3B82F6] hover:bg-[#EEF2FF] hover:text-[#3B5BDB]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-[#64748B]">
                    {loading ? 'Memuat anggota keluarga...' : 'Tidak ada anggota keluarga.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      ) : null}

      {!loadError ? (
      <div>
        <h2 className="mb-4 text-2xl font-bold text-[#4B5563]">Riwayat Perubahan Data</h2>
        <div className="flex flex-col gap-4">
          {auditLogs.length > 0 ? (
            auditLogs.map((item) => (
              <div key={item.id} className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#EEF2FF] border border-[#3B82F6]/10">
                  <FileText className="h-5 w-5 text-[#3B5BDB]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[#3B5BDB]">{item.action}</p>
                  <p className="text-xs font-medium text-[#3B82F6] mt-0.5">
                    Diperbarui Oleh <span className="font-bold text-[#1E293B]">{item.adminId}</span>
                  </p>
                </div>
                <span className="shrink-0 text-xs font-medium text-[#3B82F6]">
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
      ) : null}

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
        <DialogContent className="max-w-md rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#1E293B]">Edit Data Anggota</DialogTitle>
            <DialogDescription className="text-sm font-medium text-[#64748B]">
              Anda dapat mengubah relasi, tanggal lahir, dan pekerjaan anggota keluarga.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="nama" className="font-bold text-[#1E293B]">
                Nama Lengkap
              </Label>
              <Input id="nama" value={memberToEdit?.citizen?.name ?? ''} disabled className="rounded-xl bg-gray-50" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="nik" className="font-bold text-[#1E293B]">
                NIK
              </Label>
              <Input id="nik" value={memberToEdit?.citizen?.nik ?? ''} disabled className="rounded-xl bg-gray-50" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="relationship" className="font-bold text-[#1E293B]">
                Hubungan
              </Label>
              <select
                id="relationship"
                value={editForm.relationship}
                onChange={(e) => setEditForm({ ...editForm, relationship: e.target.value })}
                className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="Kepala Keluarga">Kepala Keluarga</option>
                <option value="Suami">Suami</option>
                <option value="Istri">Istri</option>
                <option value="Anak">Anak</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="birthDate" className="font-bold text-[#1E293B]">
                Tanggal Lahir
              </Label>
              <Input
                id="birthDate"
                type="date"
                value={editForm.birthDate}
                onChange={(e) => setEditForm({ ...editForm, birthDate: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="occupation" className="font-bold text-[#1E293B]">
                Pekerjaan
              </Label>
              <Input
                id="occupation"
                value={editForm.occupation}
                onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })}
                placeholder="Contoh: Pegawai Swasta"
                className="rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button
              onClick={() => setMemberToEdit(null)}
              className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-bold text-[#64748B] transition hover:bg-gray-100"
              variant="outline"
            >
              Batal
            </Button>
            <Button
              onClick={handleSaveEdit}
              className="flex-1 rounded-xl bg-[#3B82F6] py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
