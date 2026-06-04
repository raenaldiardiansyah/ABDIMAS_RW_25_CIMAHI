'use client';

import { useCallback, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  Eye,
  EyeOff,
  Info,
  Save,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useActionToast } from '@/lib/use-action-toast';

/* ── Constants ── */

const STEPS = [
  { id: 1, label: 'Identitas' },
  { id: 2, label: 'Peran & Hak' },
  { id: 3, label: 'Konfirmasi' },
] as const;

const RT_LIST = ['RT 01', 'RT 02', 'RT 03', 'RT 04', 'RT 05'] as const;

const JABATAN_OPTIONS = [
  { label: 'Ketua RW', value: 'ketua_rw' },
  { label: 'Wakil Ketua RW', value: 'wakil_rw' },
  { label: 'Sekretaris RW', value: 'sekretaris_rw' },
  { label: 'Bendahara RW', value: 'bendahara_rw' },
  { label: 'Ketua RT', value: 'ketua_rt' },
  { label: 'Sekretaris RT', value: 'sekretaris_rt' },
];

/* ── Types ── */

type FormData = {
  namaLengkap: string;
  jabatan: string;
  email: string;
  phone: string;
  password: string;
  passwordConfirm: string;
  role: 'ADMIN_RT' | 'ADMIN_UTAMA';
  selectedRT: string[];
};

const INITIAL_FORM: FormData = {
  namaLengkap: '',
  jabatan: '',
  email: '',
  phone: '',
  password: '',
  passwordConfirm: '',
  role: 'ADMIN_RT',
  selectedRT: ['RT 01', 'RT 02'],
};

/* ── Component ── */

