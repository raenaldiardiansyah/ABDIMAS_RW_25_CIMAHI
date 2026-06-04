'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle as CheckCircle2, CaretLeft as ChevronLeft, MapPin, Plus, FloppyDisk as Save, Trash as Trash2, User, Users } from '@phosphor-icons/react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { platformFetch } from '@/lib/api/platform';
import { RT_OPTIONS } from '@/lib/rt-options';
import { useActionToast } from '@/lib/use-action-toast';

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
const MEMBER_RELATION_OPTIONS = HUBUNGAN_OPTIONS.filter((item) => item !== 'Kepala Keluarga');
type PersonForm = {
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
};

type HouseholdMemberForm = PersonForm & {
  relationship: string;
};

type FormData = PersonForm & {
  isHeadOfFamily: boolean | null;
  address: string;
  rt: string;
  rw: string;
  kelurahan: string;
  kecamatan: string;
  kota: string;
  status: 'PENDUDUK_TETAP' | 'NGEKOST';
  noKK: string;
  hubungan: string;
  namaAyah: string;
  namaIbu: string;
  householdMembers: HouseholdMemberForm[];
};

type FormErrors = Record<string, string>;

const createEmptyPerson = (): PersonForm => ({
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
});

const createEmptyHouseholdMember = (): HouseholdMemberForm => ({
  ...createEmptyPerson(),
  relationship: '',
});

const INITIAL_FORM: FormData = {
  ...createEmptyPerson(),
  isHeadOfFamily: null,
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
  householdMembers: [],
};

function formatDate(value: string) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function mapStatusLabel(value: FormData['status']) {
  return value === 'PENDUDUK_TETAP' ? 'Penduduk Tetap' : 'Ngekost';
}

function validatePerson(person: PersonForm, prefix: string, errors: FormErrors) {
  if (!person.nik || person.nik.length !== 16) errors[`${prefix}.nik`] = 'NIK harus 16 digit';
  if (!person.name.trim()) errors[`${prefix}.name`] = 'Nama wajib diisi';
  if (!person.birthDate) errors[`${prefix}.birthDate`] = 'Tanggal lahir wajib diisi';
  if (!person.birthPlace.trim()) errors[`${prefix}.birthPlace`] = 'Tempat lahir wajib diisi';
  if (!person.education) errors[`${prefix}.education`] = 'Pendidikan wajib dipilih';
  if (!person.occupation) errors[`${prefix}.occupation`] = 'Pekerjaan wajib dipilih';
  if (!person.religion) errors[`${prefix}.religion`] = 'Agama wajib dipilih';
  if (!person.gender) errors[`${prefix}.gender`] = 'Jenis kelamin wajib dipilih';
  if (!person.maritalStatus) errors[`${prefix}.maritalStatus`] = 'Status perkawinan wajib dipilih';
}

