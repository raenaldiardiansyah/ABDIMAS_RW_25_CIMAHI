'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Save, CheckCircle2, Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

type FormState = {
  kkNumber: string;
  headCitizenId: string;
  headCitizenName: string;
  address: string;
  rt: string;
  rw: string;
  kelurahan: string;
  kecamatan: string;
  issueDate: string;
  reason: string;
};

type CitizenOption = {
  id: string;
  nik: string;
  name: string;
  address: string;
  rt: string;
  rw: string;
  noKK: string | null;
};

export default function TambahKartuKeluargaPage() {
  const router = useRouter();
  const { runWithToast, toast } = useActionToast();

  const INITIAL_FORM: FormState = {
    kkNumber: '',
    headCitizenId: '',
    headCitizenName: '',
    address: '',
    rt: '',
    rw: '04', // default RW 04 based on instructions
    kelurahan: '',
    kecamatan: '',
    issueDate: '',
    reason: 'Baru', // default Baru
  };

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
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
    const saved = localStorage.getItem('draft_tambah_kk');
    if (saved) {
      setHasDraft(true);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedCitizenQuery(citizenQuery.trim()), 400);
    return () => clearTimeout(timer);
  }, [citizenQuery]);

  const handleSaveDraft = () => {
    localStorage.setItem('draft_tambah_kk', JSON.stringify({ form }));
    setHasDraft(true);
    toast({
      title: 'Draft tersimpan',
      description: 'Draft kartu keluarga berhasil disimpan di browser ini.',
      variant: 'success',
    });
  };

  const handleLoadDraft = () => {
    try {
      const saved = localStorage.getItem('draft_tambah_kk');
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
    localStorage.removeItem('draft_tambah_kk');
    setHasDraft(false);
    setShowDraftModal(false);
    setForm(INITIAL_FORM);
  };

  const handleFieldChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

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
        setCitizenOptions((response.data ?? []).filter((item) => !item.noKK));
      } catch (e) {
        console.error(e);
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
  }, [debouncedCitizenQuery]);

  const handleCitizenSelect = (citizen: CitizenOption) => {
    setCitizenQuery(`${citizen.name} - ${citizen.nik}`);
    setCitizenOptions([]);
    setForm((prev) => ({
      ...prev,
      headCitizenId: citizen.id,
      headCitizenName: citizen.name,
      address: citizen.address || prev.address,
      rt: citizen.rt || prev.rt,
      rw: citizen.rw || prev.rw,
    }));
  };

  const clearSelectedCitizen = () => {
    setCitizenQuery('');
    setCitizenOptions([]);
    setForm((prev) => ({
      ...prev,
      headCitizenId: '',
      headCitizenName: '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic Validation
    if (!form.kkNumber || form.kkNumber.length < 16) {
      setError('Nomor Kartu Keluarga harus minimal 16 digit');
      return;
    }
    if (!form.headCitizenName) {
      setError('Nama Kepala Keluarga wajib diisi');
      return;
    }
    if (!form.address || !form.rt || !form.rw || !form.kelurahan || !form.kecamatan) {
      setError('Semua field alamat dan wilayah wajib diisi');
      return;
    }

    setLoading(true);

    try {
      // Backend createHouseholdSchema expects:
      // kkNumber, headCitizenName, address, rt, rw
      // The extra fields (kelurahan, kecamatan, issueDate, reason) might not be in schema,
      // but we send them if we want, they will be ignored or we can append to address if needed.
      // For now, we'll construct the address to include them.
      const fullAddress = `${form.address}, Kelurahan ${form.kelurahan}, Kecamatan ${form.kecamatan}`;

      await runWithToast(
        () =>
          platformFetch('/admin/households', {
            method: 'POST',
            body: JSON.stringify({
              kkNumber: form.kkNumber,
              ...(form.headCitizenId ? { headCitizenId: form.headCitizenId } : { headCitizenName: form.headCitizenName }),
              address: fullAddress,
              rt: form.rt,
              rw: form.rw,
              status: 'ACTIVE',
            }),
          }),
        {
          loading: 'Menyimpan kartu keluarga...',
          success: 'Kartu keluarga berhasil disimpan',
          error: 'Gagal menyimpan kartu keluarga',
        },
      );

      router.push('/admin/kartu-keluarga');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat menyimpan Kartu Keluarga');
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
          className="relative flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-[#1E293B] transition hover:bg-gray-50"
        >
          <Save className="h-4 w-4 text-[#3B82F6]" />
          Draft
          {hasDraft && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-red-500" />}
        </Button>
      </div>

      {/* ── Title Card ── */}
      <div className="relative overflow-hidden rounded-[12px] bg-[#EEF2FF] p-6">
        <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-[#3B82F6]/[0.05]" />
        <div className="pointer-events-none absolute right-12 top-2 h-24 w-24 rounded-full bg-[#3B82F6]/[0.08]" />
        
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-[#3B82F6]">Tambah Kartu Keluarga Baru</h1>
          <p className="mt-1 text-sm text-[#3B82F6]/80">
            Isi semua field wajib bertanda bintang merah. Data akan tersimpan ke modul Kartu Keluarga.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-[12px] bg-[#EEF2FF] px-6 py-4 border border-blue-100">
        <CheckCircle2 className="h-5 w-5 text-[#3B82F6]" />
        <div>
          <p className="text-sm font-bold text-[#3B82F6]">Periksa kembali sebelum menyimpan.</p>
          <p className="text-sm text-[#3B82F6]/80">Pastikan semua data sudah benar. Kamu masih bisa kembali ke langkah sebelumnya untuk koreksi data</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      {/* ── Form Content ── */}
      <form id="kk-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="rounded-[12px] bg-[#FFFFFF] px-[24px] py-[20px]" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-[18px] font-bold text-[#1E293B]">Assign dari Data Penduduk</h2>
                <p className="mt-1 text-sm text-[#64748B]">Pilih warga yang sudah ada untuk dijadikan kepala keluarga.</p>
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
                  if (form.headCitizenId) {
                    setForm((prev) => ({ ...prev, headCitizenId: '' }));
                  }
                }}
                placeholder="Cari nama atau NIK warga"
                className="h-11 rounded-xl border border-gray-200 px-11 pr-12"
              />
              {form.headCitizenId ? (
                <button
                  type="button"
                  onClick={clearSelectedCitizen}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#64748B] hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            {form.headCitizenId ? (
              <div className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-4">
                <p className="font-bold text-[#1E293B]">{form.headCitizenName}</p>
                <p className="mt-2 text-sm text-[#64748B]">Data warga dipakai sebagai kepala keluarga untuk KK baru ini.</p>
              </div>
            ) : null}

            {!form.headCitizenId && debouncedCitizenQuery ? (
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
                        <p>RT {citizen.rt} / RW {citizen.rw}</p>
                        <p>{citizen.noKK ? `KK: ${citizen.noKK}` : 'Belum punya KK'}</p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-[#64748B]">Tidak ada warga tersedia. Warga yang sudah punya KK tidak ditampilkan.</div>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* Informasi Utama */}
        <div className="rounded-[12px] bg-[#FFFFFF] px-[24px] py-[20px]" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h2 className="mb-6 text-[18px] font-bold text-[#1E293B]">Informasi Utama</h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label className="mb-1.5 block text-sm font-semibold text-[#1E293B]">
                Nomor Kartu Keluarga<span className="text-red-500">*</span>
              </Label>
              <Input
                value={form.kkNumber}
                onChange={(e: any) => handleFieldChange('kkNumber', e.target.value.replace(/\D/g, ''))}
                placeholder="Masukan 16 Digit Nomor KK"
                maxLength={16}
                className="h-11 rounded-xl border border-gray-200 px-4"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="mb-1.5 block text-sm font-semibold text-[#1E293B]">
                Nama Kepala Keluarga<span className="text-red-500">*</span>
              </Label>
              <Input
                value={form.headCitizenName}
                onChange={(e: any) => handleFieldChange('headCitizenName', e.target.value)}
                placeholder="Sesuai KTP"
                disabled={!!form.headCitizenId}
                className="h-11 rounded-xl border border-gray-200 px-4"
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label className="mb-1.5 block text-sm font-semibold text-[#1E293B]">
                Alamat Lengkap<span className="text-red-500">*</span>
              </Label>
              <Input
                value={form.address}
                onChange={(e: any) => handleFieldChange('address', e.target.value)}
                placeholder="Nama jalan, Nomor rumah, Gang, dll"
                className="h-11 rounded-xl border border-gray-200 px-4"
              />
            </div>
          </div>
        </div>

        {/* Detail Wilayah dan Administrasi */}
        <div className="rounded-[12px] bg-[#FFFFFF] px-[24px] py-[20px]" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h2 className="mb-6 text-[18px] font-bold text-[#1E293B]">Detail Wilayah dan Administrasi</h2>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-2">
              <Label className="mb-1.5 block text-sm font-semibold text-[#1E293B]">RT</Label>
              <Select value={form.rt} onValueChange={(val: any) => handleFieldChange('rt', val)}>
                <SelectTrigger className="h-11 appearance-none rounded-xl border border-gray-200 bg-white px-4 text-sm text-[#1E293B] outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100">
                  <SelectValue placeholder="Pilih RT" />
                </SelectTrigger>
                <SelectContent>
                  {['01', '02', '03', '04', '05'].map((rt) => (
                    <SelectItem key={rt} value={rt}>
                      RT {rt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="mb-1.5 block text-sm font-semibold text-[#1E293B]">RW</Label>
              <Select value={form.rw} onValueChange={(val: any) => handleFieldChange('rw', val)} disabled>
                <SelectTrigger className="h-11 appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-[#1E293B] outline-none opacity-100">
                  <SelectValue placeholder="RW 04" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="04">RW 04</SelectItem>
                  <SelectItem value="25">RW 25</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="mb-1.5 block text-sm font-semibold text-[#1E293B]">
                Kelurahan/Desa<span className="text-red-500">*</span>
              </Label>
              <Input
                value={form.kelurahan}
                onChange={(e: any) => handleFieldChange('kelurahan', e.target.value)}
                placeholder="Nama Kelurahan"
                className="h-11 rounded-xl border border-gray-200 px-4"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="mb-1.5 block text-sm font-semibold text-[#1E293B]">
                Kecamatan<span className="text-red-500">*</span>
              </Label>
              <Input
                value={form.kecamatan}
                onChange={(e: any) => handleFieldChange('kecamatan', e.target.value)}
                placeholder="Nama Kecamatan"
                className="h-11 rounded-xl border border-gray-200 px-4"
              />
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <Label className="mb-1.5 block text-sm font-semibold text-[#1E293B]">Tanggal Pengeluaran KK</Label>
              <Input
                type="date"
                value={form.issueDate}
                onChange={(e: any) => handleFieldChange('issueDate', e.target.value)}
                className="h-11 rounded-xl border border-gray-200 px-4 text-[#1E293B]"
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label className="mb-1.5 block text-sm font-semibold text-[#1E293B]">
                Alasan Pembuatan<span className="text-red-500">*</span>
              </Label>
              <Select value={form.reason} onValueChange={(val: any) => handleFieldChange('reason', val)}>
                <SelectTrigger className="h-11 appearance-none rounded-xl border border-gray-200 bg-white px-4 text-sm text-[#1E293B] outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100">
                  <SelectValue placeholder="Baru" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Baru">Baru</SelectItem>
                  <SelectItem value="Pemisahan">Pemisahan KK</SelectItem>
                  <SelectItem value="Perubahan">Perubahan Data</SelectItem>
                  <SelectItem value="Hilang">KK Hilang / Rusak</SelectItem>
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
            {loading ? 'Menyimpan...' : 'Simpan Kartu Keluarga'}
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
