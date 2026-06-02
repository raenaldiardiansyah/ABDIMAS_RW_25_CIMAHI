'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/* ── Mock Data ──────────────────────────────────────────── */

const KK_INFO = {
  kepala: 'Anakin Skywalker',
  nikKepala: '9275022203040000',
  noKK: '3275010908070005',
  alamat:
    'Jl. Tebet Timur Dalam II No.17 1, RT.1/RW.4, Tebet Tim., Kec. Tebet, Kota Jakarta Selatan.',
};

const INITIAL_ANGGOTA = [
  { nama: 'Anakin Skywalker', nik: '9275022203040000', hubungan: 'Kepala Keluarga', tglLahir: '21 Mei 2006', pekerjaan: 'Ceo of Sith' },
  { nama: 'Padme skywalker', nik: '9191502345030401', hubungan: 'Istri', tglLahir: '04 Oktober 2006', pekerjaan: 'Senator of Empire' },
  { nama: 'Luke Skywalker', nik: '9275022203040000', hubungan: 'Anak Laki Laki', tglLahir: '21 Oktober 2028', pekerjaan: 'Jedi' },
  { nama: 'Leia skywalker', nik: '9191502345030401', hubungan: 'Anak Perempuan', tglLahir: '04 Mei 2029', pekerjaan: 'Pelajar' },
];

const RIWAYAT = [
  { icon: 'doc' as const, title: 'Pembaruan Pekerjaan Faiq Haqqani', by: 'Faiq Haqqani', date: '12 Juni 2030' },
  { icon: 'user' as const, title: 'Pendaftaran Anggota Keluarga Baru', by: 'Admin RW', date: '05 Mei 2029' },
];

/* ── Page ────────────────────────────────────────────────── */

export default function DetailKartuKeluargaPage() {
  const router = useRouter();

  const [anggotaList, setAnggotaList] = useState(INITIAL_ANGGOTA);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  
  const [memberToEdit, setMemberToEdit] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ nama: '', hubungan: '', tglLahir: '', pekerjaan: '' });

  const handleDelete = () => {
    setAnggotaList((prev) => prev.filter((m) => m.nama !== memberToDelete));
    setMemberToDelete(null);
  };

  const handleEditClick = (row: any) => {
    setMemberToEdit(row.nama);
    setEditForm({ ...row });
  };

  const handleSaveEdit = () => {
    setAnggotaList((prev) => 
      prev.map((m) => (m.nama === memberToEdit ? { ...m, ...editForm } : m))
    );
    setMemberToEdit(null);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.back()}
            className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-500 transition hover:bg-gray-50 hover:text-[#1E293B]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="text-sm text-[#64748B]">Detail Kartu Keluarga</p>
            <h1 className="mt-1 text-2xl font-bold text-[#1E293B]">
              Keluarga Bapk. Faiq Haqqani
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

      {/* ── KK Summary Card ── */}
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
              <p className="font-semibold text-[#1E293B]">{KK_INFO.kepala}</p>
              <p className="text-xs text-[#3B82F6]">{KK_INFO.nikKepala}</p>
            </div>
            <p className="text-[#64748B]">{KK_INFO.noKK}</p>
            <p className="leading-relaxed text-[#64748B]">{KK_INFO.alamat}</p>
          </div>
        </div>
      </div>

      {/* ── Daftar Anggota Keluarga ── */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-xl font-bold text-[#1E293B]">
            Daftar Anggota Keluarga
          </h2>
          <span className="rounded-full border border-[#3B82F6]/30 bg-[#EFF6FF] px-3 py-1 text-xs font-semibold text-[#3B82F6]">
            {anggotaList.length} Orang
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
              {anggotaList.map((row, i) => (
                <tr
                  key={i}
                  className={i % 2 === 0 ? 'bg-white' : 'bg-[#F5F7FF]'}
                >
                  <td className="px-5 py-4">
                    <p className="font-semibold text-[#1E293B]">{row.nama}</p>
                    <p className="text-xs text-[#3B82F6]">{row.nik}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-full border border-[#3B82F6]/20 px-3 py-1 text-xs font-medium text-[#3B82F6]">
                      {row.hubungan}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[#64748B]">{row.tglLahir}</td>
                  <td className="px-5 py-4 text-[#64748B]">{row.pekerjaan}</td>
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
                        onClick={() => setMemberToDelete(row.nama)}
                        className="text-red-500 transition hover:text-red-700"
                        title="Hapus Anggota"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Riwayat Perubahan Data ── */}
      <div>
        <h2 className="mb-4 text-xl font-bold text-[#1E293B]">
          Riwayat Perubahan Data
        </h2>
        <div className="flex flex-col gap-4">
          {RIWAYAT.map((item, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF]">
                {item.icon === 'doc' ? (
                  <FileText className="h-5 w-5 text-[#3B82F6]" />
                ) : (
                  <UserPlus className="h-5 w-5 text-[#3B82F6]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#1E293B]">
                  {item.title}
                </p>
                <p className="text-xs text-[#64748B]">
                  Diperbarui Oleh{' '}
                  <span className="font-semibold text-[#3B82F6]">{item.by}</span>
                </p>
              </div>
              <span className="shrink-0 text-sm text-[#3B82F6]">{item.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Dialog Hapus ── */}
      <AlertDialog open={!!memberToDelete} onOpenChange={(open) => !open && setMemberToDelete(null)}>
        <AlertDialogContent className="rounded-3xl p-6 text-center max-w-sm">
          <AlertDialogHeader className="items-center text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <Trash2 className="h-8 w-8 text-red-600" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-[#1E293B]">Hapus Anggota?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-[#64748B]">
              Apakah Anda yakin ingin menghapus <b>{memberToDelete}</b> dari Kartu Keluarga ini?
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

      {/* ── Dialog Edit ── */}
      <Dialog open={!!memberToEdit} onOpenChange={(open) => !open && setMemberToEdit(null)}>
        <DialogContent className="rounded-3xl p-6 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#1E293B]">Edit Anggota Keluarga</DialogTitle>
            <DialogDescription className="text-sm font-medium text-[#64748B]">
              Ubah informasi data anggota keluarga di bawah ini.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="nama" className="font-bold text-[#1E293B]">Nama Lengkap</Label>
              <Input
                id="nama"
                value={editForm.nama}
                onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="hubungan" className="font-bold text-[#1E293B]">Hubungan</Label>
              <Input
                id="hubungan"
                value={editForm.hubungan}
                onChange={(e) => setEditForm({ ...editForm, hubungan: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="tglLahir" className="font-bold text-[#1E293B]">Tanggal Lahir</Label>
              <Input
                id="tglLahir"
                value={editForm.tglLahir}
                onChange={(e) => setEditForm({ ...editForm, tglLahir: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="pekerjaan" className="font-bold text-[#1E293B]">Pekerjaan</Label>
              <Input
                id="pekerjaan"
                value={editForm.pekerjaan}
                onChange={(e) => setEditForm({ ...editForm, pekerjaan: e.target.value })}
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
