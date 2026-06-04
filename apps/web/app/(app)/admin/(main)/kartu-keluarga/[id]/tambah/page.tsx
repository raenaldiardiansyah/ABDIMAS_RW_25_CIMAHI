'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, CheckCircle2, Search, X } from 'lucide-react';

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
  const { runWithToast } = useActionToast();
  const params = useParams<{ id: string }>();
  const householdId = params.id;

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

  const [showExitModal, setShowExitModal] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedCitizenQuery(citizenQuery.trim()), 400);
    return () => clearTimeout(timer);
  }, [citizenQuery]);

  useEffect(() => {
    async function load() {
      try {
        const response = await platformFetch<HouseholdDetail>(`/admin/households/${householdId}`);
        setHousehold(response.data);
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
          const citizenId = selectedCitizen
            ? selectedCitizen.id
            : (
                await platformFetch<{ id: string }>('/admin/citizens', {
                  method: 'POST',
                  body: JSON.stringify({
                    nik: form.nik,
                    name: form.name,
                    birthPlace: form.birthPlace || '-',
                    birthDate: form.birthDate ? new Date(form.birthDate).toISOString() : new Date().toISOString(),
                    gender: form.gender,
                    religion: form.religion,
                    maritalStatus: form.maritalStatus || 'Belum Kawin',
                    occupation: 'Belum/Tidak Bekerja',
                    education: form.education,
                    status: 'PENDUDUK_TETAP',
                    address: household?.address || '-',
                    rt: household?.rt || '-',
                    rw: household?.rw || '-',
                  }),
                })
              ).data.id;

          await platformFetch(`/admin/households/${householdId}/members`, {
            method: 'POST',
            body: JSON.stringify({
              citizenId,
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

      router.push(`/admin/kartu-keluarga/${householdId}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat menyimpan anggota keluarga');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-6 pb-24">
      {/* ── Header ── */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => setShowExitModal(true)}
          className="flex items-center gap-2 text-[16px] font-[600] text-[#2563EB] transition hover:opacity-80 bg-transparent border-none outline-none"
        >
          <ChevronLeft className="h-5 w-5" />
          Keluar Halaman
        </button>
      </div>

      <div className="rounded-[12px] bg-[#FFFFFF] px-[24px] py-[20px]" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <h1 className="text-xl font-bold text-[#2563EB]">Tambah Anggota Keluarga</h1>
        <p className="mt-1 text-sm text-[#7C8FE8]">
          {loadingHousehold ? 'Memuat...' : `Keluarga Bapk. ${household?.headCitizen?.name ?? '-'}`}
        </p>

        {/* ── Alert Info ── */}
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-[#2563EB]/20 bg-[#EFF6FF] p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#2563EB]" />
          <div>
            <p className="text-sm font-bold text-[#1E293B]">Periksa kembali sebelum menyimpan.</p>
            <p className="text-sm text-[#2563EB]">
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
        <div className="rounded-[12px] bg-[#FFFFFF] px-[24px] py-[20px]" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-[18px] font-bold text-[#1E293B]">Pilih dari Data Penduduk</h2>
                <p className="mt-1 text-sm text-[#64748B]">Cari warga yang sudah ada agar form terisi otomatis.</p>
              </div>
              <Link href="/admin/data-penduduk" className="text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8]">
                Buka Data Penduduk
              </Link>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3B82F6]" />
              <Input
                value={citizenQuery}
                onChange={(e: any) => {
                  setCitizenQuery(e.target.value);
                  if (selectedCitizen) setSelectedCitizen(null);
                }}
                placeholder="Cari nama atau NIK warga"
                className="h-11 rounded-xl border border-gray-200 px-11 pr-12"
              />
              {selectedCitizen ? (
                <button
                  type="button"
                  onClick={clearSelectedCitizen}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#64748B] hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            {selectedCitizen ? (
              <div className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-4">
                <p className="font-bold text-[#1E293B]">{selectedCitizen.name}</p>
                <p className="mt-1 text-sm text-[#2563EB]">{selectedCitizen.nik}</p>
                <p className="mt-2 text-sm text-[#64748B]">
                  Data personal diambil dari Data Penduduk. Anda hanya perlu memilih hubungan keluarga.
                </p>
              </div>
            ) : null}

            {!selectedCitizen && debouncedCitizenQuery ? (
              <div className="rounded-xl border border-gray-200 bg-white">
                {loadingCitizens ? (
                  <div className="px-4 py-3 text-sm text-[#64748B]">Mencari data penduduk...</div>
                ) : citizenOptions.length > 0 ? (
                  citizenOptions.map((citizen) => (
                    <button
                      key={citizen.id}
                      type="button"
                      onClick={() => handleCitizenSelect(citizen)}
                      className="flex w-full items-start justify-between gap-4 border-b border-gray-100 px-4 py-3 text-left last:border-b-0 hover:bg-[#F8FAFC]"
                    >
                      <div>
                        <p className="font-semibold text-[#1E293B]">{citizen.name}</p>
                        <p className="text-xs text-[#2563EB]">{citizen.nik}</p>
                      </div>
                      <div className="text-right text-xs text-[#64748B]">
                        <p>KK: {citizen.noKK || '-'}</p>
                        <p>RT {citizen.rt} / RW {citizen.rw}</p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-[#64748B]">Data penduduk tidak ditemukan.</div>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* Identitas Personal */}
        <div className="rounded-[12px] bg-[#FFFFFF] px-[24px] py-[20px]" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
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
                disabled={!!selectedCitizen}
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
                disabled={!!selectedCitizen}
                className="h-11 rounded-xl border border-gray-200 px-4"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="mb-1.5 block text-sm font-semibold text-[#1E293B]">Tanggal Lahir</Label>
              <Input
                type="date"
                value={form.birthDate}
                onChange={(e: any) => handleFieldChange('birthDate', e.target.value)}
                disabled={!!selectedCitizen}
                className="h-11 rounded-xl border border-gray-200 px-4 text-[#1E293B]"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="mb-1.5 block text-sm font-semibold text-[#1E293B]">Tempat Lahir</Label>
              <Input
                value={form.birthPlace}
                onChange={(e: any) => handleFieldChange('birthPlace', e.target.value)}
                placeholder="Contoh: Bandung"
                disabled={!!selectedCitizen}
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
                disabled={!!selectedCitizen}
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
        <div className="rounded-[12px] bg-[#FFFFFF] px-[24px] py-[20px]" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h2 className="mb-6 text-[18px] font-bold text-[#1E293B]">Hubungan Status</h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label className="mb-1.5 block text-sm font-semibold text-[#1E293B]">
                Hubungan dalam Keluarga<span className="text-red-500">*</span>
              </Label>
              <Select value={form.relationship} onValueChange={(val: any) => handleFieldChange('relationship', val)}>
                <SelectTrigger className="h-11 rounded-xl border border-gray-200 px-4 text-[#1E293B]">
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
                <SelectTrigger disabled={!!selectedCitizen} className="h-11 rounded-xl border border-gray-200 px-4 text-[#1E293B]">
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
        <div className="rounded-[12px] bg-[#FFFFFF] px-[24px] py-[20px]" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h2 className="mb-6 text-[18px] font-bold text-[#1E293B]">Tambahan</h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label className="mb-1.5 block text-sm font-semibold text-[#1E293B]">
                Agama<span className="text-red-500">*</span>
              </Label>
              <Select value={form.religion} onValueChange={(val: any) => handleFieldChange('religion', val)}>
                <SelectTrigger disabled={!!selectedCitizen} className="h-11 rounded-xl border border-gray-200 px-4 text-[#1E293B]">
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
                <SelectTrigger disabled={!!selectedCitizen} className="h-11 rounded-xl border border-gray-200 px-4 text-[#1E293B]">
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
        <div className="mt-4 flex justify-end gap-3 pb-8">
          <Button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-[#2563EB] px-8 py-6 text-base font-bold text-white shadow-sm transition hover:bg-[#1D4ED8]"
          >
            {loading ? 'Menyimpan...' : 'Simpan data Anggota'}
          </Button>
        </div>
      </form>

      {/* ── Exit Modal ── */}
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
