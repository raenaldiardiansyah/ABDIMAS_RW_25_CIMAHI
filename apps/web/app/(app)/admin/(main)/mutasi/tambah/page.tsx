'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { CalendarBlank as Calendar, CheckCircle as CheckCircle2, CaretLeft as ChevronLeft, FileText, MapPin, Gear as Settings, SignIn as LogIn, SignOut as LogOut } from '@phosphor-icons/react';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FormFileUpload from '@/components/warga/FormFileUpload';
import { platformFetch } from '@/lib/api/platform';
import { RT_OPTIONS } from '@/lib/rt-options';
import { useActionToast } from '@/lib/use-action-toast';

/* ── Constants ── */

const STEPS = [
  { id: 1, label: 'Jenis Mutasi' },
  { id: 2, label: 'Informasi' },
  { id: 3, label: 'Berkas pendukung' },
  { id: 4, label: 'Konfirmasi' },
] as const;

const PEKERJAAN_OPTIONS = [
  'Belum/Tidak Bekerja',
  'Pelajar/Mahasiswa',
  'PNS',
  'TNI',
  'Polri',
  'Karyawan Swasta',
  'Wiraswasta',
  'Pedagang',
  'Petani',
  'Nelayan',
  'Guru',
  'Dokter',
  'Buruh',
  'Ibu Rumah Tangga',
  'Pensiunan',
  'Lainnya',
];

const ALASAN_PINDAH_OPTIONS = ['Pekerjaan', 'Pendidikan', 'Keluarga', 'Perumahan', 'Lainnya'];

/* ── Types ── */

type FormData = {
  jenisMutasi: 'Mutasi Masuk' | 'Mutasi Keluar' | '';
  nik: string;
  nama: string;
  tanggalMutasi: string;
  jenisKelamin: string;
  pekerjaan: string;

  alamatLama: string;
  alamatBaru: string;
  rtTujuan: string;
  alasanPindah: string;

  suratKeterangan: File | null;
  ktp: File | null;
  kk: File | null;
  telepon: string;
};

const INITIAL_DATA: FormData = {
  jenisMutasi: '',
  nik: '',
  nama: '',
  tanggalMutasi: '',
  jenisKelamin: '',
  pekerjaan: '',
  alamatLama: '',
  alamatBaru: '',
  rtTujuan: '',
  alasanPindah: '',
  suratKeterangan: null,
  ktp: null,
  kk: null,
  telepon: '',
};

/* ── Page ────────────────────────────────────────────────── */

