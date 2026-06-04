'use client';

import { useCallback, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Info,
  MapPin,
  Save,
  User,
  Users,
} from 'lucide-react';

import { platformFetch } from '@/lib/api/platform';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useActionToast } from '@/lib/use-action-toast';

/* ── Constants ── */

const STEPS = [
  { id: 1, label: 'Data Diri' },
  { id: 2, label: 'Alamat' },
  { id: 3, label: 'Status Keluarga' },
  { id: 4, label: 'Konfirmasi' },
] as const;

const PENDIDIKAN_OPTIONS = [
  'Tidak/Belum Sekolah',
  'SD/Sederajat',
  'SMP/Sederajat',
  'SMA/Sederajat',
  'D1',
  'D2',
  'D3',
  'D4/S1',
  'S2',
  'S3',
];

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

const AGAMA_OPTIONS = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'];
const GOLONGAN_DARAH_OPTIONS = ['A', 'B', 'AB', 'O', 'Tidak Tahu'];

const HUBUNGAN_OPTIONS = [
  'Kepala Keluarga',
  'Istri',
  'Anak',
  'Menantu',
  'Cucu',
  'Orang Tua',
  'Mertua',
  'Famili Lain',
  'Pembantu',
  'Lainnya',
];

const RT_OPTIONS = Array.from({ length: 5 }, (_, i) => String(i + 1).padStart(2, '0'));

const STATUS_KEPENDUDUKAN_OPTIONS = [
  { label: 'Penduduk Tetap', value: 'PENDUDUK_TETAP' },
  { label: 'Ngekost', value: 'NGEKOST' },
];

/* ── Types ── */

type FormData = {
  // Step 1: Data Diri
  nik: string;
  birthDate: string;
  name: string;
  birthPlace: string;
  education: string;
  occupation: string;
  religion: string;
  bloodType: string;
  gender: '' | 'L' | 'P';
  maritalStatus: string;
  phone: string;
  // Step 2: Alamat
  address: string;
  rt: string;
  rw: string;
  kelurahan: string;
  kecamatan: string;
  kota: string;
  status: 'PENDUDUK_TETAP' | 'NGEKOST';
  // Step 3: Status Keluarga
  noKK: string;
  hubungan: string;
  namaAyah: string;
  namaIbu: string;
};

const INITIAL_FORM: FormData = {
  nik: '',
  birthDate: '',
  name: '',
  birthPlace: '',
  education: '',
  occupation: '',
  religion: '',
  bloodType: '',
  gender: '',
  maritalStatus: '',
  phone: '',
  address: '',
  rt: '',
  rw: '25',
  kelurahan: '',
  kecamatan: '',
  kota: 'Cimahi',
  status: 'PENDUDUK_TETAP',
  noKK: '',
  hubungan: '',
  namaAyah: '',
  namaIbu: '',
};

/* ── Component ── */

