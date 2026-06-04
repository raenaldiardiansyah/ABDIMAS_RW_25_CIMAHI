'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Save, CheckCircle2, Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { platformFetch } from '@/lib/api/platform';
import { useActionToast } from '@/lib/use-action-toast';

type HouseholdDetail = {
  id: string;
  kkNumber: string;
  address: string;
  rt: string;
  rw: string;
  headCitizen?: { name: string };
};

type CitizenOption = {
  id: string;
  nik: string;
  name: string;
  gender: string;
  birthDate: string;
  birthPlace: string;
  religion: string;
  maritalStatus: string;
  occupation: string;
  education: string;
  address: string;
  rt: string;
  rw: string;
  noKK?: string | null;
};

export default function TambahAnggotaKeluargaPage() {
  const router = useRouter();
  const { runWithToast, toast } = useActionToast();
  const householdId = 'warga-placeholder-id';

  const [household, setHousehold] = useState<HouseholdDetail | null>(null);
  const [loadingHousehold, setLoadingHousehold] = useState(true);

  const INITIAL_FORM = {
    nik: '',
    name: '',
    birthDate: '',
    birthPlace: '',
    gender: '',
    relationship: '',
    maritalStatus: '',
    religion: '',
    education: '',
  };

  const [form, setForm] = useState(INITIAL_FORM);
  const [selectedCitizen, setSelectedCitizen] = useState<CitizenOption | null>(null);
  const [citizenQuery, setCitizenQuery] = useState('');
  const [debouncedCitizenQuery, setDebouncedCitizenQuery] = useState('');
  const [citizenOptions, setCitizenOptions] = useState<CitizenOption[]>([]);
  const [loadingCitizens, setLoadingCitizens] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [hasDraft, setHasDraft] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(`draft_tambah_anggota_${householdId}`);
    if (saved) {
      setHasDraft(true);
    }
  }, [householdId]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedCitizenQuery(citizenQuery.trim()), 400);
    return () => clearTimeout(timer);
  }, [citizenQuery]);

  const handleSaveDraft = () => {
    localStorage.setItem(`draft_tambah_anggota_${householdId}`, JSON.stringify({ form, selectedCitizen }));
    setHasDraft(true);
    toast({
      title: 'Draft tersimpan',
      description: 'Draft anggota keluarga berhasil disimpan di browser ini.',
      variant: 'success',
    });
  };

  const handleLoadDraft = () => {
    try {
      const saved = localStorage.getItem(`draft_tambah_anggota_${householdId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.form) setForm(parsed.form);
        if (parsed.selectedCitizen) setSelectedCitizen(parsed.selectedCitizen);
      }
      setShowDraftModal(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteDraft = () => {
    localStorage.removeItem(`draft_tambah_anggota_${householdId}`);
    setHasDraft(false);
    setShowDraftModal(false);
    setForm(INITIAL_FORM);
    setSelectedCitizen(null);
  };

  useEffect(() => {
    async function load() {
      try {
        // const response = await platformFetch<HouseholdDetail>(`/admin/households/${householdId}`);
        // setHousehold(response.data);
        setHousehold({ id: 'dummy', kkNumber: 'Belum Terdaftar', address: '-', rt: '-', rw: '-', headCitizen: { name: 'Keluarga Anda' } });
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingHousehold(false);
      }
    }
    load();
  }, [householdId]);

  useEffect(() => {
    if (!debouncedCitizenQuery) {
      setCitizenOptions([]);
      return;
    }

    let active = true;

    async function loadCitizens() {
      setLoadingCitizens(true);
      try {
        const params = new URLSearchParams({
          q: debouncedCitizenQuery,
          limit: '6',
        });
        const response = await platformFetch<CitizenOption[]>(`/admin/citizens?${params.toString()}`);
        if (!active) return;
        setCitizenOptions(
          (response.data ?? []).filter((item) => item.noKK !== household?.kkNumber),
        );
      } catch (err) {
        console.error(err);
        if (!active) return;
        setCitizenOptions([]);
      } finally {
        if (active) setLoadingCitizens(false);
      }
    }

    void loadCitizens();
    return () => {
      active = false;
    };
  }, [debouncedCitizenQuery, household?.kkNumber]);

  const handleFieldChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCitizenSelect = (citizen: CitizenOption) => {
    setSelectedCitizen(citizen);
    setCitizenQuery(`${citizen.name} - ${citizen.nik}`);
    setCitizenOptions([]);
    setForm((prev) => ({
      ...prev,
      nik: citizen.nik,
      name: citizen.name,
      birthDate: citizen.birthDate ? citizen.birthDate.slice(0, 10) : '',
      birthPlace: citizen.birthPlace || '',
      gender: citizen.gender,
      maritalStatus: citizen.maritalStatus || '',
      religion: citizen.religion || '',
      education: citizen.education || '',
    }));
  };

  const clearSelectedCitizen = () => {
    setSelectedCitizen(null);
    setCitizenQuery('');
    setCitizenOptions([]);
    setForm(INITIAL_FORM);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.nik || form.nik.length < 16) {
      setError('NIK harus minimal 16 digit');
      return;
    }
    if (!form.name || !form.gender || !form.relationship || !form.religion || !form.education) {
      setError('Semua field yang bertanda bintang wajib diisi');
      return;
    }

    setLoading(true);

    try {
      await runWithToast(
        async () => {
          await platformFetch('/user-requests/member-create', {
            method: 'POST',
            body: JSON.stringify({
              nik: form.nik,
              name: form.name,
              birthPlace: form.birthPlace || '-',
              birthDate: form.birthDate ? new Date(form.birthDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
              gender: form.gender,
              religion: form.religion,
              maritalStatus: form.maritalStatus || 'Belum Kawin',
              education: form.education,
              relationship: form.relationship,
            }),
          });
        },
        {
          loading: 'Menambahkan anggota keluarga...',
          success: 'Anggota keluarga berhasil ditambahkan',
          error: 'Gagal menambahkan anggota keluarga',
        },
      );

      router.push(`/warga/kk`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat menyimpan anggota keluarga');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-6 p-4 md:p-6 pb-24">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setShowExitModal(true)}
          className="flex items-center gap-1 text-sm md:text-base font-semibold text-violet-600 transition hover:opacity-80 bg-transparent border-none outline-none"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="hidden sm:inline">Keluar Halaman</span>
          <span className="sm:hidden">Keluar</span>
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
          variant="outline"
          className="relative flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 md:px-5 py-2 md:py-2.5 text-xs md:text-sm font-semibold text-[#1E293B] transition hover:bg-gray-50"
        >
          <Save className="h-4 w-4 text-[#8B5CF6]" />
          <span className="hidden sm:inline">Draft</span>
          {hasDraft && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-red-500" />}
        </Button>
      </div>

      <div className="rounded-[12px] bg-[#FFFFFF] px-4 md:px-6 py-4 md:py-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <h1 className="text-lg md:text-xl font-bold text-[#7C3AED]">Tambah Anggota Keluarga</h1>
        <p className="mt-1 text-sm text-[#7C8FE8]">
          {loadingHousehold ? 'Memuat...' : `Keluarga Bapk. ${household?.headCitizen?.name ?? '-'}`}
        </p>

        {/* ── Alert Info ── */}
        <div className="mt-4 flex items-start md:items-center gap-3 rounded-xl border border-[#7C3AED]/20 bg-[#EDE9FE] p-4">
          <CheckCircle2 className="mt-0.5 md:mt-0 h-5 w-5 shrink-0 text-[#7C3AED]" />
          <div>
            <p className="text-sm font-bold text-[#1E293B]">Periksa kembali sebelum menyimpan.</p>
            <p className="text-xs md:text-sm text-[#7C3AED]">
              Pastikan semua data sudah benar. Kamu masih bisa kembali ke langkah sebelumnya untuk koreksi data
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      {/* ── Form Content ── */}
      <form id="anggota-form" onSubmit={handleSubmit} className="flex flex-col gap-6">

        {/* Identitas Personal */}
        <div className="rounded-[12px] bg-[#FFFFFF] px-4 md:px-6 py-4 md:py-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h2 className="mb-6 text-[18px] font-bold text-[#1E293B]">Identitas Personal</h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label className="mb-1.5 block text-sm font-semibold text-[#1E293B]">
                Nomor Induk Kependudukan<span className="text-red-500">*</span>
              </Label>
              <Input
                value={form.nik}
                onChange={(e: any) => handleFieldChange('nik', e.target.value)}
                placeholder="Masukan 16 Digit Nomor NIK"
                maxLength={16}
                className="h-11 rounded-xl border border-gray-200 px-4"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="mb-1.5 block text-sm font-semibold text-[#1E293B]">
                Nama Lengkap<span className="text-red-500">*</span>
              </Label>
              <Input
                value={form.name}
                onChange={(e: any) => handleFieldChange('name', e.target.value)}
                placeholder="Sesuai KTP"
                className="h-11 rounded-xl border border-gray-200 px-4"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="mb-1.5 block text-sm font-semibold text-[#1E293B]">Tanggal Lahir</Label>
              <Input
                type="date"
                value={form.birthDate}
                onChange={(e: any) => handleFieldChange('birthDate', e.target.value)}
                className="h-11 rounded-xl border border-gray-200 px-4 text-[#1E293B]"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="mb-1.5 block text-sm font-semibold text-[#1E293B]">Tempat Lahir</Label>
              <Input
                value={form.birthPlace}
                onChange={(e: any) => handleFieldChange('birthPlace', e.target.value)}
                placeholder="Contoh: Bandung"
                className="h-11 rounded-xl border border-gray-200 px-4"
              />
            </div>
            <div className="flex flex-col gap-3 md:col-span-2">
              <Label className="mb-1.5 block text-sm font-semibold text-[#1E293B]">
                Jenis Kelamin<span className="text-red-500">*</span>
              </Label>
              <RadioGroup
                value={form.gender}
                onValueChange={(val: string) => handleFieldChange('gender', val)}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="L" id="r-laki" />
                  <Label htmlFor="r-laki" className="cursor-pointer text-sm font-medium text-[#64748B]">
                    Laki-Laki
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="P" id="r-perempuan" />
                  <Label htmlFor="r-perempuan" className="cursor-pointer text-sm font-medium text-[#64748B]">
                    Perempuan
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </div>

        {/* Hubungan Status */}
        <div className="rounded-[12px] bg-[#FFFFFF] px-4 md:px-6 py-4 md:py-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h2 className="mb-6 text-[18px] font-bold text-[#1E293B]">Hubungan Status</h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label className="mb-1.5 block text-sm font-semibold text-[#1E293B]">
                Hubungan dalam Keluarga<span className="text-red-500">*</span>
              </Label>
              <Select value={form.relationship} onValueChange={(val: any) => handleFieldChange('relationship', val)}>
                <SelectTrigger className="[&>svg]:text-[#7C3AED] [&>svg]:opacity-100 h-11 rounded-xl border border-gray-200 px-4 text-[#1E293B]">
                  <SelectValue placeholder="Pilih Hubungan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Kepala Keluarga">Kepala Keluarga</SelectItem>
                  <SelectItem value="Suami">Suami</SelectItem>
                  <SelectItem value="Istri">Istri</SelectItem>
                  <SelectItem value="Anak">Anak</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="mb-1.5 block text-sm font-semibold text-[#1E293B]">Status Perkawinan</Label>
              <Select value={form.maritalStatus} onValueChange={(val: any) => handleFieldChange('maritalStatus', val)}>
                <SelectTrigger className="[&>svg]:text-[#7C3AED] [&>svg]:opacity-100 h-11 rounded-xl border border-gray-200 px-4 text-[#1E293B]">
                  <SelectValue placeholder="Status Perkawinan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Belum Kawin">Belum Kawin</SelectItem>
                  <SelectItem value="Kawin">Kawin</SelectItem>
                  <SelectItem value="Cerai Hidup">Cerai Hidup</SelectItem>
                  <SelectItem value="Cerai Mati">Cerai Mati</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Tambahan */}
        <div className="rounded-[12px] bg-[#FFFFFF] px-4 md:px-6 py-4 md:py-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h2 className="mb-6 text-[18px] font-bold text-[#1E293B]">Tambahan</h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label className="mb-1.5 block text-sm font-semibold text-[#1E293B]">
                Agama<span className="text-red-500">*</span>
              </Label>
              <Select value={form.religion} onValueChange={(val: any) => handleFieldChange('religion', val)}>
                <SelectTrigger className="[&>svg]:text-[#7C3AED] [&>svg]:opacity-100 h-11 rounded-xl border border-gray-200 px-4 text-[#1E293B]">
                  <SelectValue placeholder="Pilih Agama" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Islam">Islam</SelectItem>
                  <SelectItem value="Kristen">Kristen</SelectItem>
                  <SelectItem value="Katolik">Katolik</SelectItem>
                  <SelectItem value="Hindu">Hindu</SelectItem>
                  <SelectItem value="Buddha">Buddha</SelectItem>
                  <SelectItem value="Konghucu">Konghucu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="mb-1.5 block text-sm font-semibold text-[#1E293B]">
                Pendidikan Terakhir<span className="text-red-500">*</span>
              </Label>
              <Select value={form.education} onValueChange={(val: any) => handleFieldChange('education', val)}>
                <SelectTrigger className="[&>svg]:text-[#7C3AED] [&>svg]:opacity-100 h-11 rounded-xl border border-gray-200 px-4 text-[#1E293B]">
                  <SelectValue placeholder="Pendidikan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tidak/Belum Sekolah">Tidak/Belum Sekolah</SelectItem>
                  <SelectItem value="SD/Sederajat">SD/Sederajat</SelectItem>
                  <SelectItem value="SMP/Sederajat">SMP/Sederajat</SelectItem>
                  <SelectItem value="SMA/Sederajat">SMA/Sederajat</SelectItem>
                  <SelectItem value="Diploma I/II">Diploma I/II</SelectItem>
                  <SelectItem value="Akademi/Diploma III/S.Muda">Akademi/Diploma III/S.Muda</SelectItem>
                  <SelectItem value="Diploma IV/Strata I">Diploma IV/Strata I</SelectItem>
                  <SelectItem value="Strata II">Strata II</SelectItem>
                  <SelectItem value="Strata III">Strata III</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div className="mt-4 flex flex-col-reverse md:flex-row justify-end gap-3 pb-8">
          <Button
            type="button"
            onClick={handleSaveDraft}
            variant="outline"
            className="flex w-full md:w-auto items-center justify-center gap-2 rounded-xl border border-[#7C3AED] bg-white px-8 py-4 md:py-6 text-sm md:text-base font-semibold text-[#7C3AED] transition hover:bg-violet-50 shadow-sm"
          >
            <Save className="h-5 w-5" />
            Simpan Draft
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex w-full md:w-auto items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-8 py-4 md:py-6 text-sm md:text-base font-bold text-white shadow-sm transition hover:bg-[#6D28D9]"
          >
            {loading ? 'Menyimpan...' : 'Simpan data Anggota'}
          </Button>
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
            <Button
              onClick={handleLoadDraft}
              className="w-full rounded-xl bg-[#7C3AED] py-3 text-sm font-bold text-white transition hover:bg-[#6D28D9]"
            >
              Muat Draft
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
              className="w-full rounded-xl bg-[#7C3AED] py-3 text-sm font-bold text-white transition hover:bg-[#6D28D9]"
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
