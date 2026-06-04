'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  ShieldCheck,
  Users,
  Activity,
  Edit,
  Trash2,
  KeyRound,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { platformFetch } from '@/lib/api/platform';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useActionToast } from '@/lib/use-action-toast';

const PAGE_SIZE = 20;

type AdminUser = {
  id: string;
  name: string;
  email: string;
  username: string;
  role: 'ADMIN' | 'USER';
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
};

type AdminLog = {
  id: string;
  adminId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
};

export default function KelolaAdminPage() {
  const { runWithToast, toast } = useActionToast();
  const [activeTab, setActiveTab] = useState<'daftar' | 'log'>('daftar');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [newNama, setNewNama] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState<'ADMIN'>('ADMIN');
  const [selectedAdminForAction, setSelectedAdminForAction] = useState<AdminUser | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [adminPage, setAdminPage] = useState(1);
  const [adminTotalPages, setAdminTotalPages] = useState(1);
  const [adminTotalItems, setAdminTotalItems] = useState(0);
  const [logPage, setLogPage] = useState(1);
  const [logTotalPages, setLogTotalPages] = useState(1);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
      setAdminPage(1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const adminParams = new URLSearchParams({ page: String(adminPage), limit: String(PAGE_SIZE) });
        if (debouncedSearchQuery) adminParams.set('q', debouncedSearchQuery);
        const logParams = new URLSearchParams({ page: String(logPage), limit: String(PAGE_SIZE) });
        const [adminResponse, logResponse] = await Promise.all([
          platformFetch<AdminUser[]>(`/admin/admin-users?${adminParams.toString()}`),
          platformFetch<AdminLog[]>(`/admin/admin-users/activity-logs?${logParams.toString()}`),
        ]);

        if (!active) return;
        setAdmins(adminResponse.data);
        setLogs(logResponse.data);
        setAdminTotalPages(adminResponse.meta?.totalPages ?? 1);
        setAdminTotalItems(adminResponse.meta?.total ?? adminResponse.data.length);
        setLogTotalPages(logResponse.meta?.totalPages ?? 1);
      } catch (error) {
        console.error(error);
        if (!active) return;
        setAdmins([]);
        setLogs([]);
        setAdminTotalPages(1);
        setAdminTotalItems(0);
        setLogTotalPages(1);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [adminPage, logPage, debouncedSearchQuery]);
  const filteredAdmins = admins;

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await runWithToast(
        () =>
          platformFetch<AdminUser>('/admin/admin-users', {
            method: 'POST',
            body: JSON.stringify({
              name: newNama,
              email: newEmail,
              username: newUsername,
              role: newRole,
            }),
          }),
        {
          loading: 'Membuat admin...',
          success: 'Admin berhasil dibuat',
          error: 'Gagal membuat admin',
        },
      );

      setAdmins((prev) => [response.data, ...prev]);
      setNewNama('');
      setNewEmail('');
      setNewUsername('');
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleEditOpen = (admin: AdminUser) => {
    setSelectedAdminForAction(admin);
    setEditName(admin.name);
    setIsEditModalOpen(true);
  };

  const handleEditSave = async () => {
    if (!selectedAdminForAction) return;

    try {
      const response = await runWithToast(
        () =>
          platformFetch<AdminUser>(`/admin/admin-users/${selectedAdminForAction.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ name: editName }),
          }),
        {
          loading: 'Menyimpan perubahan admin...',
          success: 'Admin berhasil diperbarui',
          error: 'Gagal memperbarui admin',
        },
      );

      setAdmins((prev) => prev.map((admin) => (admin.id === response.data.id ? response.data : admin)));
      setIsEditModalOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedAdminForAction) return;

    try {
      const response = await runWithToast(
        () =>
          platformFetch<{ userId: string; temporaryPassword: string }>(
            `/admin/admin-users/${selectedAdminForAction.id}/reset-password`,
            { method: 'POST' },
          ),
        {
          loading: 'Mereset password admin...',
          success: 'Password admin direset',
          error: 'Gagal mereset password admin',
        },
      );
      toast({
        title: 'Password sementara',
        description: response.data.temporaryPassword,
        variant: 'success',
        durationMs: 7000,
      });
      setIsResetModalOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeactivate = async () => {
    if (!selectedAdminForAction) return;

    try {
      const response = await runWithToast(
        () =>
          platformFetch<AdminUser>(
            `/admin/admin-users/${selectedAdminForAction.id}/deactivate`,
            { method: 'POST' },
          ),
        {
          loading: 'Menonaktifkan admin...',
          success: 'Admin dinonaktifkan',
          error: 'Gagal menonaktifkan admin',
        },
      );
      setAdmins((prev) => prev.map((admin) => (admin.id === response.data.id ? response.data : admin)));
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const activeAdminCount = admins.filter((admin) => admin.status === 'ACTIVE').length;
  const superAdminCount = admins.filter((admin) => admin.role === 'ADMIN').length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-[clamp(18px,2vw,24px)] font-bold text-[#1E293B]">Kelola Pengurus & Hak Akses</h2>
          <p className="mt-1 text-sm text-[#64748B]">Atur siapa saja yang memiliki akses ke dalam sistem informasi RW 25</p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-[#3B82F6] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#2563EB]"
        >
          <Plus className="h-4 w-4" />
          Tambah Admin
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#64748B]">Total Admin Aktif</p>
            <p className="text-2xl font-bold text-[#1E293B]">
              {activeAdminCount} <span className="text-sm font-semibold text-gray-400">Orang</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#64748B]">Admin</p>
            <p className="text-2xl font-bold text-[#1E293B]">
              {superAdminCount} <span className="text-sm font-semibold text-gray-400">Akun</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#64748B]">Aktivitas Tercatat</p>
            <p className="text-2xl font-bold text-[#1E293B]">
              {logs.length} <span className="text-sm font-semibold text-gray-400">Tindakan</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-2 px-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1">
          <Button
            onClick={() => setActiveTab('daftar')}
            className={cn('rounded-xl px-5 py-2.5 text-sm font-bold transition-all', activeTab === 'daftar' ? 'bg-[#EFF6FF] text-[#3B82F6]' : 'text-[#64748B] hover:bg-gray-50')}
          >
            Daftar Admin
          </Button>
          <Button
            onClick={() => setActiveTab('log')}
            className={cn('rounded-xl px-5 py-2.5 text-sm font-bold transition-all', activeTab === 'log' ? 'bg-[#EFF6FF] text-[#3B82F6]' : 'text-[#64748B] hover:bg-gray-50')}
          >
            Log Aktivitas
          </Button>
        </div>

        {activeTab === 'daftar' ? (
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Cari admin..."
              value={searchQuery}
              onChange={(e: any) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm outline-none transition focus:border-[#3B82F6] focus:bg-white"
            />
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {activeTab === 'daftar' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-[#F8FAFC] font-semibold text-[#475569]">
                <tr>
                  <th className="px-6 py-4">Nama Pengurus</th>
                  <th className="px-6 py-4">Hak Akses (Role)</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Dibuat</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAdmins.map((admin) => (
                  <tr key={admin.id} className="transition-colors hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2563EB] text-sm font-bold text-white shadow-sm">
                          {admin.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-[#1E293B]">{admin.name}</p>
                          <p className="text-xs text-[#64748B]">{admin.username} • {admin.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                        {admin.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {admin.status === 'ACTIVE' ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className={cn('font-medium', admin.status === 'ACTIVE' ? 'text-emerald-600' : 'text-red-600')}>
                          {admin.status === 'ACTIVE' ? 'Aktif' : 'Non-Aktif'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#64748B]">
                      {new Date(admin.createdAt).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          onClick={() => handleEditOpen(admin)}
                          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-[#3B82F6]"
                          title="Edit Profil"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedAdminForAction(admin);
                            setIsResetModalOpen(true);
                          }}
                          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-amber-50 hover:text-amber-500"
                          title="Reset Password"
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedAdminForAction(admin);
                            setIsDeleteModalOpen(true);
                          }}
                          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                          title="Non-aktifkan"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredAdmins.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-[#64748B]">Tidak ada admin ditemukan.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
            <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
              <span className="text-sm text-[#64748B]">
                Menampilkan {filteredAdmins.length === 0 ? 0 : (adminPage - 1) * PAGE_SIZE + 1} - {Math.min(adminPage * PAGE_SIZE, adminTotalItems)} dari {adminTotalItems} admin
              </span>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" disabled={adminPage === 1} onClick={() => setAdminPage((page) => Math.max(1, page - 1))}>Prev</Button>
                <span className="text-sm font-medium text-[#1E293B]">Halaman {adminPage} / {adminTotalPages}</span>
                <Button type="button" variant="outline" size="sm" disabled={adminPage >= adminTotalPages} onClick={() => setAdminPage((page) => Math.min(adminTotalPages, page + 1))}>Next</Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6 p-6">
            <h3 className="mb-2 font-bold text-[#1E293B]">Riwayat Tindakan Terbaru</h3>
            <div className="relative ml-3 flex flex-col gap-8 border-l-2 border-gray-100 pb-4">
              {logs.map((log) => (
                <div key={log.id} className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-4 border-[#3B82F6] bg-white" />
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-bold text-[#1E293B]">
                      {log.adminId} <span className="font-normal text-[#64748B]">({log.entityType})</span>
                    </p>
                    <p className="text-sm font-semibold text-[#2563EB]">{log.action}</p>
                    <p className="text-sm text-[#64748B]">{log.entityId ?? 'Tanpa entity id'}</p>
                    <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-gray-400">
                      <Clock className="h-3 w-3" />
                      {new Date(log.createdAt).toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
              <span className="text-sm text-[#64748B]">Halaman log {logPage} / {logTotalPages}</span>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" disabled={logPage === 1} onClick={() => setLogPage((page) => Math.max(1, page - 1))}>Prev</Button>
                <Button type="button" variant="outline" size="sm" disabled={logPage >= logTotalPages} onClick={() => setLogPage((page) => Math.min(logTotalPages, page + 1))}>Next</Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#1E293B]">Tambah Pengurus / Admin Baru</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddAdmin} className="mt-4 flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#1E293B]">Nama Lengkap</label>
              <Input
                type="text"
                required
                value={newNama}
                onChange={(e: any) => setNewNama(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-[#3B82F6] focus:bg-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#1E293B]">Email</label>
              <Input
                type="email"
                required
                value={newEmail}
                onChange={(e: any) => setNewEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-[#3B82F6] focus:bg-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#1E293B]">Username</label>
                <Input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e: any) => setNewUsername(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-[#3B82F6] focus:bg-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#1E293B]">Role</label>
                <select
                  value={newRole}
                  onChange={(e: any) => setNewRole(e.target.value as 'ADMIN')}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-[#3B82F6] focus:bg-white"
                >
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            </div>
            <div className="mt-2 rounded-xl border border-amber-100 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-800">
                Temporary password is generated by backend reset/create flow.
              </p>
            </div>
            <Button type="submit" className="mt-2 rounded-xl bg-[#3B82F6] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#2563EB]">
              Simpan Admin
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#1E293B]">Edit Profil Admin</DialogTitle>
          </DialogHeader>
          <div className="mt-4 flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#1E293B]">Nama Lengkap</label>
              <Input
                type="text"
                value={editName}
                onChange={(e: any) => setEditName(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-[#3B82F6] focus:bg-white"
              />
            </div>
            <Button
              onClick={() => void handleEditSave()}
              className="mt-2 rounded-xl bg-[#3B82F6] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#2563EB]"
            >
              Simpan Perubahan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isResetModalOpen} onOpenChange={setIsResetModalOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#1E293B]">Reset Password</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <p className="text-sm text-[#475569]">
              Reset password untuk <strong>{selectedAdminForAction?.name}</strong>.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                onClick={() => setIsResetModalOpen(false)}
                className="rounded-xl px-4 py-2 text-sm font-bold text-[#64748B] transition hover:bg-gray-100"
              >
                Batal
              </Button>
              <Button
                onClick={() => void handleResetPassword()}
                className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-amber-600"
              >
                Ya, Reset Password
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-600">Non-aktifkan Admin</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <p className="text-sm text-[#475569]">
              Anda akan mencabut hak akses sistem dari <strong>{selectedAdminForAction?.name}</strong>.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                onClick={() => setIsDeleteModalOpen(false)}
                className="rounded-xl px-4 py-2 text-sm font-bold text-[#64748B] transition hover:bg-gray-100"
              >
                Batal
              </Button>
              <Button
                onClick={() => void handleDeactivate()}
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-600"
              >
                Non-aktifkan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