export default function TambahPenggunaPage() {
  const router = useRouter();
  const { toast } = useActionToast();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({ ...INITIAL_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [hasDraft, setHasDraft] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('draft_tambah_pengguna');
    if (saved) setHasDraft(true);
  }, []);

  const set = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    },
    [],
  );

  /* ── Validation per step ── */
  const validateStep = (s: number): boolean => {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (s === 1) {
      if (!form.namaLengkap.trim()) errs.namaLengkap = 'Nama lengkap wajib diisi';
      if (!form.email.trim()) errs.email = 'Email wajib diisi';
      if (form.password.length < 8) errs.password = 'Password minimal 8 karakter';
      if (form.password !== form.passwordConfirm) errs.passwordConfirm = 'Password tidak cocok';
    }
    if (s === 2) {
      if (!form.role) errs.role = 'Pilih peran pengguna';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(s + 1, 3));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleSaveDraft = () => {
    localStorage.setItem('draft_tambah_pengguna', JSON.stringify({ step, form }));
    setHasDraft(true);
    toast({
      title: 'Draft tersimpan',
      description: 'Draft data pengguna berhasil disimpan di browser ini.',
      variant: 'success',
    });
  };

  const handleLoadDraft = () => {
    try {
      const saved = localStorage.getItem('draft_tambah_pengguna');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.form) setForm(parsed.form);
        if (parsed.step) setStep(parsed.step);
      }
      setShowDraftModal(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteDraft = () => {
    localStorage.removeItem('draft_tambah_pengguna');
    setHasDraft(false);
    setShowDraftModal(false);
    setForm({ ...INITIAL_FORM });
    setStep(1);
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      // TODO: Submit to API
      localStorage.removeItem('draft_tambah_pengguna');
      toast({ title: 'Berhasil', description: 'Pengguna berhasil ditambahkan', variant: 'success' });
      router.push('/admin/hak-akses');
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleRT = (rt: string) => {
    setForm((prev) => ({
      ...prev,
      selectedRT: prev.selectedRT.includes(rt)
        ? prev.selectedRT.filter((r) => r !== rt)
        : [...prev.selectedRT, rt],
    }));
  };

  /* ── Input helpers (consistent with data-penduduk) ── */
  const inputClass = (key?: keyof FormData) =>
    `h-11 w-full rounded-xl border bg-white px-4 text-sm text-[#1E293B] outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 ${
      key && errors[key] ? 'border-red-400' : 'border-gray-200'
    }`;

  const selectClass = (key?: keyof FormData) =>
    `h-11 w-full appearance-none rounded-xl border bg-white px-4 pr-10 text-sm text-[#1E293B] outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 bg-no-repeat bg-[position:right_1rem_center] bg-[length:1.25rem_1.25rem] bg-[url("data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20fill='none'%20viewBox='0%200%2024%2024'%20stroke='%232563EB'%3e%3cpath%20stroke-linecap='round'%20stroke-linejoin='round'%20stroke-width='2'%20d='M6%209l6%206%206-6'/%3e%3c/svg%3e")] ${
      key && errors[key] ? 'border-red-400' : 'border-gray-200'
    }`;

  const labelClass = 'mb-1.5 block text-sm font-semibold text-[#1E293B]';
  const errorClass = 'mt-1 text-xs text-red-500';

  return (
    <div className="flex flex-col gap-5">
      {/* ── Back + Draft ── */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowExitModal(true)}
          className="flex items-center gap-2 border-none bg-transparent text-[16px] font-[600] text-[#2563EB] outline-none transition hover:opacity-80"
        >
          <ChevronLeft className="h-5 w-5" />
          Keluar Halaman
        </button>
        <Button
          onClick={() => {
            if (hasDraft) {
              setShowDraftModal(true);
              return;
            }
            toast({
              title: 'Belum ada draft',
              description: 'Simpan draft terlebih dahulu untuk membukanya kembali.',
              variant: 'destructive',
            });
          }}
          className="relative flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-[#1E293B] transition hover:bg-gray-50"
        >
          <Save className="h-4 w-4 text-[#3B82F6]" />
          Draft
          {hasDraft && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-red-500" />}
        </Button>
      </div>

      {/* ── Title & Stepper Card ── */}
      <div className="relative overflow-hidden rounded-[12px] bg-[#EEF2FF] p-6">
        <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-[#3B82F6]/[0.05]" />
        <div className="pointer-events-none absolute right-12 top-2 h-24 w-24 rounded-full bg-[#3B82F6]/[0.08]" />

        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-[#3B82F6]">Tambah Pengguna</h1>
          <p className="mt-1 text-sm text-[#3B82F6]/80">
            Isi semua field wajib bertanda bintang merah. Data akan tersimpan ke modul Kelola Hak Akses
          </p>
        </div>

        <div className="relative z-10 mt-8 flex w-full items-center justify-between">
          {STEPS.map((s, i) => {
            const isActive = step === s.id;
            const isCompleted = step > s.id;
            const isCurrentOrCompleted = isActive || isCompleted;

            const circleStyle = isCurrentOrCompleted
              ? 'bg-transparent text-[#2563EB] border-[1.5px] border-[#2563EB]'
              : 'bg-[#EEF0FD] text-[#7C8FE8] border-[1.5px] border-[#C5CFFB]';

            const labelStyle = isCurrentOrCompleted
              ? 'text-[#2563EB] font-[600]'
              : 'text-[#7C8FE8] font-[400]';

            return (
              <div key={s.id} className={`flex items-center ${i < STEPS.length - 1 ? 'flex-1' : ''}`}>
                <button
                  type="button"
                  onClick={() => {
                    if (s.id < step) setStep(s.id);
                  }}
                  className="flex items-center gap-3 outline-none"
                >
                  <div
                    className={`flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${circleStyle}`}
                  >
                    {s.id}
                  </div>
                  <span
                    className={`whitespace-nowrap text-sm transition-colors ${labelStyle}`}
                  >
                    {s.label}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <div
                    className={`mx-4 h-[1px] flex-1 rounded-full transition-colors ${
                      isCompleted ? 'bg-[#2563EB]' : 'bg-[#C5CFFB]'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Info Banner ── */}
      <div className="mt-6 flex items-center gap-3 rounded-[12px] border border-blue-100 bg-[#EEF2FF] px-6 py-4">
        <CheckCircle2 className="h-5 w-5 text-[#3B82F6]" />
        <div>
          <p className="text-sm font-bold text-[#3B82F6]">Keamanan Sistem.</p>
          <p className="text-sm text-[#3B82F6]/80">Pastikan Anda hanya memberikan akses kepada petugas yang berwenang.</p>
        </div>
      </div>

      {/* ── Form Card ── */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        {/* STEP 1: Identitas */}
        {step === 1 && (
          <div>
            <h2 className="mb-5 text-xl font-bold text-[#1E293B]">Identitas</h2>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Nama Lengkap */}
              <div>
                <label className={labelClass}>Nama Lengkap<span className="text-red-500">*</span></label>
                <Input
                  type="text"
                  value={form.namaLengkap}
                  onChange={(e: any) => set('namaLengkap', e.target.value)}
                  placeholder="Sesuai dengan Identitas Resmi"
                  className={inputClass('namaLengkap')}
                />
                {errors.namaLengkap && <p className={errorClass}>{errors.namaLengkap}</p>}
              </div>

              {/* Jabatan Resmi */}
              <div>
                <label className={labelClass}>Jabatan Resmi<span className="text-red-500">*</span></label>
                <select
                  value={form.jabatan}
                  onChange={(e: any) => set('jabatan', e.target.value)}
                  className={selectClass('jabatan')}
                >
                  <option value="">Pilih Jabatan</option>
                  {JABATAN_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Email */}
              <div>
                <label className={labelClass}>Email Pengguna<span className="text-red-500">*</span></label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e: any) => set('email', e.target.value)}
                  placeholder="Contoh: user@gmail.com"
                  className={inputClass('email')}
                />
                {errors.email && <p className={errorClass}>{errors.email}</p>}
              </div>

              {/* Nomor Handphone with +62 prefix */}
              <div>
                <label className={labelClass}>Nomor Handphone<span className="text-red-500">*</span></label>
                <div className="flex">
                  <div className="flex h-11 items-center justify-center rounded-l-xl border border-r-0 border-gray-200 bg-[#F0F5FF] px-3.5 text-sm font-semibold text-[#2563EB]">
                    +62
                  </div>
                  <Input
                    type="tel"
                    value={form.phone.replace(/(\d{4})(?=\d)/g, '$1 - ')}
                    onChange={(e: any) => {
                      const raw = e.target.value.replace(/\D/g, '').slice(0, 12);
                      set('phone', raw);
                    }}
                    placeholder="xxx - xxxx - xxx"
                    className="h-11 w-full rounded-l-none rounded-r-xl border border-gray-200 bg-white px-4 text-sm text-[#1E293B] outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="md:col-span-2">
                <label className={labelClass}>Password Email<span className="text-red-500">*</span></label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e: any) => set('password', e.target.value)}
                    placeholder="Min. 8 Karakter"
                    className={`${inputClass('password')} pr-10`}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B]"
                  >
                    {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className={errorClass}>{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div className="md:col-span-2">
                <label className={labelClass}>Konfirmasi Password<span className="text-red-500">*</span></label>
                <div className="relative">
                  <Input
                    type={showPasswordConfirm ? 'text' : 'password'}
                    value={form.passwordConfirm}
                    onChange={(e: any) => set('passwordConfirm', e.target.value)}
                    placeholder="Min. 8 Karakter"
                    className={`${inputClass('passwordConfirm')} pr-10`}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B]"
                  >
                    {showPasswordConfirm ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </div>
                {errors.passwordConfirm && <p className={errorClass}>{errors.passwordConfirm}</p>}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Peran & Hak */}
        {step === 2 && (
          <div>
            <h2 className="mb-5 text-xl font-bold text-[#1E293B]">Peran Pengguna</h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Admin RT/RW */}
              <button
                type="button"
                onClick={() => set('role', 'ADMIN_RT')}
                className={cn(
                  'flex items-center justify-center gap-3 rounded-2xl border-2 px-6 py-4 text-sm font-semibold transition-all',
                  form.role === 'ADMIN_RT'
                    ? 'border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]'
                    : 'border-gray-200 bg-white text-[#94A3B8] hover:border-gray-300',
                )}
              >
                <Users className="h-5 w-5" />
                Admin RT/RW
              </button>

              {/* Admin Utama */}
              <button
                type="button"
                onClick={() => set('role', 'ADMIN_UTAMA')}
                className={cn(
                  'flex items-center justify-center gap-3 rounded-2xl border-2 px-6 py-4 text-sm font-semibold transition-all',
                  form.role === 'ADMIN_UTAMA'
                    ? 'border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]'
                    : 'border-gray-200 bg-white text-[#94A3B8] hover:border-gray-300',
                )}
              >
                <ShieldCheck className="h-5 w-5" />
                Admin Utama
              </button>
            </div>

            {/* Wilayah Akses */}
            <h2 className="mb-4 mt-8 text-xl font-bold text-[#1E293B]">Wilayah Akses</h2>

            <div className="flex flex-wrap gap-3">
              {RT_LIST.map((rt) => {
                const isActive = form.selectedRT.includes(rt);
                return (
                  <button
                    key={rt}
                    type="button"
                    onClick={() => toggleRT(rt)}
                    className={cn(
                      'rounded-full border-2 px-5 py-2 text-sm font-semibold transition-all',
                      isActive
                        ? 'border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]'
                        : 'border-gray-200 bg-white text-[#94A3B8] hover:border-gray-300 hover:text-[#64748B]',
                    )}
                  >
                    {rt}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-gray-400">
              Klik untuk aktifkan/nonaktifkan yang bisa diakses pengguna ini.
            </p>
          </div>
        )}

        {/* STEP 3: Konfirmasi */}
        {step === 3 && (
          <div>
            <h2 className="mb-4 text-xl font-bold text-[#1E293B]">Konfirmasi Data</h2>

            {/* Info Alert */}
            <div className="mb-6 flex items-start gap-3 rounded-xl bg-[#F0F5FF] p-4">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#2563EB]" />
              <div>
                <p className="text-sm font-semibold text-[#1E293B]">Periksa kembali sebelum menyimpan.</p>
                <p className="text-sm text-[#6B7280]">
                  Pastikan semua data sudah benar. Kamu masih bisa kembali ke langkah sebelumnya untuk koreksi data.
                </p>
              </div>
            </div>

            {/* Identitas Section */}
            <div className="mb-6">
              <div className="mb-3 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-[#2563EB]" />
                <h3 className="font-bold text-[#1E293B]">Identitas</h3>
              </div>
              <div className="overflow-hidden rounded-xl border border-gray-100">
                {[
                  ['Nama Lengkap', form.namaLengkap || '-'],
                  ['Jabatan Resmi', JABATAN_OPTIONS.find((o) => o.value === form.jabatan)?.label || '-'],
                  ['Email Pengguna', form.email || '-'],
                  ['Nomor Handphone', form.phone ? `+62 ${form.phone}` : '-'],
                  ['Password', form.password ? '••••••••' : '-'],
                ].map(([label, value], i) => (
                  <div
                    key={label}
                    className={`flex items-center justify-between px-4 py-3 text-sm ${
                      i % 2 === 0 ? 'bg-white' : 'bg-[#FAFBFC]'
                    }`}
                  >
                    <span className="font-semibold text-[#1E293B]">{label}</span>
                    <span className="text-[#64748B]">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Peran Section */}
            <div className="mb-6">
              <div className="mb-3 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#2563EB]" />
                <h3 className="font-bold text-[#1E293B]">Peran & Hak Akses</h3>
              </div>
              <div className="overflow-hidden rounded-xl border border-gray-100">
                {[
                  ['Peran Pengguna', form.role === 'ADMIN_RT' ? 'Admin RT/RW' : 'Admin Utama'],
                  ['Wilayah Akses', form.selectedRT.length > 0 ? form.selectedRT.join(', ') : '-'],
                ].map(([label, value], i) => (
                  <div
                    key={label}
                    className={`flex items-center justify-between px-4 py-3 text-sm ${
                      i % 2 === 0 ? 'bg-white' : 'bg-[#FAFBFC]'
                    }`}
                  >
                    <span className="font-semibold text-[#1E293B]">{label}</span>
                    <span className="text-[#64748B]">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Action Buttons ── */}
      <div className="flex items-center justify-center gap-4">
        {step > 1 && (
          <Button
            onClick={handleBack}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-[#2563EB] transition hover:bg-gray-50"
          >
            Kembali
          </Button>
        )}
        <Button
          onClick={handleSaveDraft}
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-[#1E293B] transition hover:bg-gray-50"
        >
          <Save className="h-4 w-4 text-[#3B82F6]" />
          Simpan Draft
        </Button>
        {step < 3 ? (
          <Button
            onClick={handleNext}
            className="flex items-center gap-2 rounded-xl bg-[#2563EB] px-8 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#1D4ED8]"
          >
            Lanjutkan
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={() => void handleSubmit()}
            disabled={submitting}
            className="flex items-center gap-2 rounded-xl bg-[#2563EB] px-8 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#1D4ED8] disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" />
            {submitting ? 'Menyimpan...' : 'Tambahkan Pengguna'}
          </Button>
        )}
      </div>

      {/* ── Draft Modal ── */}
      <Dialog open={showDraftModal} onOpenChange={setShowDraftModal}>
        <DialogContent className="max-w-sm rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#1E293B]">Draft Tersimpan</DialogTitle>
            <DialogDescription className="text-sm text-[#64748B]">
              Anda memiliki draft formulir yang belum selesai. Apakah Anda ingin melanjutkannya atau menghapusnya?
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 flex flex-col gap-3">
            <Button
              onClick={handleLoadDraft}
              className="w-full rounded-xl bg-[#2563EB] py-3 text-sm font-bold text-white transition hover:bg-[#1D4ED8]"
            >
              Lanjutkan Draft
            </Button>
            <Button
              onClick={handleDeleteDraft}
              className="w-full rounded-xl border border-red-100 bg-red-50 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100"
            >
              Hapus Draft
            </Button>
            <Button
              onClick={() => setShowDraftModal(false)}
              className="w-full rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
            >
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Exit Modal ── */}
      <Dialog open={showExitModal} onOpenChange={setShowExitModal}>
        <DialogContent className="max-w-sm rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#1E293B]">Keluar Halaman?</DialogTitle>
            <DialogDescription className="text-sm text-[#64748B]">
              Anda memiliki data yang belum disimpan. Apakah Anda ingin menyimpannya sebagai draft sebelum keluar?
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex flex-col gap-3">
            <Button
              onClick={() => {
                handleSaveDraft();
                setShowExitModal(false);
                router.push('/admin/hak-akses');
              }}
              className="w-full rounded-xl bg-[#2563EB] py-3 text-sm font-bold text-white transition hover:bg-[#1D4ED8]"
            >
              Simpan Draft & Keluar
            </Button>
            <Button
              onClick={() => {
                setShowExitModal(false);
                router.push('/admin/hak-akses');
              }}
              variant="outline"
              className="w-full rounded-xl border border-red-200 text-red-600 transition hover:bg-red-50 hover:text-red-700"
            >
              Keluar Tanpa Menyimpan
            </Button>
            <Button
              onClick={() => setShowExitModal(false)}
              variant="ghost"
              className="w-full rounded-xl text-[#64748B] transition hover:bg-gray-100"
            >
              Batal
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
