'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  KeyRound,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserX,
  Users,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { platformFetch } from '@/lib/api/platform';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useActionToast } from '@/lib/use-action-toast';

const PAGE_SIZE = 15;

type AdminUser = {
  id: string;
  name: string;
  email: string;
  username: string;
  role: 'ADMIN' | 'SUPER_ADMIN' | 'USER';
  roleLabel: string;
  adminScope: 'RW' | 'RT' | null;
  rtCode: string | null;
  managedRtCodes: string[];
  displayName: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
};

type AdminLog = {
  id: string;
  adminId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown>;
  actorName: string;
  actorEmail: string;
  actorRoleLabel: string;
  createdAt: string;
};

type SessionPayload = {
  user: {
    role: 'ADMIN' | 'SUPER_ADMIN' | 'USER';
  };
};

const TABS = [
  { key: 'all', label: 'Semua' },
  { key: 'rw', label: 'Admin RW' },
  { key: 'rt', label: 'Admin RT' },
  { key: 'inactive', label: 'Nonaktif' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

const ROLE_STYLES: Record<string, string> = {
  'Admin RW': 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]',
  'Admin RT': 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]',
};

const AVATAR_COLORS = [
  'bg-[#2563EB]',
  'bg-[#7C3AED]',
  'bg-[#059669]',
  'bg-[#DC2626]',
  'bg-[#D97706]',
  'bg-[#0891B2]',
];

function avatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getRoleStyle(scope: AdminUser['adminScope']) {
  if (scope === 'RW') return ROLE_STYLES['Admin RW'];
  return ROLE_STYLES['Admin RT'];
}

function describeAction(action: string) {
  switch (action) {
    case 'ADMIN_USER_CREATED':
      return 'membuat akses admin';
    case 'ADMIN_USER_UPDATED':
      return 'memperbarui profil admin';
    case 'ADMIN_USER_DEACTIVATED':
      return 'menonaktifkan akses admin';
    case 'ADMIN_USER_PASSWORD_RESET':
      return 'mereset password admin';
    default:
      return action;
  }
}

function formatLogTarget(log: AdminLog) {
  const rtCodes = Array.isArray(log.metadata?.managedRtCodes)
    ? log.metadata.managedRtCodes.filter((value): value is string => typeof value === 'string')
    : [];
  if (rtCodes.length > 0) return `Admin RT ${rtCodes.map((code) => `RT ${code}`).join(', ')}`;
  const rtCode = typeof log.metadata?.rtCode === 'string' ? log.metadata.rtCode : null;
  if (rtCode) return `Admin RT ${rtCode}`;
  return log.entityId ?? 'Akun admin';
}