export default function TambahMutasiPage() {
  const router = useRouter();
  const { runWithToast, toast } = useActionToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL_DATA);
  const [loading, setLoading] = useState(false);
  
  // Modals
  const [showExitModal, setShowExitModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const dateRef = useRef<HTMLInputElement>(null);

  const openFilePreview = (file: File) => {
    const url = URL.createObjectURL(file);
    window.open(url, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const handleFieldChange = (field: keyof FormData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  /* ── Validation ── */
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!form.jenisMutasi) newErrors.jenisMutasi = 'Jenis mutasi wajib dipilih';
      if (!form.nik) newErrors.nik = 'NIK wajib diisi';
      else if (form.nik.length !== 16) newErrors.nik = 'NIK harus 16 digit';
      if (!form.nama) newErrors.nama = 'Nama lengkap wajib diisi';
      if (!form.tanggalMutasi) newErrors.tanggalMutasi = 'Tanggal mutasi wajib diisi';
      if (!form.jenisKelamin) newErrors.jenisKelamin = 'Jenis kelamin wajib dipilih';
      if (!form.pekerjaan) newErrors.pekerjaan = 'Pekerjaan wajib dipilih';
    }

    if (step === 2) {
      if (!form.alamatLama) newErrors.alamatLama = 'Alamat lama wajib diisi';
      if (!form.alamatBaru) newErrors.alamatBaru = 'Alamat baru wajib diisi';
      if (!form.rtTujuan) newErrors.rtTujuan = 'RT tujuan wajib dipilih';
      if (!form.alasanPindah) newErrors.alasanPindah = 'Alasan pindah wajib dipilih';
    }

    if (step === 3) {
      if (!form.telepon) newErrors.telepon = 'Nomor telepon wajib diisi';
      // Files are optional according to UI, but usually required. Let's make at least one required or just leave optional for now.
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ── Navigation ── */
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((p) => Math.min(STEPS.length, p + 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      toast({
        title: 'Validasi gagal',
        description: 'Lengkapi semua data wajib sebelum melanjutkan.',
        variant: 'destructive',
      });
    }
  };

  const handlePrev = () => {
    setCurrentStep((p) => Math.max(1, p - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ── Submit ── */
  const submitMutation = async () => {
    if (!validateStep(4)) return;

    setLoading(true);
    try {
      await runWithToast(
        async () => {
          const formData = new FormData();
          formData.set('nik', form.nik);
          formData.set('name', form.nama);
          formData.set('gender', form.jenisKelamin);
          formData.set('occupation', form.pekerjaan);
          formData.set('type', form.jenisMutasi === 'Mutasi Masuk' ? 'IN' : 'OUT');
          formData.set('mutationDate', form.tanggalMutasi);
          formData.set('fromAddress', form.alamatLama);
          formData.set('toAddress', form.alamatBaru);
          formData.set('targetRt', form.rtTujuan);
          formData.set('reason', form.alasanPindah);
          formData.set('phone', form.telepon);
          if (form.suratKeterangan) formData.set('suratKeterangan', form.suratKeterangan);
          if (form.ktp) formData.set('ktp', form.ktp);
          if (form.kk) formData.set('kk', form.kk);

          await platformFetch('/admin/mutations', {
            method: 'POST',
            body: formData,
          });
        },
        {
          loading: 'Menyimpan mutasi...',
          success: 'Mutasi berhasil disimpan',
          error: 'Gagal menyimpan mutasi',
          loadingDescription: 'Dokumen sedang diunggah ke server.',
          successDescription: 'Data mutasi dan dokumen pendukung berhasil tersimpan.',
        },
      );
      router.push('/admin/mutasi');
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  /* ── File Upload ── */
  return (
    <div className="flex flex-col gap-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowExitModal(true)}
          className="flex items-center gap-2 text-[16px] font-[600] text-[#2563EB] transition hover:opacity-80 bg-transparent border-none outline-none"
        >
          <ChevronLeft className="h-5 w-5" />
          Keluar Halaman
        </button>
      </div>

      {/* ── Title & Stepper ── */}
      <div className="relative overflow-hidden rounded-[12px] border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-muted)] p-6 shadow-sm">
        <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-[color:var(--admin-primary)]/5" />
        <div className="pointer-events-none absolute right-12 top-2 h-24 w-24 rounded-full bg-[color:var(--admin-primary)]/8" />
        
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-[color:var(--admin-primary)]">Input Mutasi Warga</h1>
          <p className="mt-1 text-sm text-[color:var(--admin-primary-soft-foreground)]">
            Isi semua field wajib bertanda bintang merah. Data akan tersimpan ke modul Mutasi penduduk.
          </p>
        </div>

        <div className="relative z-10 mt-8 flex w-full items-center justify-between">
          {STEPS.map((step, idx) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            const isCurrentOrCompleted = isActive || isCompleted;

            const circleStyle = isCurrentOrCompleted
              ? 'bg-transparent text-[#2563EB] border-[1.5px] border-[#2563EB]'
              : 'bg-[#EEF0FD] text-[#7C8FE8] border-[1.5px] border-[#C5CFFB]';

            const labelStyle = isCurrentOrCompleted
              ? 'text-[#2563EB] font-[600]'
              : 'text-[#7C8FE8] font-[400]';

            return (
              <div key={step.id} className={`flex items-center ${idx < STEPS.length - 1 ? 'flex-1' : ''}`}>
                <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-3">
                  <div className={`flex h-[32px] w-[32px] items-center justify-center rounded-full text-[14px] font-bold transition-all duration-300 ${circleStyle}`}>
                    {step.id}
                  </div>
                  <span className={`text-[12px] sm:text-[14px] transition-colors duration-300 ${labelStyle}`}>
                    {step.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
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

      <div className="flex items-center gap-3 rounded-[12px] border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-muted)] px-6 py-4 shadow-sm">
        <CheckCircle2 className="h-5 w-5 text-[color:var(--admin-primary)]" />
        <div>
          <p className="text-sm font-bold text-[color:var(--admin-primary)]">Periksa kembali sebelum menyimpan.</p>
          <p className="text-sm text-[color:var(--admin-primary-soft-foreground)]">Pastikan semua data sudah benar. Kamu masih bisa kembali ke langkah sebelumnya untuk koreksi data</p>
        </div>
      </div>

      {/* ── Form Content ── */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
        }}
        className="space-y-6"
      >
        
        {/* STEP 1: Jenis Mutasi & Detail Penduduk */}
        {currentStep === 1 && (
          <>
            <div className="rounded-[12px] border border-[color:var(--admin-border)] bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-xl font-bold text-[color:var(--admin-heading)]">Jenis Mutasi</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleFieldChange('jenisMutasi', 'Mutasi Masuk')}
                  className={`flex items-center justify-center gap-2 rounded-xl border-2 px-6 py-4 font-bold transition ${
                    form.jenisMutasi === 'Mutasi Masuk'
                      ? 'border-[color:var(--admin-primary)] bg-[color:var(--admin-primary-soft)] text-[color:var(--admin-primary)]'
                      : 'border-[color:var(--admin-border)] text-[color:var(--admin-subtle)] hover:bg-[color:var(--admin-surface-soft)]'
                  }`}
                >
                  <LogIn className="h-5 w-5" />
                  Mutasi Masuk
                </button>
                <button
                  type="button"
                  onClick={() => handleFieldChange('jenisMutasi', 'Mutasi Keluar')}
                  className={`flex items-center justify-center gap-2 rounded-xl border-2 px-6 py-4 font-bold transition ${
                    form.jenisMutasi === 'Mutasi Keluar'
                      ? 'border-[color:var(--admin-primary)] bg-[color:var(--admin-primary-soft)] text-[color:var(--admin-primary)]'
                      : 'border-[color:var(--admin-border)] text-[color:var(--admin-subtle)] hover:bg-[color:var(--admin-surface-soft)]'
                  }`}
                >
                  <LogOut className="h-5 w-5" />
                  Mutasi Keluar
                </button>
              </div>
              {errors.jenisMutasi && <p className="mt-2 text-sm text-red-500">{errors.jenisMutasi}</p>}
            </div>

            <div className="rounded-[12px] border border-[color:var(--admin-border)] bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-xl font-bold text-[color:var(--admin-heading)]">Detail Penduduk</h2>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[color:var(--admin-heading)]">NIK<span className="text-red-500">*</span></label>
                  <Input
                    value={form.nik}
                    onChange={(e) => handleFieldChange('nik', e.target.value.replace(/\D/g, ''))}
                    placeholder="Masukan 16 Digit Nomor KK"
                    className={`h-12 rounded-xl ${errors.nik ? 'border-red-500' : ''}`}
                    maxLength={16}
                  />
                  {errors.nik && <p className="mt-1 text-xs text-red-500">{errors.nik}</p>}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[color:var(--admin-heading)]">Nama Lengkap<span className="text-red-500">*</span></label>
                  <Input
                    value={form.nama}
                    onChange={(e) => handleFieldChange('nama', e.target.value)}
                    placeholder="Nama Lengkap KTP"
                    className={`h-12 rounded-xl ${errors.nama ? 'border-red-500' : ''}`}
                  />
                  {errors.nama && <p className="mt-1 text-xs text-red-500">{errors.nama}</p>}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[color:var(--admin-heading)]">Tanggal Mutasi<span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Input
                      ref={dateRef}
                      type="date"
                      value={form.tanggalMutasi}
                      onChange={(e) => handleFieldChange('tanggalMutasi', e.target.value)}
                      className={`h-12 rounded-xl pr-10 [&::-webkit-calendar-picker-indicator]:hidden ${errors.tanggalMutasi ? 'border-red-500' : ''}`}
                    />
                    <Calendar 
                      className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 cursor-pointer text-[color:var(--admin-muted)] transition-colors hover:text-[color:var(--admin-primary)]" 
                      onClick={() => {
                        try {
                          dateRef.current?.showPicker();
                        } catch (e) {
                          dateRef.current?.focus();
                        }
                      }}
                    />
                  </div>
                  {errors.tanggalMutasi && <p className="mt-1 text-xs text-red-500">{errors.tanggalMutasi}</p>}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[color:var(--admin-heading)]">Jenis Kelamin<span className="text-red-500">*</span></label>
                  <Select value={form.jenisKelamin} onValueChange={(v) => handleFieldChange('jenisKelamin', v)}>
                    <SelectTrigger className={`h-12 rounded-xl border border-[color:var(--admin-border)] bg-white px-4 text-sm text-[color:var(--admin-heading)] outline-none transition focus:border-[color:var(--admin-primary)] focus:ring-2 focus:ring-[color:var(--admin-primary-soft)] ${errors.jenisKelamin ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Masukan Jenis Kelamin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L">Laki-Laki</SelectItem>
                      <SelectItem value="P">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.jenisKelamin && <p className="mt-1 text-xs text-red-500">{errors.jenisKelamin}</p>}
                </div>
                <div className="col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-[color:var(--admin-heading)]">Pekerjaan<span className="text-red-500">*</span></label>
                  <Select value={form.pekerjaan} onValueChange={(v) => handleFieldChange('pekerjaan', v)}>
                    <SelectTrigger className={`h-12 rounded-xl border border-[color:var(--admin-border)] bg-white px-4 text-sm text-[color:var(--admin-heading)] outline-none transition focus:border-[color:var(--admin-primary)] focus:ring-2 focus:ring-[color:var(--admin-primary-soft)] ${errors.pekerjaan ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Pilih Pekerjaan" />
                    </SelectTrigger>
                    <SelectContent>
                      {PEKERJAAN_OPTIONS.map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.pekerjaan && <p className="mt-1 text-xs text-red-500">{errors.pekerjaan}</p>}
                </div>
              </div>
            </div>
          </>
        )}

        {/* STEP 2: Informasi Alamat */}
        {currentStep === 2 && (
          <div className="rounded-[12px] border border-[color:var(--admin-border)] bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-xl font-bold text-[color:var(--admin-heading)]">Informasi Alamat</h2>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[color:var(--admin-heading)]">Alamat Lama<span className="text-red-500">*</span></label>
                <Input
                  value={form.alamatLama}
                  onChange={(e) => handleFieldChange('alamatLama', e.target.value)}
                  placeholder="Alamat daerah Asal"
                  className={`h-12 rounded-xl ${errors.alamatLama ? 'border-red-500' : ''}`}
                />
                {errors.alamatLama && <p className="mt-1 text-xs text-red-500">{errors.alamatLama}</p>}
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[color:var(--admin-heading)]">Alamat Baru<span className="text-red-500">*</span></label>
                <Input
                  value={form.alamatBaru}
                  onChange={(e) => handleFieldChange('alamatBaru', e.target.value)}
                  placeholder="Alamat yang akan ditempati"
                  className={`h-12 rounded-xl ${errors.alamatBaru ? 'border-red-500' : ''}`}
                />
                {errors.alamatBaru && <p className="mt-1 text-xs text-red-500">{errors.alamatBaru}</p>}
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[color:var(--admin-heading)]">RT Tujuan<span className="text-red-500">*</span></label>
                <Select value={form.rtTujuan} onValueChange={(v) => handleFieldChange('rtTujuan', v)}>
                  <SelectTrigger className={`h-12 rounded-xl border border-[color:var(--admin-border)] bg-white px-4 text-sm text-[color:var(--admin-heading)] outline-none transition focus:border-[color:var(--admin-primary)] focus:ring-2 focus:ring-[color:var(--admin-primary-soft)] ${errors.rtTujuan ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Pilih RT Tujuan" />
                  </SelectTrigger>
                  <SelectContent>
                    {RT_OPTIONS.map((rt) => (
                      <SelectItem key={rt} value={rt}>RT {rt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.rtTujuan && <p className="mt-1 text-xs text-red-500">{errors.rtTujuan}</p>}
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[color:var(--admin-heading)]">Alasan Pindah<span className="text-red-500">*</span></label>
                <Select value={form.alasanPindah} onValueChange={(v) => handleFieldChange('alasanPindah', v)}>
                  <SelectTrigger className={`h-12 rounded-xl border border-[color:var(--admin-border)] bg-white px-4 text-sm text-[color:var(--admin-heading)] outline-none transition focus:border-[color:var(--admin-primary)] focus:ring-2 focus:ring-[color:var(--admin-primary-soft)] ${errors.alasanPindah ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Pilih alasan" />
                  </SelectTrigger>
                  <SelectContent>
                    {ALASAN_PINDAH_OPTIONS.map((alasan) => (
                      <SelectItem key={alasan} value={alasan}>{alasan}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.alasanPindah && <p className="mt-1 text-xs text-red-500">{errors.alasanPindah}</p>}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Berkas Pendukung */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="rounded-[12px] border border-[color:var(--admin-border)] bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-xl font-bold text-[color:var(--admin-heading)]">Berkas Pendukung</h2>
              <div className="grid gap-4 md:grid-cols-3">
                <FormFileUpload
                  label="Surat Keterangan"
                  file={form.suratKeterangan}
                  onChange={(file) => handleFieldChange('suratKeterangan', file)}
                />
                <FormFileUpload
                  label="KTP"
                  file={form.ktp}
                  onChange={(file) => handleFieldChange('ktp', file)}
                />
                <FormFileUpload
                  label="KK"
                  file={form.kk}
                  onChange={(file) => handleFieldChange('kk', file)}
                />
              </div>
            </div>

            <div className="rounded-[12px] border border-[color:var(--admin-border)] bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-xl font-bold text-[color:var(--admin-heading)]">Kontak</h2>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[color:var(--admin-heading)]">Nomor Telepon<span className="text-red-500">*</span></label>
                <div className="flex items-center overflow-hidden rounded-xl border border-[color:var(--admin-border)] focus-within:border-[color:var(--admin-primary)] focus-within:ring-1 focus-within:ring-[color:var(--admin-primary-soft-border)]">
                  <div className="border-r border-[color:var(--admin-border)] bg-[color:var(--admin-surface-soft)] px-4 py-3 font-semibold text-[color:var(--admin-primary)]">+62</div>
                  <Input
                    value={form.telepon}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '').slice(0, 13);
                      const formatted = raw.match(/.{1,4}/g)?.join('-') || '';
                      handleFieldChange('telepon', formatted);
                    }}
                    placeholder="XXXX-XXXX-XXXX"
                    className="h-12 border-none rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none outline-none"
                  />
                </div>
                {errors.telepon && <p className="mt-1 text-xs text-red-500">{errors.telepon}</p>}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Konfirmasi */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="rounded-[12px] border border-[color:var(--admin-border)] bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5 text-[color:var(--admin-primary)]" />
                <h2 className="text-lg font-bold text-[color:var(--admin-heading)]">Jenis Mutasi</h2>
              </div>
              <div className="grid grid-cols-2 gap-y-4 border-t border-[color:var(--admin-border)] pt-4 text-sm">
                <div className="font-semibold text-[color:var(--admin-heading)]">Jenis Mutasi</div>
                <div className="text-right font-medium text-[color:var(--admin-heading)]">{form.jenisMutasi}</div>
                
                <div className="font-semibold text-[color:var(--admin-heading)]">NIK</div>
                <div className="text-right font-medium text-[color:var(--admin-heading)]">{form.nik}</div>
                
                <div className="font-semibold text-[color:var(--admin-heading)]">Nama Lengkap</div>
                <div className="text-right font-medium text-[color:var(--admin-heading)]">{form.nama}</div>
                
                <div className="font-semibold text-[color:var(--admin-heading)]">Tanggal Mutasi</div>
                <div className="text-right font-medium text-[color:var(--admin-heading)]">{form.tanggalMutasi}</div>
                
                <div className="font-semibold text-[color:var(--admin-heading)]">Jenis Kelamin</div>
                <div className="text-right font-medium text-[color:var(--admin-heading)]">{form.jenisKelamin === 'L' ? 'Laki-Laki' : 'Perempuan'}</div>
                
                <div className="font-semibold text-[color:var(--admin-heading)]">Pekerjaan</div>
                <div className="text-right font-medium text-[color:var(--admin-heading)]">{form.pekerjaan}</div>
              </div>
            </div>

            <div className="rounded-[12px] border border-[color:var(--admin-border)] bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[color:var(--admin-subtle)]" />
                <h2 className="text-lg font-bold text-[color:var(--admin-heading)]">Informasi Alamat</h2>
              </div>
              <div className="grid grid-cols-2 gap-y-4 border-t border-[color:var(--admin-border)] pt-4 text-sm">
                <div className="font-semibold text-[color:var(--admin-heading)]">Alamat Lama</div>
                <div className="text-right font-medium text-[color:var(--admin-heading)]">{form.alamatLama}</div>
                
                <div className="font-semibold text-[color:var(--admin-heading)]">Alamat Baru</div>
                <div className="text-right font-medium text-[color:var(--admin-heading)]">{form.alamatBaru}</div>
                
                <div className="font-semibold text-[color:var(--admin-heading)]">RT/RW Tujuan</div>
                <div className="text-right font-medium text-[color:var(--admin-heading)]">RT {form.rtTujuan} / RW 25</div>
                
                <div className="font-semibold text-[color:var(--admin-heading)]">Alasan Pindah</div>
                <div className="text-right font-medium text-[color:var(--admin-heading)]">{form.alasanPindah}</div>
              </div>
            </div>

            <div className="rounded-[12px] border border-[color:var(--admin-border)] bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-[color:var(--admin-subtle)]" />
                <h2 className="text-lg font-bold text-[color:var(--admin-heading)]">Berkas Pendukung</h2>
              </div>
              <div className="mb-6 grid grid-cols-2 gap-y-4 border-t border-[color:var(--admin-border)] pt-4 text-sm">
                <div className="font-semibold text-[color:var(--admin-heading)]">Nomor Telepon</div>
                <div className="text-right font-medium text-[color:var(--admin-heading)]">+62 {form.telepon}</div>
              </div>
              <div className="flex flex-wrap gap-4">
                {(['suratKeterangan', 'ktp', 'kk'] as const).map((type) => {
                  const fileData = form[type];
                  if (!fileData) return null;
                  return (
                    <div key={type} className="flex items-center gap-4 rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-soft)] p-3 pr-3 shadow-sm">
                      <div className="flex-1">
                        <p className="font-bold text-[color:var(--admin-primary)]">
                          {type === 'suratKeterangan' ? 'Surat Keterangan' : type.toUpperCase()}
                        </p>
                        <p className="text-sm font-medium text-[color:var(--admin-heading)]">{fileData.name}</p>
                        <p className="text-xs text-[color:var(--admin-subtle)]">
                          File {fileData.name.split('.').pop()?.toUpperCase()} • {(fileData.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => openFilePreview(fileData)}
                        className="rounded-lg border-[color:var(--admin-primary-soft-border)] text-[color:var(--admin-primary)] hover:bg-[color:var(--admin-primary-soft)]"
                      >
                        Preview
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Action Buttons ── */}
        <div className="mt-8 flex justify-end gap-4">
          <Button
            type="button"
            onClick={currentStep > 1 ? handlePrev : () => setShowExitModal(true)}
            className="h-12 rounded-xl border border-[color:var(--admin-primary-soft-border)] bg-white px-8 font-bold text-[color:var(--admin-primary)] hover:bg-[color:var(--admin-primary-soft)] hover:text-[color:var(--admin-primary-strong)]"
          >
            Kembali
          </Button>
          
          {currentStep < STEPS.length ? (
            <Button
              type="button"
              onClick={handleNext}
              className="flex h-12 items-center gap-2 rounded-xl bg-[color:var(--admin-primary)] px-8 font-bold text-primary-foreground hover:bg-[color:var(--admin-primary-strong)]"
            >
              Lanjutkan
              <ChevronLeft className="h-5 w-5 rotate-180" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => void submitMutation()}
              disabled={loading}
              className="flex h-12 items-center gap-2 rounded-xl bg-[color:var(--admin-primary)] px-8 font-bold text-primary-foreground hover:bg-[color:var(--admin-primary-strong)]"
            >
              {loading ? 'Menyimpan...' : 'Konfirmasi'}
            </Button>
          )}
        </div>
      </form>

      {/* ── Exit Modal ── */}
      <Dialog open={showExitModal} onOpenChange={setShowExitModal}>
        <DialogContent className="max-w-sm rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[color:var(--admin-heading)]">Keluar Halaman?</DialogTitle>
            <DialogDescription className="text-sm text-[color:var(--admin-subtle)]">
              Anda memiliki data yang belum disimpan. Yakin ingin keluar dari halaman ini?
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex flex-col gap-3">
            <Button onClick={() => router.push('/admin/mutasi')} variant="outline" className="w-full rounded-xl border-[color:var(--admin-danger-border)] bg-[color:var(--admin-danger-soft)] py-3 font-bold text-[color:var(--admin-danger-foreground)] hover:bg-[color:var(--admin-danger-soft)]/80">
              Keluar Tanpa Menyimpan
            </Button>
            <Button onClick={() => setShowExitModal(false)} variant="ghost" className="w-full rounded-xl py-3 font-bold hover:bg-[color:var(--admin-surface-soft)]">
              Batal
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
