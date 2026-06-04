'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { Calendar, CheckCircle2, ChevronLeft, Save, LogIn, LogOut, MapPin, Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { platformFetch } from '@/lib/api/platform';
import { useActionToast } from '@/lib/use-action-toast';

const STEPS = [
  { id: 1, label: 'Jenis Mutasi' },
  { id: 2, label: 'Informasi' },
  { id: 3, label: 'Konfirmasi' },
] as const;

const RT_OPTIONS = Array.from({ length: 5 }, (_, i) => String(i + 1).padStart(2, '0'));
const ALASAN_PINDAH_OPTIONS = ['Pekerjaan', 'Pendidikan', 'Keluarga', 'Perumahan', 'Lainnya'];

export default function TambahMutasiPage() {
  const router = useRouter();
  const { runWithToast, toast } = useActionToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    jenisMutasi: '',
    tanggalMutasi: '',
    alamatLama: '',
    alamatBaru: '',
    rtTujuan: '',
    alasanPindah: '',
    telepon: '',
  });

  const [showExitModal, setShowExitModal] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const draft = localStorage.getItem('warga_mutasi_draft');
    if (draft) setShowDraftModal(true);
  }, []);

  const handleFieldChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};
    if (step === 1) {
      if (!form.jenisMutasi) newErrors.jenisMutasi = 'Jenis mutasi wajib dipilih';
      if (!form.tanggalMutasi) newErrors.tanggalMutasi = 'Tanggal mutasi wajib diisi';
    }
    if (step === 2) {
      if (!form.alamatLama) newErrors.alamatLama = 'Alamat lama wajib diisi';
      if (!form.alamatBaru) newErrors.alamatBaru = 'Alamat baru wajib diisi';
      if (!form.rtTujuan) newErrors.rtTujuan = 'RT tujuan wajib dipilih';
      if (!form.alasanPindah) newErrors.alasanPindah = 'Alasan pindah wajib dipilih';
      if (!form.telepon) newErrors.telepon = 'Nomor telepon wajib diisi';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((p) => Math.min(STEPS.length, p + 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      toast({ title: 'Validasi gagal', description: 'Lengkapi semua data wajib', variant: 'destructive' });
    }
  };

  const handlePrev = () => {
    setCurrentStep((p) => Math.max(1, p - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveDraft = () => {
    localStorage.setItem('warga_mutasi_draft', JSON.stringify(form));
    toast({ title: 'Draft tersimpan', variant: 'success' });
  };

  const handleLoadDraft = () => {
    const draft = localStorage.getItem('warga_mutasi_draft');
    if (draft) setForm(JSON.parse(draft));
    setShowDraftModal(false);
  };

  const handleDeleteDraft = () => {
    localStorage.removeItem('warga_mutasi_draft');
    setShowDraftModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep < 3) return handleNext();
    if (!validateStep(3)) return;

    setLoading(true);
    try {
      await runWithToast(
        async () => {
          await platformFetch('/user-requests/mutation', {
            method: 'POST',
            body: JSON.stringify({
              type: form.jenisMutasi === 'Mutasi Masuk' ? 'MUTATION_IN' : 'MUTATION_OUT',
              mutationDate: form.tanggalMutasi,
              fromAddress: form.alamatLama,
              toAddress: form.alamatBaru,
              targetRt: form.rtTujuan,
              phone: form.telepon,
              reason: form.alasanPindah
            }),
          });
        },
        { loading: 'Mengirim permohonan...', success: 'Permohonan mutasi berhasil dikirim', error: 'Gagal mengirim mutasi' }
      );
      localStorage.removeItem('warga_mutasi_draft');
      router.push('/warga/layanan');
      router.refresh();
    } catch (err) {}
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-5 p-4 md:p-6 pb-24">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => setShowExitModal(true)} className="flex items-center gap-2 text-sm md:text-base font-semibold text-violet-600 transition hover:opacity-80">
          <ChevronLeft className="h-5 w-5" />
          Keluar
        </button>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm">
        <div className="relative z-10">
          <h1 className="text-xl md:text-2xl font-bold text-violet-600">Pengajuan Mutasi</h1>
          <p className="mt-1 text-xs md:text-sm text-gray-500">Isi formulir pengajuan mutasi penduduk.</p>
        </div>

        <div className="relative z-10 mt-6 md:mt-8 flex w-full items-center justify-between">
          {STEPS.map((step, idx) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            const circleStyle = isActive || isCompleted ? 'bg-transparent text-violet-600 border-[1.5px] border-violet-600' : 'bg-gray-100 text-gray-400 border-[1.5px] border-gray-200';
            const labelStyle = isActive || isCompleted ? 'text-violet-600 font-semibold' : 'text-gray-400 font-normal';
            return (
              <div key={step.id} className={`flex items-center ${idx < STEPS.length - 1 ? 'flex-1' : ''}`}>
                <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs md:text-sm font-bold ${circleStyle}`}>{step.id}</div>
                  <span className={`text-xs md:text-sm hidden md:block ${labelStyle}`}>{step.label}</span>
                </div>
                {idx < STEPS.length - 1 && <div className={`mx-2 md:mx-4 h-[1px] flex-1 rounded-full ${isCompleted ? 'bg-violet-600' : 'bg-gray-200'}`} />}
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {currentStep === 1 && (
          <div className="rounded-xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm">
            <h2 className="mb-4 text-lg md:text-xl font-bold text-gray-900">Jenis Mutasi</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button type="button" onClick={() => handleFieldChange('jenisMutasi', 'Mutasi Masuk')} className={`flex items-center justify-center gap-2 rounded-xl border-2 px-6 py-4 font-bold transition ${form.jenisMutasi === 'Mutasi Masuk' ? 'border-violet-600 bg-violet-50 text-violet-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                <LogIn className="h-5 w-5" /> Mutasi Masuk
              </button>
              <button type="button" onClick={() => handleFieldChange('jenisMutasi', 'Mutasi Keluar')} className={`flex items-center justify-center gap-2 rounded-xl border-2 px-6 py-4 font-bold transition ${form.jenisMutasi === 'Mutasi Keluar' ? 'border-violet-600 bg-violet-50 text-violet-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                <LogOut className="h-5 w-5" /> Mutasi Keluar
              </button>
            </div>
            {errors.jenisMutasi && <p className="mt-2 text-sm text-red-500">{errors.jenisMutasi}</p>}
            
            <div className="mt-6">
              <label className="mb-2 block text-sm font-semibold text-gray-900">Tanggal Mutasi<span className="text-red-500">*</span></label>
              <Input type="date" value={form.tanggalMutasi} onChange={(e) => handleFieldChange('tanggalMutasi', e.target.value)} className={`h-12 rounded-xl ${errors.tanggalMutasi ? 'border-red-500' : ''}`} />
              {errors.tanggalMutasi && <p className="mt-1 text-xs text-red-500">{errors.tanggalMutasi}</p>}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="rounded-xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm">
            <h2 className="mb-4 text-lg md:text-xl font-bold text-gray-900">Informasi Alamat</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-900">Alamat Lama</label>
                <Input value={form.alamatLama} onChange={(e) => handleFieldChange('alamatLama', e.target.value)} className="h-12 rounded-xl" />
                {errors.alamatLama && <p className="mt-1 text-xs text-red-500">{errors.alamatLama}</p>}
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-900">Alamat Baru</label>
                <Input value={form.alamatBaru} onChange={(e) => handleFieldChange('alamatBaru', e.target.value)} className="h-12 rounded-xl" />
                {errors.alamatBaru && <p className="mt-1 text-xs text-red-500">{errors.alamatBaru}</p>}
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-900">RT Tujuan</label>
                <Select value={form.rtTujuan} onValueChange={(v) => handleFieldChange('rtTujuan', v)}>
                  <SelectTrigger className="h-12 rounded-xl border border-gray-200 bg-white">
                    <SelectValue placeholder="Pilih RT" />
                  </SelectTrigger>
                  <SelectContent>{RT_OPTIONS.map((rt) => <SelectItem key={rt} value={rt}>RT {rt}</SelectItem>)}</SelectContent>
                </Select>
                {errors.rtTujuan && <p className="mt-1 text-xs text-red-500">{errors.rtTujuan}</p>}
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-900">Alasan Pindah</label>
                <Select value={form.alasanPindah} onValueChange={(v) => handleFieldChange('alasanPindah', v)}>
                  <SelectTrigger className="h-12 rounded-xl border border-gray-200 bg-white">
                    <SelectValue placeholder="Pilih alasan" />
                  </SelectTrigger>
                  <SelectContent>{ALASAN_PINDAH_OPTIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                </Select>
                {errors.alasanPindah && <p className="mt-1 text-xs text-red-500">{errors.alasanPindah}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-gray-900">Nomor Telepon</label>
                <Input value={form.telepon} onChange={(e) => handleFieldChange('telepon', e.target.value)} className="h-12 rounded-xl" placeholder="08..." />
                {errors.telepon && <p className="mt-1 text-xs text-red-500">{errors.telepon}</p>}
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2"><Settings className="h-5 w-5 text-violet-600" /><h2 className="text-lg font-bold text-gray-900">Konfirmasi Mutasi</h2></div>
              <div className="grid grid-cols-2 gap-y-4 border-t border-gray-200 pt-4 text-sm">
                <div className="font-semibold text-gray-900">Jenis</div><div className="text-right font-medium text-gray-900">{form.jenisMutasi}</div>
                <div className="font-semibold text-gray-900">Tanggal</div><div className="text-right font-medium text-gray-900">{form.tanggalMutasi}</div>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2"><MapPin className="h-5 w-5 text-violet-600" /><h2 className="text-lg font-bold text-gray-900">Alamat & Kontak</h2></div>
              <div className="grid grid-cols-2 gap-y-4 border-t border-gray-200 pt-4 text-sm">
                <div className="font-semibold text-gray-900">Alamat Lama</div><div className="text-right font-medium text-gray-900">{form.alamatLama}</div>
                <div className="font-semibold text-gray-900">Alamat Baru</div><div className="text-right font-medium text-gray-900">{form.alamatBaru}</div>
                <div className="font-semibold text-gray-900">RT Tujuan</div><div className="text-right font-medium text-gray-900">{form.rtTujuan}</div>
                <div className="font-semibold text-gray-900">Telepon</div><div className="text-right font-medium text-gray-900">{form.telepon}</div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-end gap-3 md:gap-4">
          <Button type="button" onClick={currentStep > 1 ? handlePrev : () => setShowExitModal(true)} variant="outline" className="h-10 md:h-12 rounded-xl px-4 md:px-8 font-bold text-violet-600">Kembali</Button>
          {currentStep < 3 && <Button type="button" onClick={handleSaveDraft} variant="outline" className="hidden md:flex h-12 items-center gap-2 rounded-xl px-8 font-bold text-violet-600"><Save className="h-5 w-5" /> Simpan Draft</Button>}
          {currentStep < 3 ? <Button type="button" onClick={handleNext} className="h-10 md:h-12 rounded-xl bg-violet-600 px-4 md:px-8 font-bold text-white hover:bg-violet-700">Lanjutkan</Button> : <Button type="submit" disabled={loading} className="h-10 md:h-12 rounded-xl bg-violet-600 px-4 md:px-8 font-bold text-white hover:bg-violet-700">{loading ? 'Memproses...' : 'Kirim'}</Button>}
        </div>
      </form>

      <Dialog open={showDraftModal} onOpenChange={setShowDraftModal}>
        <DialogContent className="max-w-sm rounded-3xl p-6">
          <DialogHeader><DialogTitle>Draft Tersimpan</DialogTitle><DialogDescription>Lanjutkan pengajuan sebelumnya?</DialogDescription></DialogHeader>
          <div className="mt-4 flex flex-col gap-3">
            <Button onClick={handleLoadDraft} className="w-full rounded-xl bg-violet-600 py-3 font-bold text-white">Muat Draft</Button>
            <Button onClick={handleDeleteDraft} variant="outline" className="w-full rounded-xl py-3 font-bold text-red-600">Hapus Draft</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showExitModal} onOpenChange={setShowExitModal}>
        <DialogContent className="max-w-sm rounded-3xl p-6">
          <DialogHeader><DialogTitle>Keluar Halaman?</DialogTitle><DialogDescription>Data belum disimpan.</DialogDescription></DialogHeader>
          <div className="mt-4 flex flex-col gap-3">
            <Button onClick={() => { handleSaveDraft(); router.push('/warga/layanan'); }} className="w-full rounded-xl bg-violet-600 py-3 font-bold text-white">Simpan Draft & Keluar</Button>
            <Button onClick={() => router.push('/warga/layanan')} variant="outline" className="w-full rounded-xl py-3 font-bold text-red-600">Keluar Tanpa Simpan</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
