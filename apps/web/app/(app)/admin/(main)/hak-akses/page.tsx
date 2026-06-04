'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  ShieldCheck,
  Users,
  UserX,
  Edit,
  Trash2,
  KeyRound,
  ChevronLeft,
  ChevronRight,
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
  role: 'ADMIN' | 'USER';
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
};

const TABS = [
  { key: 'all', label: 'Semua Pengguna' },
  { key: 'ADMIN', label: 'Admin Utama' },
  { key: 'RT', label: 'Admin RT' },
  { key: 'RW', label: 'Admin RW' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

/* ── Role badge colors ────────────────────────────────────── */
const ROLE_STYLES: Record<string, string> = {
  ADMIN: 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]',
  'Admin RW': 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]',
  'Admin RT': 'bg-[#FFF7ED] text-[#EA580C] border-[#FED7AA]',
  USER: 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]',
};

function getRoleLabel(role: string) {
  if (role === 'ADMIN') return 'Admin Utama';
  return role;
}

/* ── Avatar colour palette ────────────────────────────────── */
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

export default function HakAksesPage() {
  const router = useRouter();
  const { runWithToast, toast } = useActionToast();

  /* ── State ──────────────────────────────────────────────── */
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  /* Modals */
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);

  /* ── Debounce search ────────────────────────────────────── */
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 600);
    return () => clearTimeout(t);
  }, [searchQuery]);

  /* ── Fetch data ─────────────────────────────────────────── */
  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
        if (debouncedSearch) params.set('q', debouncedSearch);
        const response = await platformFetch<AdminUser[]>(`/admin/admin-users?${params.toString()}`);
        if (!active) return;
        setAdmins(response.data);
        setTotalPages(response.meta?.totalPages ?? 1);
        setTotalItems(response.meta?.total ?? response.data.length);
      } catch {
        if (!active) return;
        setAdmins([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    }

    void load();
    return () => { active = false; };
  }, [page, debouncedSearch]);

  /* ── Derived counts ─────────────────────────────────────── */
  const adminUtamaCount = admins.filter((a) => a.role === 'ADMIN' && a.status === 'ACTIVE').length;
  const adminRTCount = admins.filter((a) => a.role === 'USER' && a.status === 'ACTIVE').length; // placeholder
  const inactiveCount = admins.filter((a) => a.status === 'INACTIVE').length;

  /* ── Filtered list ──────────────────────────────────────── */
  const filtered = activeTab === 'all'
    ? admins
    : activeTab === 'ADMIN'
      ? admins.filter((a) => a.role === 'ADMIN')
      : admins; // RT / RW tabs use same data for now

  /* ── Handlers ───────────────────────────────────────────── */
  const openEdit = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setEditName(admin.name);
    setIsEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!selectedAdmin) return;
    try {
      const res = await runWithToast(
        () => platformFetch<AdminUser>(`/admin/admin-users/${selectedAdmin.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ name: editName }),
        }),
        { loading: 'Menyimpan...', success: 'Berhasil diperbarui', error: 'Gagal memperbarui' },
      );
      setAdmins((prev) => prev.map((a) => (a.id === res.data.id ? res.data : a)));
      setIsEditOpen(false);
    } catch { /* handled by toast */ }
  };

  const handleResetPassword = async () => {
    if (!selectedAdmin) return;
    try {
      const res = await runWithToast(
        () => platformFetch<{ userId: string; temporaryPassword: string }>(
          `/admin/admin-users/${selectedAdmin.id}/reset-password`,
          { method: 'POST' },
        ),
        { loading: 'Mereset password...', success: 'Password direset', error: 'Gagal mereset' },
      );
      toast({ title: 'Password sementara', description: res.data.temporaryPassword, variant: 'success', durationMs: 7000 });
      setIsResetOpen(false);
    } catch { /* handled */ }
  };

  const handleDeactivate = async () => {
    if (!selectedAdmin) return;
    try {
      const res = await runWithToast(
        () => platformFetch<AdminUser>(
          `/admin/admin-users/${selectedAdmin.id}/deactivate`,
          { method: 'POST' },
        ),
        { loading: 'Menonaktifkan...', success: 'Admin dinonaktifkan', error: 'Gagal menonaktifkan' },
      );
      setAdmins((prev) => prev.map((a) => (a.id === res.data.id ? res.data : a)));
      setIsDeactivateOpen(false);
    } catch { /* handled */ }
  };

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div className="flex flex-col gap-6">
      {/* ─── Page Header ─────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#334155]">Management Pengguna</h1>
          <p className="mt-1 text-sm text-[#94A3B8]">
            Kelola hak akses pengguna sistem informasi RW 25
          </p>
        </div>
        <Button
          onClick={() => router.push('/admin/hak-akses/tambah')}
          className="flex items-center gap-2 rounded-full bg-[#3B82F6] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#2563EB]"
        >
          <Plus className="h-4 w-4" />
          Tambah Pengguna
        </Button>
      </div>

      {/* ─── Stat Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* Card 1: Admin Utama */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#2563EB] p-6 text-white shadow-lg">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -right-6 h-32 w-32 rounded-full bg-white/5" />
          <div className="relative z-10">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-blue-100">Admin Utama</p>
            <p className="mt-1 text-3xl font-bold">
              {adminUtamaCount} <span className="text-base font-medium text-blue-200">Akun</span>
            </p>
          </div>
        </div>

        {/* Card 2: Admin RT/RW */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#2563EB] p-6 text-white shadow-lg">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -right-6 h-32 w-32 rounded-full bg-white/5" />
          <div className="relative z-10">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <Users className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-blue-100">Admin RT/RW</p>
            <p className="mt-1 text-3xl font-bold">
              {adminRTCount} <span className="text-base font-medium text-blue-200">Akun</span>
            </p>
          </div>
        </div>

        {/* Card 3: Non-Aktif */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#2563EB] p-6 text-white shadow-lg">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -right-6 h-32 w-32 rounded-full bg-white/5" />
          <div className="relative z-10">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <UserX className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-blue-100">Akun Non-Aktif</p>
            <p className="mt-1 text-3xl font-bold">
              {inactiveCount} <span className="text-base font-medium text-blue-200">Akun</span>
            </p>
          </div>
        </div>
      </div>

      {/* ─── Tab Navigation + Filter ─────────────────────── */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-2 px-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => { setActiveTab(tab.key); setPage(1); }}
              className={cn(
                'rounded-xl px-4 py-2 text-sm font-semibold transition-all',
                activeTab === tab.key
                  ? 'rounded-xl border border-[#3B82F6] bg-[#EFF6FF] text-[#3B82F6]'
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
              placeholder="Cari pengguna..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border-[#E2E8F0] bg-[#F8FAFC] py-2 pl-9 pr-4 text-sm transition focus:border-[#3B82F6] focus:bg-white"
            />
          </div>
      </div>

      {/* ─── User Table ──────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
        <Table className="w-full text-sm">
          <TableHeader>
            <TableRow className="bg-[#3B82F6] hover:bg-[#3B82F6]">
              <TableHead className="h-auto px-5 py-3.5 text-left font-semibold text-white">
                Pengguna
              </TableHead>
              <TableHead className="h-auto px-5 py-3.5 text-left font-semibold text-white">
                Role
              </TableHead>
              <TableHead className="h-auto px-5 py-3.5 text-left font-semibold text-white">
                Terakhir Login
              </TableHead>
              <TableHead className="h-auto px-5 py-3.5 text-left font-semibold text-white">
                Status
              </TableHead>
              <TableHead className="h-auto px-5 py-3.5 text-center font-semibold text-white">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((admin) => (
              <TableRow
                key={admin.id}
                className="border-b border-[#F1F5F9] transition-colors hover:bg-[#F8FAFC]"
              >
                {/* ── User cell ── */}
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
                      <p className="font-semibold text-[#1E293B]">{admin.name}</p>
                      <p className="text-xs text-[#94A3B8]">{admin.email}</p>
                    </div>
                  </div>
                </TableCell>

                {/* ── Role badge ── */}
                <TableCell className="px-6 py-4">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold',
                      ROLE_STYLES[admin.role] ?? ROLE_STYLES['USER'],
                    )}
                  >
                    {getRoleLabel(admin.role)}
                  </span>
                </TableCell>

                {/* ── Last login ── */}
                <TableCell className="px-6 py-4 text-sm text-[#64748B]">
                  {new Date(admin.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </TableCell>

                {/* ── Status badge ── */}
                <TableCell className="px-6 py-4">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
                      admin.status === 'ACTIVE'
                        ? 'bg-[#F0FDF4] text-[#16A34A]'
                        : 'bg-[#FEF2F2] text-[#DC2626]',
                    )}
                  >
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        admin.status === 'ACTIVE' ? 'bg-[#16A34A]' : 'bg-[#DC2626]',
                      )}
                    />
                    {admin.status === 'ACTIVE' ? 'Aktif' : 'Non Aktif'}
                  </span>
                </TableCell>

                {/* ── Actions ── */}
                <TableCell className="px-6 py-4">
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(admin)}
                      className="h-8 w-8 rounded-lg text-[#94A3B8] hover:bg-[#EFF6FF] hover:text-[#3B82F6]"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { setSelectedAdmin(admin); setIsResetOpen(true); }}
                      className="h-8 w-8 rounded-lg text-[#94A3B8] hover:bg-[#FFFBEB] hover:text-[#D97706]"
                      title="Reset Password"
                    >
                      <KeyRound className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { setSelectedAdmin(admin); setIsDeactivateOpen(true); }}
                      className="h-8 w-8 rounded-lg text-[#94A3B8] hover:bg-[#FEF2F2] hover:text-[#DC2626]"
                      title="Nonaktifkan"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="px-6 py-16 text-center text-[#94A3B8]">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-10 w-10 text-[#CBD5E1]" />
                    <p className="font-medium">Tidak ada pengguna ditemukan</p>
                    <p className="text-xs">Coba ubah kata kunci pencarian</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* ── Pagination Footer ───────────────────────────── */}
        <div className="flex items-center justify-between border-t border-gray-100 bg-white/60 backdrop-blur-xl px-5 py-3 text-[#64748B]">
          <span className="text-sm">
            Menampilkan {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} –{' '}
            {Math.min(page * PAGE_SIZE, totalItems)} dari {totalItems} Pengguna
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white/80 text-sm text-[#1E293B] transition hover:bg-gray-100 disabled:opacity-50"
            >
              &lt;
            </Button>
            <span className="text-sm font-medium text-[#1E293B]">Halaman {page} / {totalPages}</span>
            <Button
              variant="ghost"
              size="icon"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white/80 text-sm text-[#1E293B] transition hover:bg-gray-100 disabled:opacity-50"
            >
              &gt;
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Edit Modal ──────────────────────────────────── */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#1E293B]">Edit Profil Pengguna</DialogTitle>
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
              className="mt-2 rounded-xl bg-[#3B82F6] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#2563EB]"
            >
              Simpan Perubahan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Reset Password Modal ────────────────────────── */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#1E293B]">Reset Password</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <p className="text-sm text-[#475569]">
              Reset password untuk <strong>{selectedAdmin?.name}</strong>.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsResetOpen(false)}
                className="rounded-xl px-4 py-2 text-sm font-semibold"
              >
                Batal
              </Button>
              <Button
                onClick={() => void handleResetPassword()}
                className="rounded-xl bg-[#D97706] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#B45309]"
              >
                Ya, Reset Password
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Deactivate Modal ────────────────────────────── */}
      <Dialog open={isDeactivateOpen} onOpenChange={setIsDeactivateOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#DC2626]">Non-aktifkan Pengguna</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <p className="text-sm text-[#475569]">
              Anda akan mencabut hak akses dari <strong>{selectedAdmin?.name}</strong>.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsDeactivateOpen(false)}
                className="rounded-xl px-4 py-2 text-sm font-semibold"
              >
                Batal
              </Button>
              <Button
                onClick={() => void handleDeactivate()}
                className="rounded-xl bg-[#DC2626] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#B91C1C]"
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
