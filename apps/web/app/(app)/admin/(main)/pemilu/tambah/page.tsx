'use client';

import Link from 'next/link';
import { createPemiluEventSchema } from '@abdimas/contracts';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { ActivityTimeRangeField } from '@/components/admin/ActivityTimeRangeField';
import { RtScopePicker } from '@/components/admin/RtScopePicker';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { platformFetch } from '@/lib/api/platform';
import { useActionToast } from '@/lib/use-action-toast';

type PollingStationForm = {
  label: string;
  location: string;
  assignedRtScope: string[];
};

const REQUIREMENT_OPTIONS = [
  { value: 'Membawa KTP', label: 'Membawa KTP' },
  { value: 'Sudah terdaftar di DPT', label: 'Sudah terdaftar di DPT' },
  { value: 'Datang sesuai jam TPS', label: 'Datang sesuai jam TPS' },
  { value: 'Mengikuti arahan petugas', label: 'Mengikuti arahan petugas' },
  { value: 'Tidak diwakilkan', label: 'Tidak diwakilkan' },
  { value: 'Mematuhi tata tertib lokasi', label: 'Mematuhi tata tertib lokasi' },
] as const;

export default function AdminTambahPemiluPage() {
  const { runWithToast, toast } = useActionToast();
  const [title, setTitle] = useState('');
  const [requirements, setRequirements] = useState<string[]>([]);
  const [electionDate, setElectionDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [stations, setStations] = useState<PollingStationForm[]>([
    { label: '', location: '', assignedRtScope: [] },
  ]);

  const setStation = (index: number, next: Partial<PollingStationForm>) => {
    setStations((prev) => prev.map((station, i) => (i === index ? { ...station, ...next } : station)));
  };

  const addStation = () => setStations((prev) => [...prev, { label: '', location: '', assignedRtScope: [] }]);
  const removeStation = (index: number) => setStations((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));

  const toggleRequirement = (value: string) => {
    setRequirements((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
  };

  const isSubmitDisabled =
    title.trim().length < 3 ||
    !electionDate ||
    stations.some((station) => !station.label.trim() || !station.location.trim() || station.assignedRtScope.length === 0) ||
    requirements.length === 0;

  const handleSubmit = async () => {
    const payload = {
      title,
      requirements,
      pollingStations: stations,
      electionDate,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
    };
    const parsed = createPemiluEventSchema.safeParse(payload);
    if (!parsed.success) {
      toast({
        title: 'Validasi gagal',
        description: parsed.error.issues[0]?.message ?? 'Periksa kembali form pemilu.',
        variant: 'destructive',
      });
      return;
    }

    await runWithToast(
      () =>
        platformFetch('/admin/pemilu', {
          method: 'POST',
          body: JSON.stringify(parsed.data),
        }),
      {
        loading: 'Menyimpan agenda pemilu...',
        success: 'Agenda pemilu berhasil dibuat',
        error: 'Gagal menyimpan agenda pemilu',
      },
    );

    setTitle('');
    setRequirements([]);
    setElectionDate('');
    setStartTime('');
    setEndTime('');
    setStations([{ label: '', location: '', assignedRtScope: [] }]);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button asChild variant="ghost" className="mb-3 h-auto rounded-xl px-0 text-[color:var(--admin-subtle)] hover:bg-transparent hover:text-[color:var(--admin-heading)]">
          <Link href="/admin/pemilu">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke daftar pemilu
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-[color:var(--admin-heading)]">Tambah Pemilu</h1>
        <p className="mt-2 text-sm text-[color:var(--admin-subtle)]">
          Atur judul, persyaratan, lokasi TPS, assignment RT 01-03, dan jadwal yang otomatis masuk ke agenda warga.
        </p>
      </div>

      <Card className="rounded-3xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="pemilu-title">Judul Pemilu</Label>
            <Input id="pemilu-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Pemilu RW 25 2026" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pemilu-date">Tanggal</Label>
            <Input id="pemilu-date" type="date" value={electionDate} onChange={(e) => setElectionDate(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <ActivityTimeRangeField
              startTime={startTime}
              endTime={endTime}
              onStartTimeChange={setStartTime}
              onEndTimeChange={setEndTime}
            />
          </div>

          <div className="grid gap-2 md:col-span-2">
            <div className="rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-soft)] p-4">
              <h3 className="text-sm font-bold text-[color:var(--admin-heading)]">Persyaratan</h3>
              <p className="mt-1 text-xs text-[color:var(--admin-subtle)]">Pilih satu atau beberapa opsi persyaratan untuk pemilu ini.</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
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
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[color:var(--admin-heading)]">TPS dan Assignment RT</h2>
            <p className="mt-1 text-sm text-[color:var(--admin-subtle)]">Setiap TPS bisa ditugaskan ke satu atau beberapa RT.</p>
          </div>
          <Button type="button" variant="outline" className="rounded-2xl" onClick={addStation}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah TPS
          </Button>
        </div>

        <div className="mt-4 grid gap-4">
          {stations.map((station, index) => (
            <div key={`station-${index}`} className="rounded-3xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-soft)] p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-[color:var(--admin-heading)]">TPS #{index + 1}</h3>
                <Button type="button" variant="ghost" size="icon" className="rounded-full" onClick={() => removeStation(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Label TPS</Label>
                  <Input value={station.label} onChange={(e) => setStation(index, { label: e.target.value })} placeholder="Contoh: TPS 012" />
                </div>
                <div className="grid gap-2">
                  <Label>Lokasi TPS</Label>
                  <Input value={station.location} onChange={(e) => setStation(index, { location: e.target.value })} placeholder="Contoh: Aula RW 25" />
                </div>
              </div>

              <div className="mt-4">
                <RtScopePicker
                  label="Assign RT"
                  helperText="Pilih RT dari dropdown. Cakupan pemilu hanya RT 01 sampai RT 03."
                  value={station.assignedRtScope}
                  onChange={(value) => setStation(index, { assignedRtScope: value })}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="button" disabled={isSubmitDisabled} onClick={() => void handleSubmit()} className="rounded-2xl bg-[color:var(--admin-primary)] text-[color:var(--primary-foreground)] hover:bg-[color:var(--admin-primary-strong)]">
            Simpan Pemilu
          </Button>
        </div>
      </Card>
    </div>
  );
}
