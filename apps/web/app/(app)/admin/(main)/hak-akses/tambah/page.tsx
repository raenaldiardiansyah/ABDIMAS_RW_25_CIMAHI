'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, ChevronRight, Shield } from 'lucide-react';

import { platformFetch } from '@/lib/api/platform';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useActionToast } from '@/lib/use-action-toast';

const RT_OPTIONS = ['01', '02', '03'] as const;
const ACCESS_SCOPE_OPTIONS = [
  {
    value: 'RT' as const,
    title: 'Admin RT/RW',
    description: 'Pilih satu atau lebih RT yang boleh dikelola pengguna ini.',
  },
  {
    value: 'RW' as const,
    title: 'Admin RW',
    description: 'Akses penuh tingkat RW tanpa pilihan RT terpisah.',
  },
] as const;

type AccessScope = (typeof ACCESS_SCOPE_OPTIONS)[number]['value'];

type CreateAdminResponse = {
  id: string;
  displayName: string;
};

function StepItem({
  number,
  label,
  active,
}: {
  number: number;
  label: string;
  active?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 text-sm font-semibold">
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full border text-sm',
          active ? 'border-[#4F6EF7] text-[#4F6EF7]' : 'border-[#C7D2FE] text-[#A5B4FC]',
        )}
      >
        {number}
      </div>
      <span className={active ? 'text-[#4F6EF7]' : 'text-[#A5B4FC]'}>{label}</span>
    </div>
  );
}