export default function HakAksesPage() {
  const router = useRouter();
  const { runWithToast, toast } = useActionToast();

  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [currentRole, setCurrentRole] = useState<SessionPayload['user']['role']>('USER');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 500);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
        if (debouncedSearch) params.set('q', debouncedSearch);

        const [adminResponse, logResponse, sessionResponse] = await Promise.all([
          platformFetch<AdminUser[]>(`/admin/admin-users?${params.toString()}`),
          platformFetch<AdminLog[]>('/admin/admin-users/activity-logs?page=1&limit=8'),
          platformFetch<SessionPayload>('/me'),
        ]);

        if (!active) return;
        setAdmins(adminResponse.data);
        setLogs(logResponse.data);
        setCurrentRole(sessionResponse.data.user.role);
        setTotalPages(adminResponse.meta?.totalPages ?? 1);
        setTotalItems(adminResponse.meta?.total ?? adminResponse.data.length);
      } catch {
        if (!active) return;
        setAdmins([]);
        setLogs([]);
        setCurrentRole('USER');
        setTotalPages(1);
        setTotalItems(0);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [page, debouncedSearch]);

  const canManageAdmins = currentRole === 'SUPER_ADMIN';

  const stats = useMemo(() => {
    const activeRw = admins.filter((admin) => admin.adminScope === 'RW' && admin.status === 'ACTIVE').length;
    const activeRt = admins.filter((admin) => admin.adminScope === 'RT' && admin.status === 'ACTIVE').length;
    const inactive = admins.filter((admin) => admin.status === 'INACTIVE').length;
    return { activeRw, activeRt, inactive };
  }, [admins]);

  const filteredAdmins = useMemo(() => {
    const scoped = admins.filter((admin) => {
      if (activeTab === 'rw') return admin.adminScope === 'RW';
      if (activeTab === 'rt') return admin.adminScope === 'RT' && admin.status === 'ACTIVE';
      if (activeTab === 'inactive') return admin.status === 'INACTIVE';
      return true;
    });
    return scoped;
  }, [activeTab, admins]);

  function openEdit(admin: AdminUser) {
    setSelectedAdmin(admin);
    setEditName(admin.name);
    setIsEditOpen(true);
  }

  async function reloadLogs() {
    const response = await platformFetch<AdminLog[]>('/admin/admin-users/activity-logs?page=1&limit=8');
    setLogs(response.data);
  }

  async function handleEditSave() {
    if (!selectedAdmin) return;
    try {
      const res = await runWithToast(
        () => platformFetch<AdminUser>(`/admin/admin-users/${selectedAdmin.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ name: editName }),
        }),
        { loading: 'Menyimpan...', success: 'Profil admin diperbarui', error: 'Gagal memperbarui admin' },
      );
      setAdmins((prev) => prev.map((item) => (item.id === res.data.id ? res.data : item)));
      await reloadLogs();
      setIsEditOpen(false);
    } catch {
      return;
    }
  }

  async function handleResetPassword() {
    if (!selectedAdmin) return;
    try {
      const res = await runWithToast(
        () => platformFetch<{ userId: string; temporaryPassword: string }>(
          `/admin/admin-users/${selectedAdmin.id}/reset-password`,
          { method: 'POST' },
        ),
        { loading: 'Mereset password...', success: 'Password direset', error: 'Gagal mereset password' },
      );
      await reloadLogs();
      toast({
        title: 'Password sementara',
        description: res.data.temporaryPassword,
        variant: 'success',
        durationMs: 7000,
      });
      setIsResetOpen(false);
    } catch {
      return;
    }
  }

  async function handleDeactivate() {
    if (!selectedAdmin) return;
    try {
      const res = await runWithToast(
        () => platformFetch<AdminUser>(`/admin/admin-users/${selectedAdmin.id}/deactivate`, { method: 'POST' }),
        { loading: 'Menonaktifkan...', success: 'Akses admin dicabut', error: 'Gagal menonaktifkan admin' },
      );
      setAdmins((prev) => prev.map((item) => (item.id === res.data.id ? res.data : item)));
      await reloadLogs();
      setIsDeactivateOpen(false);
    } catch {
      return;
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#334155]">Hak Akses Admin</h1>
          <p className="mt-1 text-sm text-[#94A3B8]">
            Kelola admin RW dan admin RT dengan wilayah akses RT 01 sampai RT 03.
          </p>
        </div>
        <Button
          onClick={() => router.push('/admin/hak-akses/tambah')}
          disabled={!canManageAdmins}
          className="flex items-center gap-2 rounded-full bg-[#3B82F6] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#2563EB] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Tambah Pengguna
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] p-6 text-white shadow-lg">
          <div className="relative z-10">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-blue-100">Admin RW</p>
            <p className="mt-1 text-3xl font-bold">{stats.activeRw}</p>
            <p className="mt-1 text-xs text-blue-100">Akun utama seeded langsung ke database.</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#2563EB] p-6 text-white shadow-lg">
          <div className="relative z-10">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <Users className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-blue-100">Admin RT Aktif</p>
            <p className="mt-1 text-3xl font-bold">{stats.activeRt}</p>
            <p className="mt-1 text-xs text-blue-100">Admin RT dapat dibuat dan dicabut oleh Admin RW.</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#64748B] to-[#475569] p-6 text-white shadow-lg">
          <div className="relative z-10">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <UserX className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-slate-200">Akses Nonaktif</p>
            <p className="mt-1 text-3xl font-bold">{stats.inactive}</p>
            <p className="mt-1 text-xs text-slate-200">Riwayat akun tetap disimpan untuk audit.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-2 px-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTab(tab.key);
                setPage(1);
              }}
              className={cn(
                'rounded-xl px-4 py-2 text-sm font-semibold transition-all',
                activeTab === tab.key
                  ? 'border border-[#3B82F6] bg-[#EFF6FF] text-[#3B82F6]'
                  : 'text-[#94A3B8] hover:text-[#64748B]',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-56">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
          <Input
            type="text"
            placeholder="Cari admin..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border-[#E2E8F0] bg-[#F8FAFC] py-2 pl-9 pr-4 text-sm transition focus:border-[#3B82F6] focus:bg-white"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
        <Table className="w-full text-sm">
          <TableHeader>
            <TableRow className="bg-[#3B82F6] hover:bg-[#3B82F6]">
              <TableHead className="h-auto px-5 py-3.5 text-left font-semibold text-white">Pengguna</TableHead>
              <TableHead className="h-auto px-5 py-3.5 text-left font-semibold text-white">Peran</TableHead>
              <TableHead className="h-auto px-5 py-3.5 text-left font-semibold text-white">Dibuat</TableHead>
              <TableHead className="h-auto px-5 py-3.5 text-left font-semibold text-white">Status</TableHead>
              <TableHead className="h-auto px-5 py-3.5 text-center font-semibold text-white">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAdmins.map((admin) => {
              const isRwAdmin = admin.adminScope === 'RW';
              const canEdit = canManageAdmins && !isRwAdmin;
              return (
                <TableRow key={admin.id} className="border-b border-[#F1F5F9] transition-colors hover:bg-[#F8FAFC]">
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white',
                          avatarColor(admin.id),
                        )}
                      >
                        {admin.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-[#1E293B]">{admin.displayName}</p>
                        <p className="text-xs text-[#94A3B8]">{admin.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold',
                        getRoleStyle(admin.adminScope),
                      )}
                    >
                      {admin.roleLabel}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-[#64748B]">
                    {new Date(admin.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
                        admin.status === 'ACTIVE' ? 'bg-[#F0FDF4] text-[#16A34A]' : 'bg-[#FEF2F2] text-[#DC2626]',
                      )}
                    >
                      <span
                        className={cn(
                          'h-1.5 w-1.5 rounded-full',
                          admin.status === 'ACTIVE' ? 'bg-[#16A34A]' : 'bg-[#DC2626]',
                        )}
                      />
                      {admin.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={!canEdit}
                        onClick={() => openEdit(admin)}
                        className="h-8 w-8 rounded-lg text-[#94A3B8] hover:bg-[#EFF6FF] hover:text-[#3B82F6] disabled:opacity-40"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={!canEdit}
                        onClick={() => {
                          setSelectedAdmin(admin);
                          setIsResetOpen(true);
                        }}
                        className="h-8 w-8 rounded-lg text-[#94A3B8] hover:bg-[#FFFBEB] hover:text-[#D97706] disabled:opacity-40"
                        title="Reset Password"
                      >
                        <KeyRound className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={!canEdit}
                        onClick={() => {
                          setSelectedAdmin(admin);
                          setIsDeactivateOpen(true);
                        }}
                        className="h-8 w-8 rounded-lg text-[#94A3B8] hover:bg-[#FEF2F2] hover:text-[#DC2626] disabled:opacity-40"
                        title="Nonaktifkan"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}

            {filteredAdmins.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="px-6 py-16 text-center text-[#94A3B8]">
                  Tidak ada admin yang cocok dengan filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between border-t border-gray-100 bg-white/60 px-5 py-3 text-[#64748B]">
          <span className="text-sm">
            Menampilkan {filteredAdmins.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, totalItems)} dari {totalItems} admin
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              disabled={page === 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white/80 text-sm text-[#1E293B] transition hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-[#1E293B]">Halaman {page} / {totalPages}</span>
            <Button
              variant="ghost"
              size="icon"
              disabled={page >= totalPages}
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white/80 text-sm text-[#1E293B] transition hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-[#1E293B]">Riwayat Aksi Admin</h2>
          <p className="text-sm text-[#64748B]">Setiap perubahan menyimpan siapa pelaku aksinya.</p>
        </div>
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <p className="text-sm font-semibold text-[#1E293B]">
                {log.actorName} [{log.actorRoleLabel}] {describeAction(log.action)}
              </p>
              <p className="mt-1 text-sm text-[#64748B]">
                Target: {formatLogTarget(log)} | {log.actorEmail}
              </p>
              <p className="mt-1 text-xs text-[#94A3B8]">
                {new Date(log.createdAt).toLocaleString('id-ID')}
              </p>
            </div>
          ))}
          {logs.length === 0 && <p className="text-sm text-[#94A3B8]">Belum ada aktivitas admin.</p>}
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#1E293B]">Edit Profil Admin RT</DialogTitle>
          </DialogHeader>
          <div className="mt-4 flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#1E293B]">Nama Lengkap</label>
              <Input
                type="text"
                value={editName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditName(e.target.value)}
                className="w-full rounded-xl border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-sm focus:border-[#3B82F6] focus:bg-white"
              />
            </div>
            <Button
              onClick={() => void handleEditSave()}
              disabled={!canManageAdmins || editName.trim().length < 2}
              className="mt-2 rounded-xl bg-[#3B82F6] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#2563EB] disabled:opacity-50"
            >
              Simpan Perubahan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#1E293B]">Reset Password</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <p className="text-sm text-[#475569]">
              Reset password untuk <strong>{selectedAdmin?.displayName}</strong>.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsResetOpen(false)} className="rounded-xl px-4 py-2 text-sm font-semibold">
                Batal
              </Button>
              <Button
                onClick={() => void handleResetPassword()}
                disabled={!canManageAdmins}
                className="rounded-xl bg-[#D97706] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#B45309] disabled:opacity-50"
              >
                Ya, Reset Password
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeactivateOpen} onOpenChange={setIsDeactivateOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#DC2626]">Nonaktifkan Admin RT</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <p className="text-sm text-[#475569]">
              Anda akan mencabut hak akses dari <strong>{selectedAdmin?.displayName}</strong>.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsDeactivateOpen(false)} className="rounded-xl px-4 py-2 text-sm font-semibold">
                Batal
              </Button>
              <Button
                onClick={() => void handleDeactivate()}
                disabled={!canManageAdmins}
                className="rounded-xl bg-[#DC2626] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#B91C1C] disabled:opacity-50"
              >
                Nonaktifkan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
