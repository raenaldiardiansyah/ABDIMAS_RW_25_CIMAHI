'use client';

import Link from 'next/link';
import { createBansosProgramSchema } from '@abdimas/contracts';
import { ArrowLeft, PlusCircle } from '@phosphor-icons/react';
import { useState } from 'react';

import { ActivityTimeRangeField } from '@/components/admin/ActivityTimeRangeField';
import { RtScopePicker } from '@/components/admin/RtScopePicker';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { platformFetch } from '@/lib/api/platform';
import { useActionToast } from '@/lib/use-action-toast';

const REQUIREMENT_OPTIONS = [
  { value: 'SALARY_BELOW_UMR', label: 'Gaji di bawah UMR' },
  { value: 'NON_PNS', label: 'Bukan PNS' },
  { value: 'NON_PENSIONER', label: 'Bukan pensiunan' },
  { value: 'NON_MILITARY', label: 'Bukan TNI/Polri' },
  { value: 'LOW_INCOME', label: 'Keluarga berpenghasilan rendah' },
  { value: 'HAS_DEPENDENTS', label: 'Memiliki tanggungan keluarga' },
  { value: 'SENIOR_CITIZEN', label: 'Lansia' },
  { value: 'DISABILITY', label: 'Disabilitas' },
] as const;
const ASSISTANCE_TYPE_OPTIONS = ['Tunai', 'Sembako', 'Pendidikan', 'Kesehatan', 'Usaha', 'Lainnya'] as const;

type RequirementValue = (typeof REQUIREMENT_OPTIONS)[number]['value'];

export default function AdminTambahBansosPage() {
  const { runWithToast, toast } = useActionToast();
  const [title, setTitle] = useState('');
  const [assistanceType, setAssistanceType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [fundingSource, setFundingSource] = useState('');
  const [requirements, setRequirements] = useState<RequirementValue[]>([]);
  const [rtScope, setRtScope] = useState<string[]>([]);

  const toggleRequirement = (value: RequirementValue) => {
    setRequirements((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
  };

  const resetForm = () => {
    setTitle('');
    setAssistanceType('');
    setStartDate('');
    setEndDate('');
    setStartTime('');
    setEndTime('');
    setFundingSource('');
    setRequirements([]);
    setRtScope([]);
  };

  const handleSubmit = async () => {
    const payload = {
      title,
      assistanceType,
      startDate,
      endDate,
      startTime,
      endTime,
      fundingSource,
      generalRequirements: requirements,
      allowedRtScope: rtScope,
    };
    const parsed = createBansosProgramSchema.safeParse(payload);
    if (!parsed.success) {
      toast({
        title: 'Validasi gagal',
        description: parsed.error.issues[0]?.message ?? 'Periksa kembali form bansos.',
        variant: 'destructive',
      });
      return;
    }

    await runWithToast(
      async () => {
        await platformFetch('/admin/bansos', {
          method: 'POST',
          body: JSON.stringify(parsed.data),
        });
        resetForm();
      },
      {
        loading: 'Menyimpan bansos...',
        success: 'Bansos berhasil ditambahkan',
        error: 'Gagal menambahkan bansos',
      },
    );
  };

  const isSubmitDisabled =
    title.trim().length < 3 ||
    assistanceType.trim().length < 3 ||
    !startDate ||
    !endDate ||
    !startTime ||
    !endTime ||
    fundingSource.trim().length < 3 ||
    requirements.length === 0 ||
    rtScope.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button
          asChild
          variant="ghost"
          className="mb-4 h-auto rounded-xl px-0 text-[color:var(--admin-subtle)] hover:bg-transparent hover:text-[color:var(--admin-heading)]"
        >
          <Link href="/admin/bansos">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke daftar bansos
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-[color:var(--admin-heading)]">Tambah Bansos</h1>
        <p className="mt-2 text-sm leading-6 text-[color:var(--admin-subtle)]">
          Buat program bansos baru dengan jadwal tanggal dan jam, lalu tetapkan cakupan RT hanya untuk RT 01 sampai RT 03.
        </p>
      </div>

      <Card className="rounded-3xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--admin-success-soft)] text-[color:var(--admin-success-foreground)]">
            <PlusCircle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[color:var(--admin-heading)]">Form Program Bansos</h2>
            <p className="text-sm text-[color:var(--admin-subtle)]">Pisah URL untuk create flow admin.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="bansos-title">Judul Bansos</Label>
            <Input id="bansos-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Bansos Pangan RT 03" />
          </div>
          <div className="grid gap-2">
            <Label>Jenis Bantuan</Label>
            <Select value={assistanceType} onValueChange={setAssistanceType}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis bantuan" />
              </SelectTrigger>
              <SelectContent>
                {ASSISTANCE_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bansos-start-date">Tanggal Mulai</Label>
            <Input id="bansos-start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bansos-end-date">Tanggal Selesai</Label>
            <Input id="bansos-end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bansos-funding">Sumber Dana</Label>
            <Input id="bansos-funding" value={fundingSource} onChange={(e) => setFundingSource(e.target.value)} placeholder="Contoh: APBD / CSR / Dana RW" />
          </div>
          <div className="grid gap-2">
            <ActivityTimeRangeField
              startTime={startTime}
              endTime={endTime}
              onStartTimeChange={setStartTime}
              onEndTimeChange={setEndTime}
            />
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-soft)] p-4">
            <h3 className="text-sm font-bold text-[color:var(--admin-heading)]">Persyaratan Umum Bansos</h3>
            <p className="mt-1 text-xs text-[color:var(--admin-subtle)]">Bisa dipilih sesuai jenis bansos.</p>
            <div className="mt-4 grid gap-3">
              {REQUIREMENT_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex items-start gap-3 rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] px-3 py-3 text-sm text-[color:var(--admin-body)]"
                >
                  <Checkbox checked={requirements.includes(option.value)} onCheckedChange={() => toggleRequirement(option.value)} />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <RtScopePicker
            label="Ruang Lingkup RT"
            helperText="Pilih satu atau beberapa RT dari dropdown. Maksimal cakupan hanya RT 01 sampai RT 03."
            value={rtScope}
            onChange={setRtScope}
          />
        </div>

        <div className="mt-5 flex justify-end">
          <Button
            type="button"
            disabled={isSubmitDisabled}
            onClick={() => void handleSubmit()}
            className="rounded-2xl bg-[color:var(--admin-success-foreground)] px-5 text-white hover:opacity-90"
          >
            Simpan Bansos
          </Button>
        </div>
      </Card>
    </div>
  );
}
