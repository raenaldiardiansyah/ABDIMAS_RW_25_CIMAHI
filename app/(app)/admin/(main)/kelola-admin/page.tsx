'use client';

import { useState } from 'react';
import { 
  IdCard, 
  Plus, 
  Search, 
  ShieldCheck, 
  Users, 
  Activity, 
  MoreVertical, 
  Edit, 
  Trash2, 
  KeyRound,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// --- MOCK DATA ---
const MOCK_ADMINS = [
  { id: '1', nama: 'Ahmad Subagyo', email: 'ahmad.subagyo@rw025.id', jabatan: 'Ketua RW', role: 'Super Admin', status: 'Aktif', lastActive: 'Baru saja' },
  { id: '2', nama: 'Budi Santoso', email: 'budi.sekretaris@rw025.id', jabatan: 'Sekretaris RW', role: 'Super Admin', status: 'Aktif', lastActive: '10 mnt lalu' },
  { id: '3', nama: 'Siti Aminah', email: 'siti.rt01@rw025.id', jabatan: 'Ketua RT 01', role: 'Admin RT', status: 'Aktif', lastActive: '1 jam lalu' },
  { id: '4', nama: 'Hendro Cahyono', email: 'hendro.rt02@rw025.id', jabatan: 'Ketua RT 02', role: 'Admin RT', status: 'Aktif', lastActive: 'Kemarin' },
  { id: '5', nama: 'Dewi Lestari', email: 'dewi.posyandu@rw025.id', jabatan: 'Kader Posyandu', role: 'Admin Spesifik', status: 'Non-Aktif', lastActive: '2 minggu lalu' },
];

const MOCK_LOGS = [
  { id: 'L1', admin: 'Budi Santoso', role: 'Super Admin', aksi: 'Menyetujui Permohonan Mutasi', deskripsi: 'Mutasi masuk warga A/N Rina Kusuma disetujui', waktu: 'Hari ini, 10:15 WIB' },
  { id: 'L2', admin: 'Ahmad Subagyo', role: 'Super Admin', aksi: 'Menambahkan Admin Baru', deskripsi: 'Menambahkan akun Hendro Cahyono (Admin RT 02)', waktu: 'Kemarin, 14:30 WIB' },
  { id: 'L3', admin: 'Siti Aminah', role: 'Admin RT', aksi: 'Mengubah Data Warga', deskripsi: 'Pembaruan alamat pada NIK 3277...', waktu: '12 Mei 2026, 09:00 WIB' },
  { id: 'L4', admin: 'Budi Santoso', role: 'Super Admin', aksi: 'Login Sistem', deskripsi: 'Login berhasil dari IP 114.120.x.x', waktu: '11 Mei 2026, 08:00 WIB' },
];

export default function KelolaAdminPage() {
  const [activeTab, setActiveTab] = useState<'daftar' | 'log'>('daftar');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // States for new admin form
  const [newNama, setNewNama] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newJabatan, setNewJabatan] = useState('');
  const [newRole, setNewRole] = useState('Admin RT');

  // Action Modals State
  const [selectedAdminForAction, setSelectedAdminForAction] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const filteredAdmins = MOCK_ADMINS.filter(a => 
    a.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.jabatan.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Berhasil menambahkan ${newNama} sebagai ${newRole}! (Simulasi)`);
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-[clamp(18px,2vw,24px)] font-bold text-[#1E293B]">Kelola Pengurus & Hak Akses</h2>
          <p className="text-sm text-[#64748B] mt-1">Atur siapa saja yang memiliki akses ke dalam sistem informasi RW 025</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-[#3B82F6] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#2563EB]"
        >
          <Plus className="h-4 w-4" />
          Tambah Admin
        </button>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#64748B]">Total Admin Aktif</p>
            <p className="text-2xl font-bold text-[#1E293B]">4 <span className="text-sm font-semibold text-gray-400">Orang</span></p>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#64748B]">Super Admin</p>
            <p className="text-2xl font-bold text-[#1E293B]">2 <span className="text-sm font-semibold text-gray-400">Akses Penuh</span></p>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#64748B]">Aktivitas Hari Ini</p>
            <p className="text-2xl font-bold text-[#1E293B]">12 <span className="text-sm font-semibold text-gray-400">Tindakan</span></p>
          </div>
        </div>
      </div>

      {/* ── Tabs & Search ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-white p-2 px-4 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setActiveTab('daftar')}
            className={cn("px-5 py-2.5 rounded-xl text-sm font-bold transition-all", activeTab === 'daftar' ? "bg-[#EFF6FF] text-[#3B82F6]" : "text-[#64748B] hover:bg-gray-50")}
          >
            Daftar Admin
          </button>
          <button 
            onClick={() => setActiveTab('log')}
            className={cn("px-5 py-2.5 rounded-xl text-sm font-bold transition-all", activeTab === 'log' ? "bg-[#EFF6FF] text-[#3B82F6]" : "text-[#64748B] hover:bg-gray-50")}
          >
            Log Aktivitas
          </button>
        </div>
        
        {activeTab === 'daftar' && (
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Cari admin..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm outline-none transition focus:border-[#3B82F6] focus:bg-white"
            />
          </div>
        )}
      </div>

      {/* ── Tab Content ── */}
      <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
        {activeTab === 'daftar' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#F8FAFC] text-[#475569] font-semibold border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Nama Pengurus</th>
                  <th className="px-6 py-4">Hak Akses (Role)</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Terakhir Aktif</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAdmins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#60A5FA] flex items-center justify-center text-white font-bold text-sm shadow-sm">
                          {admin.nama.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-[#1E293B]">{admin.nama}</p>
                          <p className="text-xs text-[#64748B]">{admin.jabatan} • {admin.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border",
                        admin.role === 'Super Admin' ? "bg-purple-50 text-purple-700 border-purple-200" : 
                        admin.role === 'Admin RT' ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-gray-100 text-gray-700 border-gray-200"
                      )}>
                        {admin.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {admin.status === 'Aktif' ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                        <span className={cn("font-medium", admin.status === 'Aktif' ? "text-emerald-600" : "text-red-600")}>
                          {admin.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#64748B]">{admin.lastActive}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => { setSelectedAdminForAction(admin); setIsEditModalOpen(true); }}
                          className="p-2 text-gray-400 hover:text-[#3B82F6] hover:bg-blue-50 rounded-lg transition-colors" title="Edit Profil"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => { setSelectedAdminForAction(admin); setIsResetModalOpen(true); }}
                          className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" title="Reset Password"
                        >
                          <KeyRound className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => { setSelectedAdminForAction(admin); setIsDeleteModalOpen(true); }}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Non-aktifkan"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredAdmins.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-[#64748B]">Tidak ada admin ditemukan.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 flex flex-col gap-6">
            <h3 className="font-bold text-[#1E293B] mb-2">Riwayat Tindakan Terbaru</h3>
            <div className="relative border-l-2 border-gray-100 ml-3 flex flex-col gap-8 pb-4">
              {MOCK_LOGS.map((log) => (
                <div key={log.id} className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-white border-4 border-[#3B82F6]" />
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-bold text-[#1E293B]">
                      {log.admin} <span className="font-medium text-[#64748B] font-normal">({log.role})</span>
                    </p>
                    <p className="text-sm font-semibold text-[#2563EB]">{log.aksi}</p>
                    <p className="text-sm text-[#64748B]">{log.deskripsi}</p>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mt-1">
                      <Clock className="h-3 w-3" />
                      {log.waktu}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Modal Tambah Admin ── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#1E293B]">Tambah Pengurus / Admin Baru</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddAdmin} className="mt-4 flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#1E293B]">Nama Lengkap</label>
              <input 
                type="text" required value={newNama} onChange={(e) => setNewNama(e.target.value)}
                placeholder="Misal: Ridwan Kamil"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-[#3B82F6] focus:bg-white"
              />
            </div>
            
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#1E293B]">Username / Email</label>
              <input 
                type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                placeholder="email@rw025.id"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-[#3B82F6] focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#1E293B]">Jabatan</label>
                <input 
                  type="text" required value={newJabatan} onChange={(e) => setNewJabatan(e.target.value)}
                  placeholder="Ketua RT 03"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-[#3B82F6] focus:bg-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#1E293B]">Hak Akses (Role)</label>
                <select 
                  value={newRole} onChange={(e) => setNewRole(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-[#3B82F6] focus:bg-white"
                >
                  <option value="Super Admin">Super Admin</option>
                  <option value="Admin RT">Admin RT</option>
                  <option value="Admin Spesifik">Admin Spesifik</option>
                </select>
              </div>
            </div>

            <div className="mt-2 rounded-xl bg-amber-50 p-4 border border-amber-100">
              <p className="text-sm font-medium text-amber-800">
                <strong>Catatan:</strong> Password *default* akan dibuat secara otomatis dan dikirimkan ke email pengurus bersangkutan.
              </p>
            </div>

            <button type="submit" className="mt-2 rounded-xl bg-[#3B82F6] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#2563EB]">
              Simpan Admin
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Modal Edit Admin ── */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#1E293B]">Edit Profil Admin</DialogTitle>
          </DialogHeader>
          <div className="mt-4 flex flex-col gap-4">
            <p className="text-sm text-[#64748B]">Anda sedang mengedit data untuk <strong>{selectedAdminForAction?.nama}</strong>.</p>
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#1E293B]">Nama Lengkap</label>
              <input 
                type="text" defaultValue={selectedAdminForAction?.nama}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-[#3B82F6] focus:bg-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#1E293B]">Jabatan</label>
              <input 
                type="text" defaultValue={selectedAdminForAction?.jabatan}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-[#3B82F6] focus:bg-white"
              />
            </div>
            <button 
              onClick={() => { alert('Data berhasil diubah!'); setIsEditModalOpen(false); }}
              className="mt-2 rounded-xl bg-[#3B82F6] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#2563EB]"
            >
              Simpan Perubahan
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Modal Reset Password ── */}
      <Dialog open={isResetModalOpen} onOpenChange={setIsResetModalOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#1E293B]">Reset Password</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <p className="text-sm text-[#475569]">
              Apakah Anda yakin ingin mereset kata sandi untuk admin <strong>{selectedAdminForAction?.nama}</strong>?
              <br /><br />
              Password baru akan dibuat secara otomatis dan dikirim ke <strong>{selectedAdminForAction?.email}</strong>.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setIsResetModalOpen(false)}
                className="rounded-xl px-4 py-2 text-sm font-bold text-[#64748B] hover:bg-gray-100 transition"
              >
                Batal
              </button>
              <button 
                onClick={() => { alert('Password berhasil direset dan dikirim ke email tujuan.'); setIsResetModalOpen(false); }}
                className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white hover:bg-amber-600 transition"
              >
                Ya, Reset Password
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Modal Hapus / Non-aktifkan ── */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-600">Non-aktifkan Admin</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <p className="text-sm text-[#475569]">
              Anda akan mencabut hak akses sistem dari <strong>{selectedAdminForAction?.nama}</strong>. Mereka tidak akan bisa *login* lagi.
              <br /><br />
              Lanjutkan?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="rounded-xl px-4 py-2 text-sm font-bold text-[#64748B] hover:bg-gray-100 transition"
              >
                Batal
              </button>
              <button 
                onClick={() => { alert('Akses admin berhasil dicabut!'); setIsDeleteModalOpen(false); }}
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600 transition"
              >
                Non-aktifkan
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