export default function TambahDataPendudukPage() {
  const router = useRouter();
  const { runWithToast, toast } = useActionToast();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({ ...INITIAL_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showExitModal, setShowExitModal] = useState(false);

  const setField = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'isHeadOfFamily') {
        if (value === true) {
          next.hubungan = 'Kepala Keluarga';
          next.namaAyah = '';
          next.namaIbu = '';
        } else if (value === false && prev.hubungan === 'Kepala Keluarga') {
          next.hubungan = '';
          next.householdMembers = [];
        }
      }
      return next;
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next[String(key)];
      return next;
    });
  }, []);

  const setPersonField = useCallback(<K extends keyof PersonForm>(key: K, value: PersonForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`citizen.${String(key)}`];
      return next;
    });
  }, []);

  const setHouseholdMemberField = useCallback(
    <K extends keyof HouseholdMemberForm>(index: number, key: K, value: HouseholdMemberForm[K]) => {
      setForm((prev) => ({
        ...prev,
        householdMembers: prev.householdMembers.map((member, memberIndex) =>
          memberIndex === index ? { ...member, [key]: value } : member,
        ),
      }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[`members.${index}.${String(key)}`];
        return next;
      });
    },
    [],
  );

  const addHouseholdMember = () => {
    setForm((prev) => ({
      ...prev,
      householdMembers: [...prev.householdMembers, createEmptyHouseholdMember()],
    }));
  };

  const removeHouseholdMember = (index: number) => {
    setForm((prev) => ({
      ...prev,
      householdMembers: prev.householdMembers.filter((_, memberIndex) => memberIndex !== index),
    }));
    setErrors((prev) => {
      const next: FormErrors = {};
      Object.entries(prev).forEach(([key, value]) => {
        if (!key.startsWith(`members.${index}.`)) next[key] = value;
      });
      return next;
    });
  };

  const validateStep = (targetStep: number) => {
    const nextErrors: FormErrors = {};

    if (targetStep >= 1) {
      if (form.isHeadOfFamily === null) nextErrors.isHeadOfFamily = 'Pilih peran keluarga';
      validatePerson(form, 'citizen', nextErrors);
    }

    if (targetStep >= 2) {
      if (!form.address.trim()) nextErrors.address = 'Alamat wajib diisi';
      if (!form.rt) nextErrors.rt = 'RT wajib dipilih';
    }

    if (targetStep >= 3) {
      if (!form.noKK || form.noKK.length !== 16) nextErrors.noKK = 'Nomor KK harus 16 digit';

      if (form.isHeadOfFamily) {
        form.householdMembers.forEach((member, index) => {
          if (!member.relationship) nextErrors[`members.${index}.relationship`] = 'Hubungan keluarga wajib dipilih';
          validatePerson(member, `members.${index}`, nextErrors);
        });
      } else {
        if (!form.hubungan) nextErrors.hubungan = 'Hubungan keluarga wajib dipilih';
        if (!form.namaAyah.trim()) nextErrors.namaAyah = 'Nama ayah wajib diisi';
        if (!form.namaIbu.trim()) nextErrors.namaIbu = 'Nama ibu wajib diisi';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    setStep((currentStep) => Math.min(currentStep + 1, 4));
  };

  const handleBack = () => setStep((currentStep) => Math.max(currentStep - 1, 1));

  const handleSubmit = async () => {
    if (submitting) return;
    if (!validateStep(3)) {
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
          platformFetch('/admin/citizens/registration', {
            method: 'POST',
            body: JSON.stringify({
              citizen: {
                nik: form.nik,
                name: form.name,
                gender: form.gender,
                birthPlace: form.birthPlace,
                birthDate: form.birthDate,
                religion: form.religion,
                bloodType: form.bloodType || undefined,
                maritalStatus: form.maritalStatus,
                occupation: form.occupation,
                education: form.education,
                address: form.address,
                rt: form.rt,
                rw: form.rw,
                status: form.status,
              },
              household: {
                isHeadOfFamily: !!form.isHeadOfFamily,
                kkNumber: form.noKK,
                relationship: form.isHeadOfFamily ? undefined : form.hubungan,
                members: form.isHeadOfFamily
                  ? form.householdMembers.map((member) => ({
                      nik: member.nik,
                      name: member.name,
                      gender: member.gender,
                      birthPlace: member.birthPlace,
                      birthDate: member.birthDate,
                      religion: member.religion,
                      bloodType: member.bloodType || undefined,
                      maritalStatus: member.maritalStatus,
                      occupation: member.occupation,
                      education: member.education,
                      address: form.address,
                      rt: form.rt,
                      rw: form.rw,
                      status: form.status,
                      relationship: member.relationship,
                    }))
                  : [],
              },
            }),
          }),
        {
          loading: form.isHeadOfFamily
            ? 'Menyimpan data penduduk dan kartu keluarga...'
            : 'Menyimpan data penduduk...',
          success: form.isHeadOfFamily
            ? 'Data penduduk dan kartu keluarga berhasil disimpan'
            : 'Data penduduk berhasil disimpan',
          error: form.isHeadOfFamily
            ? 'Gagal menyimpan data penduduk dan kartu keluarga'
            : 'Gagal menyimpan data penduduk',
        },
      );

      router.push(form.isHeadOfFamily ? '/admin/kartu-keluarga' : '/admin/data-penduduk');
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (key?: string) =>
    `h-11 w-full rounded-xl border bg-white px-4 text-sm text-[#1E293B] outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 ${
      key && errors[key] ? 'border-red-400' : 'border-gray-200'
    }`;

  const selectClass = (key?: string) =>
    `h-11 w-full appearance-none rounded-xl border bg-white px-4 pr-10 text-sm text-[#1E293B] outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 bg-no-repeat bg-[position:right_1rem_center] bg-[length:1.25rem_1.25rem] bg-[url("data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20fill='none'%20viewBox='0%200%2024%2024'%20stroke='%232563EB'%3e%3cpath%20stroke-linecap='round'%20stroke-linejoin='round'%20stroke-width='2'%20d='M6%209l6%206%206-6'/%3e%3c/svg%3e")] ${
      key && errors[key] ? 'border-red-400' : 'border-gray-200'
    }`;

  const labelClass = 'mb-1.5 block text-sm font-semibold text-[#1E293B]';
  const errorClass = 'mt-1 text-xs text-red-500';

  const renderPersonFields = (
    person: PersonForm,
    prefix: string,
    onChange: <K extends keyof PersonForm>(key: K, value: PersonForm[K]) => void,
  ) => (
    <>
      <div>
        <label className={labelClass}>NIK*</label>
        <Input
          type="text"
          maxLength={16}
          value={person.nik}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('nik', e.target.value.replace(/\D/g, ''))}
          placeholder="16 Digit nomor NIK"
          className={inputClass(`${prefix}.nik`)}
        />
        {errors[`${prefix}.nik`] && <p className={errorClass}>{errors[`${prefix}.nik`]}</p>}
      </div>
      <div>
        <label className={labelClass}>Tanggal Lahir*</label>
        <Input
          type="date"
          value={person.birthDate}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('birthDate', e.target.value)}
          className={inputClass(`${prefix}.birthDate`)}
        />
        {errors[`${prefix}.birthDate`] && <p className={errorClass}>{errors[`${prefix}.birthDate`]}</p>}
      </div>
      <div>
        <label className={labelClass}>Nama Lengkap*</label>
        <Input
          type="text"
          value={person.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('name', e.target.value)}
          placeholder="Sesuai KTP/Akta Kelahiran"
          className={inputClass(`${prefix}.name`)}
        />
        {errors[`${prefix}.name`] && <p className={errorClass}>{errors[`${prefix}.name`]}</p>}
      </div>
      <div>
        <label className={labelClass}>Tempat Lahir*</label>
        <Input
          type="text"
          value={person.birthPlace}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('birthPlace', e.target.value)}
          placeholder="Kota Tempat Lahir"
          className={inputClass(`${prefix}.birthPlace`)}
        />
        {errors[`${prefix}.birthPlace`] && <p className={errorClass}>{errors[`${prefix}.birthPlace`]}</p>}
      </div>
      <div>
        <label className={labelClass}>Pendidikan Terakhir*</label>
        <select
          value={person.education}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange('education', e.target.value)}
          className={selectClass(`${prefix}.education`)}
        >
          <option value="">Pilih Pendidikan</option>
          {PENDIDIKAN_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {errors[`${prefix}.education`] && <p className={errorClass}>{errors[`${prefix}.education`]}</p>}
      </div>
      <div>
        <label className={labelClass}>Pekerjaan*</label>
        <select
          value={person.occupation}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange('occupation', e.target.value)}
          className={selectClass(`${prefix}.occupation`)}
        >
          <option value="">Pilih Pekerjaan</option>
          {PEKERJAAN_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {errors[`${prefix}.occupation`] && <p className={errorClass}>{errors[`${prefix}.occupation`]}</p>}
      </div>
      <div>
        <label className={labelClass}>Agama*</label>
        <select
          value={person.religion}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange('religion', e.target.value)}
          className={selectClass(`${prefix}.religion`)}
        >
          <option value="">Pilih Agama</option>
          {AGAMA_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {errors[`${prefix}.religion`] && <p className={errorClass}>{errors[`${prefix}.religion`]}</p>}
      </div>
      <div>
        <label className={labelClass}>Jenis Kelamin*</label>
        <select
          value={person.gender}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange('gender', e.target.value as '' | 'L' | 'P')}
          className={selectClass(`${prefix}.gender`)}
        >
          <option value="">Pilih Jenis Kelamin</option>
          <option value="L">Laki-laki</option>
          <option value="P">Perempuan</option>
        </select>
        {errors[`${prefix}.gender`] && <p className={errorClass}>{errors[`${prefix}.gender`]}</p>}
      </div>
      <div>
        <label className={labelClass}>Status Perkawinan*</label>
        <select
          value={person.maritalStatus}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange('maritalStatus', e.target.value)}
          className={selectClass(`${prefix}.maritalStatus`)}
        >
          <option value="">Pilih Status Perkawinan</option>
          <option value="Belum Kawin">Belum Kawin</option>
          <option value="Kawin">Kawin</option>
          <option value="Cerai Hidup">Cerai Hidup</option>
          <option value="Cerai Mati">Cerai Mati</option>
        </select>
        {errors[`${prefix}.maritalStatus`] && <p className={errorClass}>{errors[`${prefix}.maritalStatus`]}</p>}
      </div>
      <div>
        <label className={labelClass}>Golongan Darah</label>
        <select
          value={person.bloodType}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange('bloodType', e.target.value)}
          className={selectClass()}
        >
          <option value="">Pilih Gol. Darah</option>
          {GOLONGAN_DARAH_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>Nomor Telepon</label>
        <Input
          type="text"
          value={person.phone}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('phone', e.target.value)}
          placeholder="Opsional"
          className={inputClass()}
        />
      </div>
    </>
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => setShowExitModal(true)}
          className="flex items-center gap-2 border-none bg-transparent text-[16px] font-[600] text-[#2563EB] outline-none transition hover:opacity-80"
        >
          <ChevronLeft className="h-5 w-5" />
          Keluar Halaman
        </button>
      </div>

      <div className="relative overflow-hidden rounded-[12px] bg-[#EEF2FF] p-6">
        <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-[#3B82F6]/[0.05]" />
        <div className="pointer-events-none absolute right-12 top-2 h-24 w-24 rounded-full bg-[#3B82F6]/[0.08]" />

        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-[#3B82F6]">Tambah Data Penduduk Baru</h1>
        </div>

        <div className="relative z-10 mt-8 flex w-full items-center justify-between">
          {STEPS.map((item, index) => {
            const isActive = step === item.id;
            const isCompleted = step > item.id;
            const circleStyle = isActive || isCompleted
              ? 'bg-transparent text-[#2563EB] border-[1.5px] border-[#2563EB]'
              : 'bg-[#EEF0FD] text-[#7C8FE8] border-[1.5px] border-[#C5CFFB]';
            const labelStyle = isActive || isCompleted ? 'text-[#2563EB] font-[600]' : 'text-[#7C8FE8] font-[400]';

            return (
              <div key={item.id} className={`flex items-center ${index < STEPS.length - 1 ? 'flex-1' : ''}`}>
                <button
                  type="button"
                  onClick={() => {
                    if (item.id < step) setStep(item.id);
                  }}
                  className="flex items-center gap-3 outline-none"
                >
                  <div
                    className={`flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${circleStyle}`}
                  >
                    {item.id}
                  </div>
                  <span className={`whitespace-nowrap text-sm transition-colors ${labelStyle}`}>{item.label}</span>
                </button>
                {index < STEPS.length - 1 && (
                  <div className={`mx-4 h-[1px] flex-1 rounded-full transition-colors ${isCompleted ? 'bg-[#2563EB]' : 'bg-[#C5CFFB]'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        {step === 1 && (
          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border border-blue-100 bg-[#F8FBFF] p-5">
              <h2 className="text-lg font-bold text-[#1E293B]">Peran Keluarga</h2>
              <p className="mt-1 text-sm text-[#64748B]">Tentukan dulu apakah warga ini akan menjadi kepala keluarga untuk KK baru.</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setField('isHeadOfFamily', true)}
                  className={`rounded-2xl border px-4 py-4 text-left transition ${
                    form.isHeadOfFamily
                      ? 'border-[#2563EB] bg-[#EFF6FF]'
                      : 'border-gray-200 bg-white hover:border-[#93C5FD]'
                  }`}
                >
                  <p className="font-semibold text-[#1E293B]">Ya, Kepala Keluarga</p>
                  <p className="mt-1 text-sm text-[#64748B]">Form akan membuat KK baru dan bisa menambah anggota keluarga.</p>
                </button>
                <button
                  type="button"
                  onClick={() => setField('isHeadOfFamily', false)}
                  className={`rounded-2xl border px-4 py-4 text-left transition ${
                    form.isHeadOfFamily === false
                      ? 'border-[#2563EB] bg-[#EFF6FF]'
                      : 'border-gray-200 bg-white hover:border-[#93C5FD]'
                  }`}
                >
                  <p className="font-semibold text-[#1E293B]">Bukan Kepala Keluarga</p>
                  <p className="mt-1 text-sm text-[#64748B]">Form hanya menambah satu data penduduk atau menghubungkannya ke KK yang sudah ada.</p>
                </button>
              </div>
              {errors.isHeadOfFamily && <p className={errorClass}>{errors.isHeadOfFamily}</p>}
            </div>

            <div>
              <h2 className="mb-5 text-xl font-bold text-[#1E293B]">Form Data Diri</h2>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {renderPersonFields(form, 'citizen', setPersonField)}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="mb-5 text-xl font-bold text-[#1E293B]">Form Alamat</h2>
            <div className="flex flex-col gap-5">
              <div>
                <label className={labelClass}>Alamat Lengkap*</label>
                <Input
                  type="text"
                  value={form.address}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField('address', e.target.value)}
                  placeholder="Nama jalan, Nomor rumah, Gang, dll"
                  className={inputClass('address')}
                />
                {errors.address && <p className={errorClass}>{errors.address}</p>}
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <div>
                  <label className={labelClass}>RT*</label>
                  <select
                    value={form.rt}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setField('rt', e.target.value)}
                    className={selectClass('rt')}
                  >
                    <option value="">Pilih RT</option>
                    {RT_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        RT {option}
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField('kelurahan', e.target.value)}
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField('kota', e.target.value)}
                    placeholder="Nama Kota"
                    className={inputClass()}
                  />
                </div>
                <div>
                  <label className={labelClass}>Kecamatan</label>
                  <Input
                    type="text"
                    value={form.kecamatan}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField('kecamatan', e.target.value)}
                    placeholder="Nama Kecamatan"
                    className={inputClass()}
                  />
                </div>
              </div>
              <div className="max-w-sm">
                <label className={labelClass}>Status Kependudukan</label>
                <select
                  value={form.status}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setField('status', e.target.value as FormData['status'])}
                  className={selectClass()}
                >
                  <option value="PENDUDUK_TETAP">Penduduk Tetap</option>
                  <option value="NGEKOST">Ngekost</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="mb-5 text-xl font-bold text-[#1E293B]">Form Status Keluarga</h2>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Nomor Kartu Keluarga*</label>
                  <Input
                    type="text"
                    maxLength={16}
                    value={form.noKK}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField('noKK', e.target.value.replace(/\D/g, ''))}
                    placeholder="Masukan 16 Digit Nomor KK"
                    className={inputClass('noKK')}
                  />
                  {errors.noKK && <p className={errorClass}>{errors.noKK}</p>}
                </div>

                <div>
                  <label className={labelClass}>Hubungan Dalam Keluarga</label>
                  <select
                    value={form.isHeadOfFamily ? 'Kepala Keluarga' : form.hubungan}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setField('hubungan', e.target.value)}
                    disabled={!!form.isHeadOfFamily}
                    className={selectClass('hubungan')}
                  >
                    <option value="">Pilih Hubungan</option>
                    {HUBUNGAN_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {errors.hubungan && <p className={errorClass}>{errors.hubungan}</p>}
                </div>

                {!form.isHeadOfFamily && (
                  <>
                    <div>
                      <label className={labelClass}>Nama Ayah Kandung*</label>
                      <Input
                        type="text"
                        value={form.namaAyah}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField('namaAyah', e.target.value)}
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
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField('namaIbu', e.target.value)}
                        placeholder="Masukan Nama Ibu"
                        className={inputClass('namaIbu')}
                      />
                      {errors.namaIbu && <p className={errorClass}>{errors.namaIbu}</p>}
                    </div>
                  </>
                )}
              </div>
            </div>

            {form.isHeadOfFamily && (
              <div className="rounded-2xl border border-gray-100 bg-[#FAFCFF] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-[#1E293B]">Anggota Kartu Keluarga</h3>
                    <p className="mt-1 text-sm text-[#64748B]">
                      Data anggota akan otomatis masuk ke KK baru dan ke daftar data penduduk saat konfirmasi akhir.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={addHouseholdMember}
                    className="rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1D4ED8]"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Anggota
                  </Button>
                </div>

                <div className="mt-5 flex flex-col gap-5">
                  {form.householdMembers.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#BFDBFE] bg-white px-4 py-6 text-sm text-[#64748B]">
                      Belum ada anggota tambahan. Jika hanya kepala keluarga, langsung lanjut ke konfirmasi.
                    </div>
                  ) : (
                    form.householdMembers.map((member, index) => (
                      <div key={index} className="rounded-2xl border border-gray-200 bg-white p-5">
                        <div className="mb-5 flex items-center justify-between gap-3">
                          <div>
                            <p className="font-bold text-[#1E293B]">Anggota #{index + 1}</p>
                            <p className="text-sm text-[#64748B]">Alamat, RT/RW, status penduduk, dan nomor KK akan mengikuti kepala keluarga.</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeHouseholdMember(index)}
                            className="rounded-full bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="mb-5">
                          <label className={labelClass}>Hubungan dalam Keluarga*</label>
                          <select
                            value={member.relationship}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                              setHouseholdMemberField(index, 'relationship', e.target.value)
                            }
                            className={selectClass(`members.${index}.relationship`)}
                          >
                            <option value="">Pilih Hubungan</option>
                            {MEMBER_RELATION_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                          {errors[`members.${index}.relationship`] && (
                            <p className={errorClass}>{errors[`members.${index}.relationship`]}</p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                          {renderPersonFields(
                            member,
                            `members.${index}`,
                            ((key, value) =>
                              setHouseholdMemberField(
                                index,
                                key as keyof HouseholdMemberForm,
                                value as HouseholdMemberForm[keyof HouseholdMemberForm],
                              )) as <K extends keyof PersonForm>(key: K, value: PersonForm[K]) => void,
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="mb-4 text-xl font-bold text-[#1E293B]">Konfirmasi Data</h2>

            <div className="mb-6">
              <div className="mb-3 flex items-center gap-2">
                <User className="h-5 w-5 text-[#2563EB]" />
                <h3 className="font-bold text-[#1E293B]">Data Diri</h3>
              </div>
              <div className="overflow-hidden rounded-xl border border-gray-100">
                {[
                  ['Peran', form.isHeadOfFamily ? 'Kepala Keluarga' : 'Anggota Keluarga'],
                  ['NIK', form.nik],
                  ['Nama Lengkap', form.name],
                  ['Tanggal Lahir', formatDate(form.birthDate)],
                  ['Tempat Lahir', form.birthPlace || '-'],
                  ['Pendidikan Terakhir', form.education || '-'],
                  ['Pekerjaan', form.occupation || '-'],
                  ['Agama', form.religion || '-'],
                  ['Jenis Kelamin', form.gender === 'L' ? 'Laki-laki' : form.gender === 'P' ? 'Perempuan' : '-'],
                  ['Status Perkawinan', form.maritalStatus || '-'],
                  ['Nomor Telepon', form.phone || 'Opsional'],
                ].map(([label, value], index) => (
                  <div
                    key={label}
                    className={`flex items-center justify-between px-4 py-3 text-sm ${index % 2 === 0 ? 'bg-white' : 'bg-[#FAFBFC]'}`}
                  >
                    <span className="font-semibold text-[#1E293B]">{label}</span>
                    <span className="text-right text-[#64748B]">{value}</span>
                  </div>
                ))}
              </div>
            </div>

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
                  ['Status Kependudukan', mapStatusLabel(form.status)],
                ].map(([label, value], index) => (
                  <div
                    key={label}
                    className={`flex items-center justify-between px-4 py-3 text-sm ${index % 2 === 0 ? 'bg-white' : 'bg-[#FAFBFC]'}`}
                  >
                    <span className="font-semibold text-[#1E293B]">{label}</span>
                    <span className="text-right text-[#64748B]">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <div className="mb-3 flex items-center gap-2">
                <Users className="h-5 w-5 text-[#2563EB]" />
                <h3 className="font-bold text-[#1E293B]">Status Keluarga</h3>
              </div>
              <div className="overflow-hidden rounded-xl border border-gray-100">
                {[
                  ['Nomor KK', form.noKK || '-'],
                  ['Status dalam Keluarga', form.isHeadOfFamily ? 'Kepala Keluarga' : form.hubungan || '-'],
                  ['Nama Ayah', form.isHeadOfFamily ? 'Tidak ditampilkan untuk Kepala Keluarga' : form.namaAyah || '-'],
                  ['Nama Ibu', form.isHeadOfFamily ? 'Tidak ditampilkan untuk Kepala Keluarga' : form.namaIbu || '-'],
                ].map(([label, value], index) => (
                  <div
                    key={label}
                    className={`flex items-center justify-between px-4 py-3 text-sm ${index % 2 === 0 ? 'bg-white' : 'bg-[#FAFBFC]'}`}
                  >
                    <span className="font-semibold text-[#1E293B]">{label}</span>
                    <span className="text-right text-[#64748B]">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {form.isHeadOfFamily && form.householdMembers.length > 0 && (
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#2563EB]" />
                  <h3 className="font-bold text-[#1E293B]">Anggota KK Baru</h3>
                </div>
                <div className="flex flex-col gap-3">
                  {form.householdMembers.map((member, index) => (
                    <div key={index} className="rounded-xl border border-gray-100 bg-[#FAFBFC] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[#1E293B]">{member.name || `Anggota #${index + 1}`}</p>
                          <p className="text-sm text-[#64748B]">
                            {member.relationship || '-'} • {member.nik || '-'}
                          </p>
                        </div>
                        <div className="text-right text-sm text-[#64748B]">
                          <p>{member.gender === 'L' ? 'Laki-laki' : member.gender === 'P' ? 'Perempuan' : '-'}</p>
                          <p>{formatDate(member.birthDate)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-4">
        {step > 1 && (
          <Button
            onClick={handleBack}
            className="rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-[#2563EB] transition hover:bg-gray-50"
          >
            Kembali
          </Button>
        )}
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
            {submitting ? 'Menyimpan...' : 'Simpan Data'}
          </Button>
        )}
      </div>

      <Dialog open={showExitModal} onOpenChange={setShowExitModal}>
        <DialogContent className="max-w-sm rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#1E293B]">Keluar Halaman?</DialogTitle>
            <DialogDescription className="text-sm text-[#64748B]">
              Anda memiliki data yang belum disimpan. Yakin ingin keluar dari halaman ini?
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex flex-col gap-3">
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
