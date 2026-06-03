'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Save,
  UploadCloud,
  X,
  FileText,
  MapPin,
  Settings,
  LogIn,
  LogOut,
} from 'lucide-react';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

const RT_OPTIONS = Array.from({ length: 5 }, (_, i) => String(i + 1).padStart(2, '0'));
const ALASAN_PINDAH_OPTIONS = ['Pekerjaan', 'Pendidikan', 'Keluarga', 'Perumahan', 'Lainnya'];

/* ── Types ── */

type FileData = {
  name: string;
  size: number;
  type: string;
  url: string; // Object URL for preview
};

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

  suratKeterangan: FileData | null;
  ktp: FileData | null;
  kk: FileData | null;
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
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL_DATA);
  const [loading, setLoading] = useState(false);
  
  // Modals
  const [showExitModal, setShowExitModal] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDragging, setIsDragging] = useState(false);
  
  const dateRef = useRef<HTMLInputElement>(null);

  // 1. Check for draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('mutasi_draft');
    if (draft) {
      setShowDraftModal(true);
    }
  }, []);

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
      alert('Mohon lengkapi semua data wajib (kolom yang berwarna merah) sebelum melanjutkan ke langkah berikutnya.');
    }
  };

  const handlePrev = () => {
    setCurrentStep((p) => Math.max(1, p - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ── Draft Logic ── */
  const handleSaveDraft = () => {
    localStorage.setItem('mutasi_draft', JSON.stringify(form));
    alert('Draft berhasil disimpan!');
  };

  const handleLoadDraft = () => {
    try {
      const draft = localStorage.getItem('mutasi_draft');
      if (draft) {
        setForm(JSON.parse(draft));
      }
    } catch (e) {
      console.error(e);
    }
    setShowDraftModal(false);
  };

  const handleDeleteDraft = () => {
    localStorage.removeItem('mutasi_draft');
    setShowDraftModal(false);
  };

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Cegah submit jika user menekan enter di step 1-3
    if (currentStep < 4) {
      handleNext();
      return;
    }

    if (!validateStep(4)) return;

    setLoading(true);
    try {
      // Mock API call since actual endpoint logic for creating full mutation with citizen doesn't exist yet
      console.log('Submitting mutation:', form);

      localStorage.removeItem('mutasi_draft');
      alert('Berhasil menyimpan data mutasi!');
      router.push('/admin/mutasi');
      router.refresh();
    } catch (error: any) {
      console.error(error);
      alert('Terjadi kesalahan saat menyimpan data mutasi.');
    } finally {
      setLoading(false);
    }
  };

  /* ── File Upload ── */
  const handleFileUpload = (type: 'suratKeterangan' | 'ktp' | 'kk', file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file maksimal 5MB!');
      return;
    }
    const fileData: FileData = {
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
    };
    handleFieldChange(type, fileData);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* ── Header ── */}
      <div className="flex items-center gap-4 text-[#3B82F6]">
        <button
          onClick={() => setShowExitModal(true)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3B82F6] text-white transition hover:bg-[#2563EB]"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <span className="text-xl font-bold cursor-pointer" onClick={() => setShowExitModal(true)}>Keluar Halaman</span>
      </div>

      {/* ── Title & Stepper ── */}
      <div className="relative overflow-hidden rounded-[12px] bg-[#EEF2FF] p-6">
        <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-[#3B82F6]/[0.05]" />
        <div className="pointer-events-none absolute right-12 top-2 h-24 w-24 rounded-full bg-[#3B82F6]/[0.08]" />
        
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-[#3B82F6]">Input Mutasi Warga</h1>
          <p className="mt-1 text-sm text-[#3B82F6]/80">
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

      <div className="flex items-center gap-3 rounded-[12px] bg-[#EEF2FF] px-6 py-4 border border-blue-100">
        <CheckCircle2 className="h-5 w-5 text-[#3B82F6]" />
        <div>
          <p className="text-sm font-bold text-[#3B82F6]">Periksa kembali sebelum menyimpan.</p>
          <p className="text-sm text-[#3B82F6]/80">Pastikan semua data sudah benar. Kamu masih bisa kembali ke langkah sebelumnya untuk koreksi data</p>
        </div>
      </div>

      {/* ── Form Content ── */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* STEP 1: Jenis Mutasi & Detail Penduduk */}
        {currentStep === 1 && (
          <>
            <div className="rounded-[12px] border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-xl font-bold text-[#1E293B]">Jenis Mutasi</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleFieldChange('jenisMutasi', 'Mutasi Masuk')}
                  className={`flex items-center justify-center gap-2 rounded-xl border-2 px-6 py-4 font-bold transition ${
                    form.jenisMutasi === 'Mutasi Masuk'
                      ? 'border-[#3B82F6] bg-[#EFF6FF] text-[#3B82F6]'
                      : 'border-gray-200 text-[#64748B] hover:bg-gray-50'
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
                      ? 'border-[#3B82F6] bg-[#EFF6FF] text-[#3B82F6]'
                      : 'border-gray-200 text-[#64748B] hover:bg-gray-50'
                  }`}
                >
                  <LogOut className="h-5 w-5" />
                  Mutasi Keluar
                </button>
              </div>
              {errors.jenisMutasi && <p className="mt-2 text-sm text-red-500">{errors.jenisMutasi}</p>}
            </div>

            <div className="rounded-[12px] border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-xl font-bold text-[#1E293B]">Detail Penduduk</h2>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#1E293B]">NIK<span className="text-red-500">*</span></label>
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
                  <label className="mb-2 block text-sm font-semibold text-[#1E293B]">Nama Lengkap<span className="text-red-500">*</span></label>
                  <Input
                    value={form.nama}
                    onChange={(e) => handleFieldChange('nama', e.target.value)}
                    placeholder="Nama Lengkap KTP"
                    className={`h-12 rounded-xl ${errors.nama ? 'border-red-500' : ''}`}
                  />
                  {errors.nama && <p className="mt-1 text-xs text-red-500">{errors.nama}</p>}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#1E293B]">Tanggal Mutasi<span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Input
                      ref={dateRef}
                      type="date"
                      value={form.tanggalMutasi}
                      onChange={(e) => handleFieldChange('tanggalMutasi', e.target.value)}
                      className={`h-12 rounded-xl pr-10 [&::-webkit-calendar-picker-indicator]:hidden ${errors.tanggalMutasi ? 'border-red-500' : ''}`}
                    />
                    <Calendar 
                      className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-[#2563EB] transition-colors" 
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
                  <label className="mb-2 block text-sm font-semibold text-[#1E293B]">Jenis Kelamin<span className="text-red-500">*</span></label>
                  <Select value={form.jenisKelamin} onValueChange={(v) => handleFieldChange('jenisKelamin', v)}>
                    <SelectTrigger className={`h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm text-[#1E293B] outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 ${errors.jenisKelamin ? 'border-red-500' : ''}`}>
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
                  <label className="mb-2 block text-sm font-semibold text-[#1E293B]">Pekerjaan<span className="text-red-500">*</span></label>
                  <Select value={form.pekerjaan} onValueChange={(v) => handleFieldChange('pekerjaan', v)}>
                    <SelectTrigger className={`h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm text-[#1E293B] outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 ${errors.pekerjaan ? 'border-red-500' : ''}`}>
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
          <div className="rounded-[12px] border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-xl font-bold text-[#1E293B]">Informasi Alamat</h2>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1E293B]">Alamat Lama<span className="text-red-500">*</span></label>
                <Input
                  value={form.alamatLama}
                  onChange={(e) => handleFieldChange('alamatLama', e.target.value)}
                  placeholder="Alamat daerah Asal"
                  className={`h-12 rounded-xl ${errors.alamatLama ? 'border-red-500' : ''}`}
                />
                {errors.alamatLama && <p className="mt-1 text-xs text-red-500">{errors.alamatLama}</p>}
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1E293B]">Alamat Baru<span className="text-red-500">*</span></label>
                <Input
                  value={form.alamatBaru}
                  onChange={(e) => handleFieldChange('alamatBaru', e.target.value)}
                  placeholder="Alamat yang akan ditempati"
                  className={`h-12 rounded-xl ${errors.alamatBaru ? 'border-red-500' : ''}`}
                />
                {errors.alamatBaru && <p className="mt-1 text-xs text-red-500">{errors.alamatBaru}</p>}
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1E293B]">RT Tujuan<span className="text-red-500">*</span></label>
                <Select value={form.rtTujuan} onValueChange={(v) => handleFieldChange('rtTujuan', v)}>
                  <SelectTrigger className={`h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm text-[#1E293B] outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 ${errors.rtTujuan ? 'border-red-500' : ''}`}>
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
                <label className="mb-2 block text-sm font-semibold text-[#1E293B]">Alasan Pindah<span className="text-red-500">*</span></label>
                <Select value={form.alasanPindah} onValueChange={(v) => handleFieldChange('alasanPindah', v)}>
                  <SelectTrigger className={`h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm text-[#1E293B] outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 ${errors.alasanPindah ? 'border-red-500' : ''}`}>
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
            <div className="rounded-[12px] border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-xl font-bold text-[#1E293B]">Berkas Pendukung</h2>
              
              <div className={`relative mb-6 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed ${isDragging ? 'border-blue-500 bg-blue-100' : 'border-gray-300 bg-gray-50'} py-12 transition-colors hover:bg-blue-50`}>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="absolute inset-0 cursor-pointer opacity-0"
                  onDragEnter={() => setIsDragging(true)}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={() => setIsDragging(false)}
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    let usedSk = !!form.suratKeterangan;
                    let usedKtp = !!form.ktp;
                    let usedKk = !!form.kk;
                    
                    files.forEach((file) => {
                      if (!usedSk) {
                        handleFileUpload('suratKeterangan', file);
                        usedSk = true;
                      } else if (!usedKtp) {
                        handleFileUpload('ktp', file);
                        usedKtp = true;
                      } else if (!usedKk) {
                        handleFileUpload('kk', file);
                        usedKk = true;
                      }
                    });
                  }}
                />
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EFF6FF] text-[#3B82F6]">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <p className="mt-4 font-bold text-[#3B82F6]">Klik untuk unggah atau seret file ke sini</p>
                <p className="mt-1 text-center text-sm text-[#64748B]">
                  Format yang didukung: PDF, JPG, PNG (Maksimal 5MB per file).<br/>Unggah Surat Keterangan, KTP, Atau KK
                </p>
              </div>

              {/* Uploaded Files Chips */}
              <div className="flex flex-wrap gap-4">
                {(['suratKeterangan', 'ktp', 'kk'] as const).map((type) => {
                  const fileData = form[type];
                  if (!fileData) return null;
                  return (
                    <div key={type} className="flex items-center gap-4 rounded-xl border border-gray-200 p-3 pr-5 shadow-sm">
                      <button
                        type="button"
                        onClick={() => handleFieldChange(type, null)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="h-5 w-5" />
                      </button>
                      <div>
                        <p className="font-bold text-[#3B82F6]">
                          {type === 'suratKeterangan' ? 'Surat Keterangan' : type.toUpperCase()}
                        </p>
                        <p className="text-xs text-[#3B82F6]/60">File {fileData.name.split('.').pop()?.toUpperCase()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[12px] border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-xl font-bold text-[#1E293B]">Kontak</h2>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1E293B]">Nomor Telepon<span className="text-red-500">*</span></label>
                <div className="flex items-center rounded-xl border border-gray-200 overflow-hidden focus-within:border-[#3B82F6] focus-within:ring-1 focus-within:ring-[#3B82F6]">
                  <div className="bg-gray-50 px-4 py-3 font-semibold text-[#3B82F6] border-r border-gray-200">+62</div>
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
            <div className="rounded-[12px] border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5 text-[#3B82F6]" />
                <h2 className="text-lg font-bold text-[#1E293B]">Jenis Mutasi</h2>
              </div>
              <div className="grid grid-cols-2 gap-y-4 text-sm border-t border-gray-100 pt-4">
                <div className="font-semibold text-[#1E293B]">Jenis Mutasi</div>
                <div className="text-right font-medium text-[#1E293B]">{form.jenisMutasi}</div>
                
                <div className="font-semibold text-[#1E293B]">NIK</div>
                <div className="text-right font-medium text-[#1E293B]">{form.nik}</div>
                
                <div className="font-semibold text-[#1E293B]">Nama Lengkap</div>
                <div className="text-right font-medium text-[#1E293B]">{form.nama}</div>
                
                <div className="font-semibold text-[#1E293B]">Tanggal Mutasi</div>
                <div className="text-right font-medium text-[#1E293B]">{form.tanggalMutasi}</div>
                
                <div className="font-semibold text-[#1E293B]">Jenis Kelamin</div>
                <div className="text-right font-medium text-[#1E293B]">{form.jenisKelamin === 'L' ? 'Laki-Laki' : 'Perempuan'}</div>
                
                <div className="font-semibold text-[#1E293B]">Pekerjaan</div>
                <div className="text-right font-medium text-[#1E293B]">{form.pekerjaan}</div>
              </div>
            </div>

            <div className="rounded-[12px] border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[#64748B]" />
                <h2 className="text-lg font-bold text-[#1E293B]">Informasi Alamat</h2>
              </div>
              <div className="grid grid-cols-2 gap-y-4 text-sm border-t border-gray-100 pt-4">
                <div className="font-semibold text-[#1E293B]">Alamat Lama</div>
                <div className="text-right font-medium text-[#1E293B]">{form.alamatLama}</div>
                
                <div className="font-semibold text-[#1E293B]">Alamat Baru</div>
                <div className="text-right font-medium text-[#1E293B]">{form.alamatBaru}</div>
                
                <div className="font-semibold text-[#1E293B]">RT/RW Tujuan</div>
                <div className="text-right font-medium text-[#1E293B]">RT {form.rtTujuan} / RW 25</div>
                
                <div className="font-semibold text-[#1E293B]">Alasan Pindah</div>
                <div className="text-right font-medium text-[#1E293B]">{form.alasanPindah}</div>
              </div>
            </div>

            <div className="rounded-[12px] border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#64748B]" />
                <h2 className="text-lg font-bold text-[#1E293B]">Berkas Pendukung</h2>
              </div>
              <div className="grid grid-cols-2 gap-y-4 text-sm mb-6 border-t border-gray-100 pt-4">
                <div className="font-semibold text-[#1E293B]">Nomor Telepon</div>
                <div className="text-right font-medium text-[#1E293B]">+62 {form.telepon}</div>
              </div>
              <div className="flex flex-wrap gap-4">
                {(['suratKeterangan', 'ktp', 'kk'] as const).map((type) => {
                  const fileData = form[type];
                  if (!fileData) return null;
                  return (
                    <div key={type} className="flex items-center gap-4 rounded-xl border border-gray-200 p-3 pr-5 shadow-sm">
                      <button type="button" className="text-gray-400 hover:text-red-500">
                        <X className="h-5 w-5" />
                      </button>
                      <div>
                        <p className="font-bold text-[#3B82F6]">
                          {type === 'suratKeterangan' ? 'Surat Keterangan' : type.toUpperCase()}
                        </p>
                        <p className="text-xs text-[#3B82F6]/60">File {fileData.name.split('.').pop()?.toUpperCase()}</p>
                      </div>
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
            className="h-12 rounded-xl border-2 border-[#3B82F6] bg-white px-8 font-bold text-[#3B82F6] hover:bg-blue-50 hover:text-[#2563EB]"
          >
            Kembali
          </Button>
          
          {currentStep < STEPS.length && (
            <Button
              type="button"
              onClick={handleSaveDraft}
              variant="outline"
              className="flex h-12 items-center gap-2 rounded-xl px-8 font-bold text-[#3B82F6] hover:bg-blue-50"
            >
              <Save className="h-5 w-5" />
              Simpan Draft
            </Button>
          )}

          {currentStep < STEPS.length ? (
            <Button
              type="button"
              onClick={handleNext}
              className="flex h-12 items-center gap-2 rounded-xl bg-[#3B82F6] px-8 font-bold text-white hover:bg-[#2563EB]"
            >
              Lanjutkan
              <ChevronLeft className="h-5 w-5 rotate-180" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={loading}
              className="flex h-12 items-center gap-2 rounded-xl bg-[#3B82F6] px-8 font-bold text-white hover:bg-[#2563EB]"
            >
              {loading ? 'Menyimpan...' : 'Konfirmasi'}
            </Button>
          )}
        </div>
      </form>

      {/* ── Draft Modal ── */}
      <Dialog open={showDraftModal} onOpenChange={setShowDraftModal}>
        <DialogContent className="max-w-sm rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#1E293B]">Draft Tersimpan</DialogTitle>
            <DialogDescription className="text-sm text-[#64748B]">
              Anda memiliki draft formulir yang belum selesai. Ingin memuat ulang atau menghapusnya?
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex flex-col gap-3">
            <Button onClick={handleLoadDraft} className="w-full rounded-xl bg-[#2563EB] py-3 text-sm font-bold text-white hover:bg-[#1D4ED8]">
              Muat Draft
            </Button>
            <Button onClick={handleDeleteDraft} variant="outline" className="w-full rounded-xl border-red-100 bg-red-50 py-3 text-sm font-bold text-red-600 hover:bg-red-100">
              Hapus Draft
            </Button>
            <Button onClick={() => setShowDraftModal(false)} variant="ghost" className="w-full rounded-xl py-3 text-sm font-bold hover:bg-gray-100">
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
            <Button onClick={() => { handleSaveDraft(); router.push('/admin/mutasi'); }} className="w-full rounded-xl bg-[#2563EB] py-3 font-bold text-white hover:bg-[#1D4ED8]">
              Simpan & Keluar
            </Button>
            <Button onClick={() => router.push('/admin/mutasi')} variant="outline" className="w-full rounded-xl border-red-100 bg-red-50 py-3 font-bold text-red-600 hover:bg-red-100">
              Keluar Tanpa Menyimpan
            </Button>
            <Button onClick={() => setShowExitModal(false)} variant="ghost" className="w-full rounded-xl py-3 font-bold hover:bg-gray-100">
              Batal
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