export default function TambahPenggunaPage() {
  const router = useRouter();
  const { runWithToast } = useActionToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [accessScope, setAccessScope] = useState<AccessScope>('RT');
  const [managedRtCodes, setManagedRtCodes] = useState<string[]>(['01']);
  const [submitting, setSubmitting] = useState(false);

  const visibleRtCodes = useMemo(() => (accessScope === 'RT' ? managedRtCodes : []), [accessScope, managedRtCodes]);
  const canSubmit = name.trim().length >= 2 && email.trim().length > 0 && (accessScope === 'RW' || visibleRtCodes.length > 0);

  const rolePreview = useMemo(() => {
    if (accessScope === 'RW') return 'Admin RW';
    return visibleRtCodes.length > 0 ? `Admin RT ${visibleRtCodes.map((code) => `RT ${code}`).join(', ')}` : 'Admin RT';
  }, [accessScope, visibleRtCodes]);

  const displayPreview = useMemo(() => {
    const trimmed = name.trim() || 'Nama Pengguna';
    return `${trimmed} [${rolePreview}]`;
  }, [name, rolePreview]);

  function toggleRtCode(rtCode: string) {
    setManagedRtCodes((current) => {
      if (current.includes(rtCode)) {
        return current.filter((item) => item !== rtCode);
      }
      return [...current, rtCode].sort();
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || !canSubmit) return;

    setSubmitting(true);
    try {
      await runWithToast(
        () =>
          platformFetch<CreateAdminResponse>('/admin/admin-users', {
            method: 'POST',
            body: JSON.stringify({
              name: name.trim(),
              email: email.trim().toLowerCase(),
              accessScope,
              managedRtCodes: visibleRtCodes,
            }),
          }),
        {
          loading: 'Menyimpan pengguna...',
          success: 'Hak akses berhasil dibuat',
          error: 'Gagal membuat hak akses',
        },
      );
      router.push('/admin/hak-akses');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 pb-6">
      <div className="flex items-center justify-between gap-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push('/admin/hak-akses')}
          className="flex items-center gap-3 rounded-full px-0 text-[20px] font-semibold text-[#4F6EF7] hover:bg-transparent hover:text-[#3E5BE0]"
        >
          <ArrowLeft className="h-6 w-6" />
          Keluar Halaman
        </Button>

        <div className="flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-5 py-3 text-sm font-semibold text-[#4F6EF7]">
          <Shield className="h-4 w-4" />
          Draft
        </div>
      </div>

      <section className="rounded-[28px] bg-[#F5F7FF] p-6 md:p-8">
        <h1 className="text-3xl font-bold text-[#4F6EF7]">Tambah Pengguna</h1>
        <p className="mt-2 text-sm text-[#8EA2FF]">
          Isi data identitas dan tentukan wilayah akses. Opsi RT hanya tersedia sampai RT 03.
        </p>

        <div className="mt-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-center">
          <StepItem number={1} label="Identitas" active />
          <div className="hidden h-px w-28 bg-[#4F6EF7] md:block" />
          <StepItem number={2} label="Peran & Hak" active />
          <div className="hidden h-px w-28 bg-[#4F6EF7] md:block" />
          <StepItem number={3} label="Konfirmasi" active />
        </div>
      </section>

      <section className="flex items-start gap-3 rounded-[20px] bg-[#EEF3FF] px-5 py-4">
        <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#4F6EF7]" />
        <div>
          <p className="text-base font-bold text-[#4F6EF7]">Keamanan Sistem.</p>
          <p className="text-sm text-[#5B74F8]">Berikan akses hanya kepada petugas yang berwenang.</p>
        </div>
      </section>

      <section className="rounded-[28px] border border-[#E5E7EB] bg-white p-6 md:p-8">
        <h2 className="text-[22px] font-bold text-[#3F3F46]">Identitas</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-[#3F3F46]">Nama Lengkap*</label>
            <Input
              type="text"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              placeholder="Sesuai dengan identitas resmi"
              className="h-14 rounded-2xl border-[#E5E7EB] px-5 text-base"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-[#3F3F46]">Email Pengguna*</label>
            <Input
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              placeholder="Contoh: admin@rw25.test"
              className="h-14 rounded-2xl border-[#E5E7EB] px-5 text-base"
            />
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-[#E5E7EB] bg-white p-6 md:p-8">
        <h2 className="text-[22px] font-bold text-[#3F3F46]">Peran Pengguna</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {ACCESS_SCOPE_OPTIONS.map((option) => {
            const selected = accessScope === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setAccessScope(option.value)}
                className={cn(
                  'rounded-2xl border px-5 py-5 text-left transition',
                  selected ? 'border-[#4F6EF7] bg-[#EEF3FF] shadow-[0_0_0_1px_rgba(79,110,247,0.15)]' : 'border-[#E5E7EB] bg-white',
                )}
              >
                <p className={cn('text-base font-bold', selected ? 'text-[#4F6EF7]' : 'text-[#B7BEF4]')}>{option.title}</p>
                <p className={cn('mt-1 text-sm', selected ? 'text-[#5B74F8]' : 'text-[#B7BEF4]')}>{option.description}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-[28px] border border-[#E5E7EB] bg-white p-6 md:p-8">
        <h2 className="text-[22px] font-bold text-[#3F3F46]">Wilayah Akses</h2>
        {accessScope === 'RW' ? (
          <p className="mt-4 text-sm text-[#94A3B8]">Admin RW mendapat akses penuh tingkat RW, jadi opsi RT tidak ditampilkan.</p>
        ) : (
          <>
            <div className="mt-6 flex flex-wrap gap-3">
              {RT_OPTIONS.map((rtCode) => {
                const active = managedRtCodes.includes(rtCode);
                return (
                  <button
                    key={rtCode}
                    type="button"
                    onClick={() => toggleRtCode(rtCode)}
                    className={cn(
                      'min-w-24 rounded-full border px-5 py-2 text-sm font-bold transition',
                      active ? 'border-[#4F6EF7] bg-[#EEF3FF] text-[#4F6EF7]' : 'border-[#E5E7EB] bg-white text-[#B0B5C8]',
                    )}
                  >
                    RT {rtCode}
                  </button>
                );
              })}
            </div>
            <p className="mt-4 text-sm text-[#A1A1AA]">Klik untuk aktifkan/nonaktifkan wilayah yang bisa diakses pengguna ini.</p>
          </>
        )}
      </section>

      <section className="rounded-[28px] border border-[#E5E7EB] bg-[#FCFCFF] p-6 md:p-8">
        <h2 className="text-[22px] font-bold text-[#3F3F46]">Konfirmasi</h2>
        <div className="mt-5 grid gap-4 text-sm text-[#52525B] md:grid-cols-2">
          <div>
            <p className="font-semibold text-[#3F3F46]">Nama Tampil</p>
            <p className="mt-1">{displayPreview}</p>
          </div>
          <div>
            <p className="font-semibold text-[#3F3F46]">Hak Akses</p>
            <p className="mt-1">{rolePreview}</p>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/hak-akses')}
          className="h-14 rounded-full border-[#E5E7EB] px-8 text-base font-semibold text-[#8EA2FF]"
        >
          Kembali
        </Button>
        <Button
          type="submit"
          disabled={!canSubmit || submitting}
          className="h-14 rounded-full bg-[#4F6EF7] px-8 text-base font-bold text-white hover:bg-[#3E5BE0] disabled:opacity-50"
        >
          <span>{submitting ? 'Menyimpan...' : 'Tambahkan Pengguna'}</span>
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </form>
  );
}
