'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Save, CheckCircle2 } from 'lucide-react';

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

type HouseholdDetail = {
  id: string;
  kkNumber: string;
  address: string;
  rt: string;
  rw: string;
  headCitizen?: { name: string };
};

export default function TambahAnggotaKeluargaPage() {
  const router = useRouter();
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

  const handleSaveDraft = () => {
    localStorage.setItem(`draft_tambah_anggota_${householdId}`, JSON.stringify({ form }));
    setHasDraft(true);
    alert('Draft berhasil disimpan!');
  };

  const handleLoadDraft = () => {
    try {
      const saved = localStorage.getItem(`draft_tambah_anggota_${householdId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.form) setForm(parsed.form);
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
  };

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

  const handleFieldChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
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
      // 1. Buat Citizen
      const citizenResponse = await platformFetch<{ id: string }>('/admin/citizens', {
        method: 'POST',
        body: JSON.stringify({
          nik: form.nik,
          name: form.name,
          birthPlace: form.birthPlace || '-',
          birthDate: form.birthDate ? new Date(form.birthDate).toISOString() : new Date().toISOString(),
          gender: form.gender,
          religion: form.religion,
          maritalStatus: form.maritalStatus || 'Belum Kawin',
          occupation: 'Belum/Tidak Bekerja', // default
          education: form.education,
          status: 'PENDUDUK_TETAP',
          address: household?.address || '-',
          rt: household?.rt || '-',
          rw: household?.rw || '-',
        }),
      });

      // 2. Tambahkan ke KK
      await platformFetch(`/admin/households/${householdId}/members`, {
        method: 'POST',
        body: JSON.stringify({
          citizenId: citizenResponse.data.id,
          relationship: form.relationship,
        }),
      });

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
          onClick={() => hasDraft ? setShowDraftModal(true) : alert('Belum ada draft yang tersimpan.')}
          variant="outline"
          className="relative flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-[#1E293B] transition hover:bg-gray-50"
        >
          <Save className="h-4 w-4 text-[#3B82F6]" />
          Draft
          {hasDraft && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-red-500" />}
        </Button>
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
                <SelectTrigger className="h-11 rounded-xl border border-gray-200 px-4 text-[#1E293B]">
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
                <SelectTrigger className="h-11 rounded-xl border border-gray-200 px-4 text-[#1E293B]">
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
                <SelectTrigger className="h-11 rounded-xl border border-gray-200 px-4 text-[#1E293B]">
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
            type="button"
            onClick={handleSaveDraft}
            variant="outline"
            className="flex items-center gap-2 rounded-xl border border-[#2563EB] bg-white px-8 py-6 text-base font-semibold text-[#2563EB] transition hover:bg-blue-50 shadow-sm"
          >
            <Save className="h-5 w-5" />
            Simpan Draft
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-[#2563EB] px-8 py-6 text-base font-bold text-white shadow-sm transition hover:bg-[#1D4ED8]"
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
              className="w-full rounded-xl bg-[#2563EB] py-3 text-sm font-bold text-white transition hover:bg-[#1D4ED8]"
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