import { WargaPage, WargaPageBody } from '@/app/(app)/warga/_components/warga-page';
export default function WargaTambahDataPendudukPage() {
  const router = useRouter();
  const { runWithToast, toast } = useActionToast();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({ ...INITIAL_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [hasDraft, setHasDraft] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('draft_tambah_penduduk_warga');
    if (saved) {
      setHasDraft(true);
    }
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
      if (!form.nik || form.nik.length !== 16) errs.nik = 'NIK harus 16 digit';
      if (!form.name.trim()) errs.name = 'Nama wajib diisi';
      if (!form.birthDate) errs.birthDate = 'Tanggal lahir wajib diisi';
      if (!form.birthPlace.trim()) errs.birthPlace = 'Tempat lahir wajib diisi';
      if (!form.education) errs.education = 'Pendidikan wajib dipilih';
      if (!form.occupation) errs.occupation = 'Pekerjaan wajib dipilih';
      if (!form.religion) errs.religion = 'Agama wajib dipilih';
      if (!form.gender) errs.gender = 'Jenis kelamin wajib dipilih';
      if (!form.maritalStatus) errs.maritalStatus = 'Status perkawinan wajib dipilih';
    }
    if (s === 2) {
      if (!form.address.trim()) errs.address = 'Alamat wajib diisi';
      if (!form.rt) errs.rt = 'RT wajib dipilih';
    }
    if (s === 3) {
      if (!form.namaAyah.trim()) errs.namaAyah = 'Nama ayah wajib diisi';
      if (!form.namaIbu.trim()) errs.namaIbu = 'Nama ibu wajib diisi';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(s + 1, 4));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleSaveDraft = () => {
    localStorage.setItem('draft_tambah_penduduk_warga', JSON.stringify({ step, form }));
    setHasDraft(true);
    toast({
      title: 'Draft tersimpan',
      description: 'Draft data penduduk berhasil disimpan di browser ini.',
      variant: 'success',
    });
  };

  const handleLoadDraft = () => {
    try {
      const saved = localStorage.getItem('draft_tambah_penduduk_warga');
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
    localStorage.removeItem('draft_tambah_penduduk_warga');
    setHasDraft(false);
    setShowDraftModal(false);
    setForm({ ...INITIAL_FORM });
    setStep(1);
  };

  const validate = () => {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (!form.nik || form.nik.length !== 16) errs.nik = 'NIK harus 16 digit';
    if (!form.name || form.name.length < 2) errs.name = 'Nama terlalu pendek (min. 2 karakter)';
    if (!form.gender) errs.gender = 'Pilih Jenis Kelamin';
    if (!form.birthPlace) errs.birthPlace = 'Tempat Lahir wajib diisi';
    if (!form.birthDate) errs.birthDate = 'Tanggal Lahir wajib diisi';
    if (!form.religion) errs.religion = 'Pilih Agama';
    if (!form.maritalStatus) errs.maritalStatus = 'Pilih Status Perkawinan';
    if (!form.occupation) errs.occupation = 'Pilih Pekerjaan';
    if (!form.education) errs.education = 'Pilih Pendidikan';
    if (!form.address || form.address.length < 5) errs.address = 'Alamat terlalu pendek (min. 5 karakter)';
    if (!form.rt) errs.rt = 'Pilih RT';

    setErrors(errs);
    
    // Auto jump to the first step with an error
    if (errs.nik || errs.name || errs.gender || errs.birthPlace || errs.birthDate || errs.religion || errs.maritalStatus || errs.occupation || errs.education) {
      setStep(1);
    } else if (errs.address || errs.rt) {
      setStep(2);
    }

    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (!validate()) {
      toast({
        title: 'Validasi gagal',
        description: 'Periksa kembali isian yang belum lengkap atau tidak valid.',
        variant: 'destructive',
      });
      return;
    }
    setSubmitting(true);
    try {
      await runWithToast(
        () =>
          platformFetch('/admin/citizens', {
            method: 'POST',
            body: JSON.stringify({
              nik: form.nik,
              name: form.name,
              gender: form.gender,
              birthPlace: form.birthPlace,
              birthDate: form.birthDate,
              religion: form.religion,
              bloodType: form.bloodType || null,
              maritalStatus: form.maritalStatus,
              occupation: form.occupation,
              education: form.education,
              address: form.address,
              rt: form.rt,
              rw: form.rw,
              status: form.status,
            }),
          }),
        {
          loading: 'Menyimpan data penduduk...',
          success: 'Data penduduk berhasil disimpan',
          error: 'Gagal menyimpan data penduduk',
        },
      );
      localStorage.removeItem('draft_tambah_penduduk_warga');
      router.push('/warga/history');
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Input helpers ── */
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
          className="flex items-center gap-2 text-[16px] font-[600] text-[#2563EB] transition hover:opacity-80 bg-transparent border-none outline-none"
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
          <h1 className="text-2xl font-bold text-[#3B82F6]">Tambah Data Penduduk Baru</h1>
          <p className="mt-1 text-sm text-[#3B82F6]/80">
            Isi semua field wajib bertanda bintang merah. Data akan tersimpan ke modul data penduduk.
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
                    className={`text-sm whitespace-nowrap transition-colors ${labelStyle}`}
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

      <div className="flex items-center gap-3 rounded-[12px] bg-[#EEF2FF] px-6 py-4 border border-blue-100 mt-6">
        <CheckCircle2 className="h-5 w-5 text-[#3B82F6]" />
        <div>
          <p className="text-sm font-bold text-[#3B82F6]">Periksa kembali sebelum menyimpan.</p>
          <p className="text-sm text-[#3B82F6]/80">Pastikan semua data sudah benar. Kamu masih bisa kembali ke langkah sebelumnya untuk koreksi data</p>
        </div>
      </div>

      {/* ── Form Card ── */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        {/* STEP 1: Data Diri */}
        {step === 1 && (
          <div>
            <h2 className="mb-5 text-xl font-bold text-[#1E293B]">Form data Diri</h2>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className={labelClass}>NIK*</label>
                <Input
                  type="text"
                  maxLength={16}
                  value={form.nik}
                  onChange={(e: any) => set('nik', e.target.value.replace(/\D/g, ''))}
                  placeholder="16 Digit nomor NIK"
                  className={inputClass('nik')}
                />
                <p className="mt-1 text-xs text-gray-400">Contoh: 3374010101240001</p>
                {errors.nik && <p className={errorClass}>{errors.nik}</p>}
              </div>
              <div>
                <label className={labelClass}>Tanggal Lahir</label>
                <Input
                  type="date"
                  value={form.birthDate}
                  onChange={(e: any) => set('birthDate', e.target.value)}
                  className={inputClass('birthDate')}
                />
                {errors.birthDate && <p className={errorClass}>{errors.birthDate}</p>}
              </div>
              <div>
                <label className={labelClass}>Nama Lengkap*</label>
                <Input
                  type="text"
                  value={form.name}
                  onChange={(e: any) => set('name', e.target.value)}
                  placeholder="Sesuai KTP/Akta Kelahiran"
                  className={inputClass('name')}
                />
                {errors.name && <p className={errorClass}>{errors.name}</p>}
              </div>
              <div>
                <label className={labelClass}>Tempat Lahir</label>
                <Input
                  type="text"
                  value={form.birthPlace}
                  onChange={(e: any) => set('birthPlace', e.target.value)}
                  placeholder="Kota Tempat Lahir"
                  className={inputClass('birthPlace')}
                />
                {errors.birthPlace && <p className={errorClass}>{errors.birthPlace}</p>}
              </div>
              <div>
                <label className={labelClass}>Pendidikan Terakhir*</label>
                <div className="relative">
                  <select
                    value={form.education}
                    onChange={(e: any) => set('education', e.target.value)}
                    className={selectClass('education')}
                  >
                    <option value="">Pilih Pendidikan</option>
                    {PENDIDIKAN_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.education && <p className={errorClass}>{errors.education}</p>}
              </div>
              <div>
                <label className={labelClass}>Pekerjaan*</label>
                <div className="relative">
                  <select
                    value={form.occupation}
                    onChange={(e: any) => set('occupation', e.target.value)}
                    className={selectClass('occupation')}
                  >
                    <option value="">Pilih Pekerjaan</option>
                    {PEKERJAAN_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.occupation && <p className={errorClass}>{errors.occupation}</p>}
              </div>
            </div>

            {/* Agama + JK + Status Perkawinan + Gol. Darah */}
            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className={labelClass}>Agama*</label>
                <select
                  value={form.religion}
                  onChange={(e: any) => set('religion', e.target.value)}
                  className={selectClass('religion')}
                >
                  <option value="">Pilih Agama</option>
                  {AGAMA_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                {errors.religion && <p className={errorClass}>{errors.religion}</p>}
              </div>
              <div>
                <label className={labelClass}>Jenis Kelamin</label>
                <select
                  value={form.gender}
                  onChange={(e: any) => set('gender', e.target.value as '' | 'L' | 'P')}
                  className={selectClass('gender')}
                >
                  <option value="">Pilih Jenis Kelamin</option>
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
                {errors.gender && <p className={errorClass}>{errors.gender}</p>}
              </div>
              <div>
                <label className={labelClass}>Status Perkawinan*</label>
                <div className="flex h-11 items-center gap-4 rounded-xl border border-gray-200 bg-white px-4">
                  {['Belum Kawin', 'Kawin', 'Cerai Hidup', 'Cerai Mati'].map((opt) => (
                    <label key={opt} className="flex items-center gap-1.5 text-sm text-[#1E293B]">
                      <input
                        type="radio"
                        name="maritalStatus"
                        value={opt}
                        checked={form.maritalStatus === opt}
                        onChange={(e: any) => set('maritalStatus', e.target.value)}
                        className="accent-[#2563EB]"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
                {errors.maritalStatus && <p className={errorClass}>{errors.maritalStatus}</p>}
              </div>
              <div>
                <label className={labelClass}>Golongan Darah</label>
                <select
                  value={form.bloodType}
                  onChange={(e: any) => set('bloodType', e.target.value)}
                  className={selectClass('bloodType')}
                >
                  <option value="">Pilih Gol. Darah</option>
                  {GOLONGAN_DARAH_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Alamat */}
        {step === 2 && (
          <div>
            <h2 className="mb-5 text-xl font-bold text-[#1E293B]">Form Alamat</h2>
            <div className="flex flex-col gap-5">
              <div>
                <label className={labelClass}>Alamat Lengkap*</label>
                <Input
                  type="text"
                  value={form.address}
                  onChange={(e: any) => set('address', e.target.value)}
                  placeholder="Nama jalan, Nomor rumah, Gang, dll"
                  className={inputClass('address')}
                />
                {errors.address && <p className={errorClass}>{errors.address}</p>}
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <div>
                  <label className={labelClass}>RT</label>
                  <select
                    value={form.rt}
                    onChange={(e: any) => set('rt', e.target.value)}
                    className={selectClass('rt')}
                  >
                    <option value="">Pilih RT</option>
                    {RT_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        RT {o}
                      </option>
                    ))}
                  </select>
                  {errors.rt && <p className={errorClass}>{errors.rt}</p>}
                </div>
                <div>
                  <label className={labelClass}>RW</label>
                  <Input
                    type="text"
                    value={form.rw}
                    readOnly
                    className="h-11 w-full rounded-xl border border-gray-200 bg-[#F0F5FF] px-4 text-sm font-semibold text-[#2563EB] outline-none"
                  />
                </div>
                <div>
                  <label className={labelClass}>Kelurahan/Desa</label>
                  <Input
                    type="text"
                    value={form.kelurahan}
                    onChange={(e: any) => set('kelurahan', e.target.value)}
                    placeholder="Nama Kelurahan"
                    className={inputClass()}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Kota/Kabupaten</label>
                  <Input
                    type="text"
                    value={form.kota}
                    onChange={(e: any) => set('kota', e.target.value)}
                    placeholder="Nama Kota"
                    className={inputClass()}
                  />
                </div>
                <div>
                  <label className={labelClass}>Kecamatan</label>
                  <Input
                    type="text"
                    value={form.kecamatan}
                    onChange={(e: any) => set('kecamatan', e.target.value)}
                    placeholder="Nama Kecamatan"
                    className={inputClass()}
                  />
                </div>
              </div>
              <div className="max-w-sm">
                <label className={labelClass}>Status Kependudukan</label>
                <select
                  value={form.status}
                  onChange={(e: any) => set('status', e.target.value as FormData['status'])}
                  className={selectClass()}
                >
                  {STATUS_KEPENDUDUKAN_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Status Keluarga */}
        {step === 3 && (
          <div>
            <h2 className="mb-5 text-xl font-bold text-[#1E293B]">Form Status Keluarga</h2>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className={labelClass}>Nomor Kartu Keluarga*</label>
                <Input
                  type="text"
                  maxLength={16}
                  value={form.noKK}
                  onChange={(e: any) => set('noKK', e.target.value.replace(/\D/g, ''))}
                  placeholder="Masukan 16 Digit Nomor KK"
                  className={inputClass()}
                />
              </div>
              <div>
                <label className={labelClass}>Hubungan Dalam Keluarga</label>
                <select
                  value={form.hubungan}
                  onChange={(e: any) => set('hubungan', e.target.value)}
                  className={selectClass()}
                >
                  <option value="">Pilih Hubungan</option>
                  {HUBUNGAN_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Nama Ayah Kandung*</label>
                <Input
                  type="text"
                  value={form.namaAyah}
                  onChange={(e: any) => set('namaAyah', e.target.value)}
                  placeholder="Masukan Nama Ayah"
                  className={inputClass('namaAyah')}
                />
                {errors.namaAyah && <p className={errorClass}>{errors.namaAyah}</p>}
              </div>
              <div>
                <label className={labelClass}>Nama Ibu Kandung*</label>
                <Input
                  type="text"
                  value={form.namaIbu}
                  onChange={(e: any) => set('namaIbu', e.target.value)}
                  placeholder="Masukan Nama Ibu"
                  className={inputClass('namaIbu')}
                />
                {errors.namaIbu && <p className={errorClass}>{errors.namaIbu}</p>}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Konfirmasi */}
        {step === 4 && (
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

            {/* Data Diri Section */}
            <div className="mb-6">
              <div className="mb-3 flex items-center gap-2">
                <User className="h-5 w-5 text-[#2563EB]" />
                <h3 className="font-bold text-[#1E293B]">Data Diri</h3>
              </div>
              <div className="overflow-hidden rounded-xl border border-gray-100">
                {[
                  ['NIK', form.nik],
                  ['Nama Lengkap', form.name],
                  ['Tanggal Lahir', form.birthDate ? new Date(form.birthDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'],
                  ['Tempat Lahir', form.birthPlace || '-'],
                  ['Pendidikan Terakhir', form.education || '-'],
                  ['Pekerjaan', form.occupation || '-'],
                  ['Agama', form.religion || '-'],
                  ['Jenis Kelamin', form.gender === 'L' ? 'Laki-laki' : form.gender === 'P' ? 'Perempuan' : '-'],
                  ['Status Perkawinan', form.maritalStatus || '-'],
                  ['Nomor Telepon*', form.phone || 'Opsional'],
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

            {/* Alamat Section */}
            <div className="mb-6">
              <div className="mb-3 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[#2563EB]" />
                <h3 className="font-bold text-[#1E293B]">Alamat</h3>
              </div>
              <div className="overflow-hidden rounded-xl border border-gray-100">
                {[
                  ['Alamat Lengkap', form.address || '-'],
                  ['RT', form.rt || '-'],
                  ['RW', form.rw],
                  ['Kelurahan', form.kelurahan || '-'],
                  ['Kecamatan', form.kecamatan || '-'],
                  ['Kota/Kabupaten', form.kota || '-'],
                  ['Status Kependudukan', form.status === 'PENDUDUK_TETAP' ? 'Penduduk Tetap' : 'Ngekost'],
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

            {/* Status Keluarga Section */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Users className="h-5 w-5 text-[#2563EB]" />
                <h3 className="font-bold text-[#1E293B]">Status Keluarga</h3>
              </div>
              <div className="overflow-hidden rounded-xl border border-gray-100">
                {[
                  ['Nomor KK', form.noKK || '-'],
                  ['Status dalam Keluarga', form.hubungan || '-'],
                  ['Nama Ayah', form.namaAyah || '-'],
                  ['Nama Ibu', form.namaIbu || '-'],
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
        {step < 4 ? (
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
            <Save className="h-4 w-4" />
            {submitting ? 'Menyimpan...' : 'Simpan data Penduduk'}
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
                router.back();
              }}
              className="w-full rounded-xl bg-[#2563EB] py-3 text-sm font-bold text-white transition hover:bg-[#1D4ED8]"
            >
              Simpan Draft & Keluar
            </Button>
            <Button
              onClick={() => {
                setShowExitModal(false);
                router.back();
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
