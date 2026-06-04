'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Gift,
  Flag,
  LockKeyhole,
  Megaphone,
  Settings,
  Moon,
  Sun,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { PlatformApiError, platformFetch } from '@/lib/api/platform';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';

import { useTheme } from '@/app/(app)/warga/_components/theme-context';
import { useIdentity } from '@/app/(app)/warga/_components/identity-context';
import { WargaPage, WargaPageBody } from '@/app/(app)/warga/_components/warga-page';

import PageHeader from '@/components/ui/page-header';
import FeatureCard from '@/components/warga/FeatureCard';
import SlideUpSheet from '@/components/warga/SlideUpSheet';
import StatusPopup from '@/components/warga/StatusPopup';
import FormInput from '@/components/warga/FormInput';
import FormDatePicker from '@/components/warga/FormDatePicker';
import FormCheckbox from '@/components/warga/FormCheckbox';
import FormTextarea from '@/components/warga/FormTextarea';
import FormFileUpload from '@/components/warga/FormFileUpload';
import CommentCarousel from '@/components/warga/CommentCarousel';
import QuickActionsPanel from '@/components/warga/QuickActionsPanel';

import { formatBansosPeriod } from '@/lib/bansos';

import type {
  BansosResult,
  PemiluResult,
} from '@/types/warga';

type ActiveSheet = 'bansos' | 'pemilu' | 'aspirasi' | 'penduduk' | 'mutasi' | 'tambahKk' | null;

type PopupState = {
  variant: 'success' | 'warning' | 'error';
  judul: string;
} | null;

type PendudukForm = {
  nik: string;
  name: string;
  birthPlace: string;
  birthDate: string;
  gender: string;
  religion: string;
  maritalStatus: string;
  education: string;
  relationship: string;
};

type MutationForm = {
  type: 'MUTATION_IN' | 'MUTATION_OUT' | '';
  mutationDate: string;
  fromAddress: string;
  toAddress: string;
  targetRt: string;
  phone: string;
  reason: string;
};

type HouseholdForm = {
  kkNumber: string;
  address: string;
  rt: string;
  rw: string;
};

const INITIAL_PENDUDUK_FORM: PendudukForm = {
  nik: '',
  name: '',
  birthPlace: '',
  birthDate: '',
  gender: '',
  religion: '',
  maritalStatus: '',
  education: '',
  relationship: '',
};

const INITIAL_MUTATION_FORM: MutationForm = {
  type: '',
  mutationDate: '',
  fromAddress: '',
  toAddress: '',
  targetRt: '',
  phone: '',
  reason: '',
};

const INITIAL_HOUSEHOLD_FORM: HouseholdForm = {
  kkNumber: '',
  address: '',
  rt: '',
  rw: '25',
};

const RT_OPTIONS = ['01', '02', '03', '04', '05'];

const BANSOS_PROGRAMS = [
  {
    id: 'PKH',
    name: 'Program Keluarga Harapan',
    desc: 'PKH · Bantuan tunai bersyarat',
  },
  {
    id: 'BPNT',
    name: 'Bantuan Pangan Non-Tunai',
    desc: 'BPNT · Sembako & kebutuhan pokok',
  },
  {
    id: 'BST',
    name: 'Bantuan Sosial Tunai',
    desc: 'BST · Bantuan langsung tunai',
  },
];
void BANSOS_PROGRAMS;

type BansosProgramCard = {
  id: string;
  title: string;
  assistanceType: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  fundingSource: string;
  generalRequirements: string[];
  allowedRtScope: string[];
  userApplication?: {
    requestId: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    applicantName: string;
    incomeAmount: string | null;
    notes: string | null;
    createdAt: string;
  } | null;
};

export default function WargaHomePage() {
  const { isDark, toggleDark } = useTheme();
  const identity = useIdentity();
  const { toast } = useToast();

  const isRestricted = identity.verificationStatus !== 'VERIFIED';

  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);
  const [popup, setPopup] = useState<PopupState>(null);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

  const [bansosNik, setBansosNik] = useState('');
  const [bansosNama, setBansosNama] = useState('');
  const [bansosProgram, setBansosProgram] = useState('');
  const [bansosIncome, setBansosIncome] = useState('');
  const [bansosNotes, setBansosNotes] = useState('');
  const [bansosCertificateFile, setBansosCertificateFile] = useState<File | null>(null);
  const [bansosHousePhotoFile, setBansosHousePhotoFile] = useState<File | null>(null);
  const [bansosIncomeProofFile, setBansosIncomeProofFile] = useState<File | null>(null);
  const [bansosPrograms, setBansosPrograms] = useState<BansosProgramCard[]>([]);
  const [bansosProgramsLoading, setBansosProgramsLoading] = useState(false);
  const [bansosProgramsError, setBansosProgramsError] = useState<string | null>(null);
  const [bansosResult, setBansosResult] = useState<BansosResult | null>(null);

  const [pemiluNik, setPemiluNik] = useState('');
  const [pemiluTgl, setPemiluTgl] = useState('');
  const [pemiluResult, setPemiluResult] = useState<PemiluResult | null>(null);
  const [usingOwnPemiluData, setUsingOwnPemiluData] = useState(false);

  const [aspirasiJenis, setAspirasiJenis] = useState<string[]>([]);
  const [aspirasiUraian, setAspirasiUraian] = useState('');
  const [aspirasiFile, setAspirasiFile] = useState<File | null>(null);
  const [submittedAspirasiJenis, setSubmittedAspirasiJenis] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState<null | 'bansos' | 'pemilu' | 'aspirasi' | 'penduduk' | 'mutasi' | 'tambahKk'>(null);
  const [aspirationRefreshKey, setAspirationRefreshKey] = useState(0);
  const [pendudukForm, setPendudukForm] = useState<PendudukForm>(INITIAL_PENDUDUK_FORM);
  const [mutationForm, setMutationForm] = useState<MutationForm>(INITIAL_MUTATION_FORM);
  const [householdForm, setHouseholdForm] = useState<HouseholdForm>(INITIAL_HOUSEHOLD_FORM);
  const [pendudukErrors, setPendudukErrors] = useState<Partial<Record<keyof PendudukForm, string>>>({});
  const [mutationErrors, setMutationErrors] = useState<Partial<Record<keyof MutationForm, string>>>({});
  const [householdErrors, setHouseholdErrors] = useState<Partial<Record<keyof HouseholdForm, string>>>({});

  useEffect(() => {
    let active = true;

    async function loadPrograms() {
      try {
        setBansosProgramsLoading(true);
        setBansosProgramsError(null);
        const response = await platformFetch<BansosProgramCard[]>('/bansos/programs?page=1&limit=20');
        if (!active) return;
        setBansosPrograms(response.data);
      } catch (error) {
        if (!active) return;
        console.error(error);
        setBansosPrograms([]);
        setBansosProgramsError(error instanceof Error ? error.message : 'Gagal memuat program bansos.');
      } finally {
        if (active) setBansosProgramsLoading(false);
      }
    }

    if (!isRestricted) void loadPrograms();

    return () => {
      active = false;
    };
  }, [isRestricted]);

  const selectedBansosProgram = useMemo(
    () => bansosPrograms.find((program) => program.id === bansosProgram) ?? null,
    [bansosProgram, bansosPrograms],
  );

  const handleBansosSubmit = async () => {
    setSubmitting('bansos');
    try {
      setBlockedMessage(null);
      const formData = new FormData();
      formData.set('programId', bansosProgram);
      formData.set('incomeAmount', bansosIncome);
      formData.set('notes', bansosNotes);
      if (bansosCertificateFile) formData.set('povertyCertificate', bansosCertificateFile);
      if (bansosHousePhotoFile) formData.set('housePhoto', bansosHousePhotoFile);
      if (bansosIncomeProofFile) formData.set('incomeProof', bansosIncomeProofFile);

      const { data } = await platformFetch<{ payload: Record<string, unknown> }>('/requests/bansos', {
        method: 'POST',
        body: formData,
      });

      const result: BansosResult = {
        status: 'diverifikasi',
        nama: String((data.payload?.applicantName as string | undefined) ?? bansosNama),
        nik: String((data.payload?.applicantNik as string | undefined) ?? bansosNik),
        program: ((selectedBansosProgram?.title || 'PKH') as BansosResult['program']),
        keterangan: 'Pengajuan bansos berhasil dikirim dan sedang menunggu review admin.',
      };

      setBansosResult(result);
      setBansosIncome('');
      setBansosNotes('');
      setBansosCertificateFile(null);
      setBansosHousePhotoFile(null);
      setBansosIncomeProofFile(null);
      const programResponse = await platformFetch<BansosProgramCard[]>('/bansos/programs?page=1&limit=20');
      setBansosPrograms(programResponse.data);
      setActiveSheet(null);
      setPopup({
        variant: 'warning',
        judul: 'Pengajuan Bansos Terkirim',
      });
      toast({
        title: 'Pengajuan bansos berhasil',
        description: 'Berkas warga sudah masuk ke inbox admin untuk ditinjau.',
        variant: 'success',
      });
    } catch (error) {
      if (error instanceof PlatformApiError && error.code === 'VERIFICATION_REQUIRED') {
        const message =
          error.verificationStatus === 'REJECTED' && error.rejectionReason
            ? `Verifikasi ditolak: ${error.rejectionReason}`
            : 'Fitur ini menunggu verifikasi admin RW/RT.';
        setBlockedMessage(message);
        toast({
          title: 'Akses ditolak',
          description: message,
          variant: 'destructive',
        });
      } else {
        const message = error instanceof Error ? error.message : 'Gagal mengirim pengajuan bansos.';
        setBlockedMessage(message);
        toast({
          title: 'Gagal mengirim bansos',
          description: message,
          variant: 'destructive',
        });
      }
    } finally {
      setSubmitting(null);
    }
  };

  const handlePemiluSubmit = async () => {
    setSubmitting('pemilu');
    try {
      setBlockedMessage(null);
      const { data } = await platformFetch<{
        registered: boolean;
        tps?: string;
        message: string;
        checkedAt: string;
      }>('/services/pemilu/check', {
        method: 'POST',
        body: JSON.stringify({ nik: pemiluNik }),
      });

      const result: PemiluResult = data.registered
        ? {
            status: 'terdaftar',
            nik: pemiluNik,
            tps: data.tps || '-',
            keterangan: data.message,
          }
        : {
            status: 'tidak_terdaftar',
            nik: pemiluNik,
            keterangan: data.message,
          };

      setPemiluResult(result);
      setActiveSheet(null);
      setPopup({
        variant: data.registered ? 'success' : 'error',
        judul: data.registered ? 'Terdaftar Sebagai Pemilih' : 'Belum Terdaftar di DPT',
      });
      toast({
        title: data.registered ? 'Cek pemilu berhasil' : 'Cek pemilu selesai',
        description: data.message,
        variant: data.registered ? 'success' : 'destructive',
      });
    } catch (error) {
      if (error instanceof PlatformApiError && error.code === 'VERIFICATION_REQUIRED') {
        const message =
          error.verificationStatus === 'REJECTED' && error.rejectionReason
            ? `Verifikasi ditolak: ${error.rejectionReason}`
            : 'Fitur ini menunggu verifikasi admin RW/RT.';
        setBlockedMessage(message);
        toast({
          title: 'Akses ditolak',
          description: message,
          variant: 'destructive',
        });
      } else {
        const message = error instanceof Error ? error.message : 'Gagal memeriksa status pemilu.';
        setBlockedMessage(message);
        toast({
          title: 'Gagal memeriksa pemilu',
          description: message,
          variant: 'destructive',
        });
      }
    } finally {
      setSubmitting(null);
    }
  };

  const handlePemiluSelfCheck = async () => {
    setSubmitting('pemilu');
    setUsingOwnPemiluData(true);
    try {
      setBlockedMessage(null);
      const { data } = await platformFetch<{
        eventId: string;
        title: string;
        electionDate: string;
        startTime: string | null;
        endTime: string | null;
        tpsLabel: string;
        tpsLocation: string;
        assignedRt: string;
      } | null>('/pemilu/assignment');

      if (!data) {
        setPemiluResult({
          status: 'tidak_terdaftar',
          nama: identity.userName,
          keterangan: 'Belum ada pemilu aktif untuk data RT Anda atau TPS belum ditetapkan admin.',
        });
        setActiveSheet(null);
        setPopup({
          variant: 'error',
          judul: 'Belum Ada TPS Aktif',
        });
        return;
      }

      setPemiluResult({
        status: 'terdaftar',
        nama: identity.userName,
        electionTitle: data.title,
        electionDate: data.electionDate,
        assignedRt: data.assignedRt,
        tps: data.tpsLabel,
        tpsLocation: data.tpsLocation,
        keterangan: `Anda terdaftar di ${data.tpsLabel}.`,
      });
      setActiveSheet(null);
      setPopup({
        variant: 'success',
        judul: 'TPS Ditemukan',
      });
      toast({
        title: 'Data pemilu ditemukan',
        description: `TPS Anda: ${data.tpsLabel} - ${data.tpsLocation}`,
        variant: 'success',
      });
    } catch (error) {
      if (error instanceof PlatformApiError && error.code === 'VERIFICATION_REQUIRED') {
        const message =
          error.verificationStatus === 'REJECTED' && error.rejectionReason
            ? `Verifikasi ditolak: ${error.rejectionReason}`
            : 'Fitur ini menunggu verifikasi admin RW/RT.';
        setBlockedMessage(message);
        toast({
          title: 'Akses ditolak',
          description: message,
          variant: 'destructive',
        });
      } else {
        const message = error instanceof Error ? error.message : 'Gagal memeriksa data pemilu.';
        setBlockedMessage(message);
        toast({
          title: 'Gagal memeriksa pemilu',
          description: message,
          variant: 'destructive',
        });
      }
    } finally {
      setSubmitting(null);
      setUsingOwnPemiluData(false);
    }
  };

  const handleAspirasiSubmit = async () => {
    setSubmitting('aspirasi');
    try {
      setBlockedMessage(null);
      await platformFetch('/aspirations', {
        method: 'POST',
        body: JSON.stringify({
          title: `Aspirasi - ${aspirasiJenis[0] || 'masukan'}`,
          message: aspirasiUraian,
          category: aspirasiJenis[0] || 'masukan',
        }),
      });

      setActiveSheet(null);
      setAspirationRefreshKey((value) => value + 1);
      setPopup({
        variant: 'success',
        judul: 'Laporan Berhasil Dikirim',
      });
      toast({
        title: 'Laporan berhasil dikirim',
        description: 'Aduan Anda sudah masuk dan menunggu tanggapan admin.',
        variant: 'success',
      });
      setSubmittedAspirasiJenis(aspirasiJenis);
      setAspirasiJenis([]);
      setAspirasiUraian('');
      setAspirasiFile(null);
    } catch (error) {
      if (error instanceof PlatformApiError && error.code === 'VERIFICATION_REQUIRED') {
        const message =
          error.verificationStatus === 'REJECTED' && error.rejectionReason
            ? `Verifikasi ditolak: ${error.rejectionReason}`
            : 'Fitur ini menunggu verifikasi admin RW/RT.';
        setBlockedMessage(message);
        toast({
          title: 'Akses ditolak',
          description: message,
          variant: 'destructive',
        });
      } else {
        const message = error instanceof Error ? error.message : 'Gagal mengirim aspirasi.';
        setBlockedMessage(message);
        toast({
          title: 'Gagal mengirim laporan',
          description: message,
          variant: 'destructive',
        });
      }
    } finally {
      setSubmitting(null);
    }
  };

  const openQuickActionSheet = (sheet: string) => {
    if (isRestricted && (sheet === 'aspirasi' || sheet === 'penduduk' || sheet === 'mutasi' || sheet === 'tambahKk')) {
      setBlockedMessage('Akun Anda perlu diverifikasi admin RW/RT sebelum mengirim pengajuan.');
      toast({
        title: 'Akses terbatas',
        description: 'Tunggu verifikasi admin sebelum menggunakan fitur pengajuan.',
        variant: 'destructive',
      });
      return;
    }
    if (sheet === 'aspirasi' || sheet === 'penduduk' || sheet === 'mutasi' || sheet === 'tambahKk') {
      setBlockedMessage(null);
      setActiveSheet(sheet);
    }
  };

  const updatePendudukForm = (field: keyof PendudukForm, value: string) => {
    setPendudukForm((prev) => ({ ...prev, [field]: value }));
    setPendudukErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const updateMutationForm = (field: keyof MutationForm, value: string) => {
    setMutationForm((prev) => ({ ...prev, [field]: value }));
    setMutationErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const updateHouseholdForm = (field: keyof HouseholdForm, value: string) => {
    setHouseholdForm((prev) => ({ ...prev, [field]: value }));
    setHouseholdErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validatePendudukForm = () => {
    const nextErrors: Partial<Record<keyof PendudukForm, string>> = {};
    if (!/^\d{16}$/.test(pendudukForm.nik)) nextErrors.nik = 'NIK wajib 16 digit angka.';
    if (pendudukForm.name.trim().length < 2) nextErrors.name = 'Nama wajib diisi minimal 2 karakter.';
    if (!pendudukForm.gender) nextErrors.gender = 'Jenis kelamin wajib dipilih.';
    if (!pendudukForm.relationship.trim()) nextErrors.relationship = 'Hubungan keluarga wajib dipilih.';
    if (!pendudukForm.religion.trim()) nextErrors.religion = 'Agama wajib dipilih.';
    if (!pendudukForm.maritalStatus.trim()) nextErrors.maritalStatus = 'Status perkawinan wajib dipilih.';
    if (!pendudukForm.education.trim()) nextErrors.education = 'Pendidikan wajib dipilih.';
    setPendudukErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateMutationForm = () => {
    const nextErrors: Partial<Record<keyof MutationForm, string>> = {};
    if (!mutationForm.type) nextErrors.type = 'Jenis mutasi wajib dipilih.';
    if (!mutationForm.mutationDate) nextErrors.mutationDate = 'Tanggal mutasi wajib diisi.';
    if (mutationForm.type === 'MUTATION_IN' && !mutationForm.toAddress.trim()) nextErrors.toAddress = 'Alamat tujuan wajib diisi untuk mutasi masuk.';
    if (mutationForm.type === 'MUTATION_OUT' && !mutationForm.fromAddress.trim()) nextErrors.fromAddress = 'Alamat asal wajib diisi untuk mutasi keluar.';
    if (!mutationForm.targetRt) nextErrors.targetRt = 'RT tujuan wajib dipilih.';
    if (!mutationForm.phone.trim()) nextErrors.phone = 'Nomor telepon wajib diisi.';
    if (!mutationForm.reason.trim()) nextErrors.reason = 'Alasan mutasi wajib diisi.';
    setMutationErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateHouseholdForm = () => {
    const nextErrors: Partial<Record<keyof HouseholdForm, string>> = {};
    if (!/^\d{16}$/.test(householdForm.kkNumber)) nextErrors.kkNumber = 'Nomor KK wajib 16 digit angka.';
    if (householdForm.address.trim().length < 5) nextErrors.address = 'Alamat wajib diisi minimal 5 karakter.';
    if (!/^\d{1,3}$/.test(householdForm.rt)) nextErrors.rt = 'RT wajib dipilih.';
    if (!/^\d{1,3}$/.test(householdForm.rw)) nextErrors.rw = 'RW wajib diisi.';
    setHouseholdErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handlePendudukSubmit = async () => {
    if (!validatePendudukForm()) return;
    setSubmitting('penduduk');
    try {
      await platformFetch('/user-requests/member-create', {
        method: 'POST',
        body: JSON.stringify({
          nik: pendudukForm.nik,
          name: pendudukForm.name.trim(),
          birthPlace: pendudukForm.birthPlace.trim() || undefined,
          birthDate: pendudukForm.birthDate || undefined,
          gender: pendudukForm.gender,
          religion: pendudukForm.religion,
          maritalStatus: pendudukForm.maritalStatus,
          education: pendudukForm.education,
          relationship: pendudukForm.relationship,
        }),
      });
      setPendudukForm(INITIAL_PENDUDUK_FORM);
      setActiveSheet(null);
      setPopup({ variant: 'warning', judul: 'Pengajuan Data Penduduk Terkirim' });
      toast({
        title: 'Pengajuan data penduduk terkirim',
        description: 'Data akan masuk ke admin untuk diverifikasi.',
        variant: 'success',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal mengirim pengajuan data penduduk.';
      toast({ title: 'Gagal mengirim pengajuan', description: message, variant: 'destructive' });
    } finally {
      setSubmitting(null);
    }
  };

  const handleMutationSubmit = async () => {
    if (!validateMutationForm()) return;
    setSubmitting('mutasi');
    try {
      await platformFetch('/user-requests/mutation', {
        method: 'POST',
        body: JSON.stringify({
          type: mutationForm.type,
          mutationDate: mutationForm.mutationDate,
          fromAddress: mutationForm.fromAddress.trim() || undefined,
          toAddress: mutationForm.toAddress.trim() || undefined,
          targetRt: mutationForm.targetRt,
          phone: mutationForm.phone.trim(),
          reason: mutationForm.reason.trim(),
        }),
      });
      setMutationForm(INITIAL_MUTATION_FORM);
      setActiveSheet(null);
      setPopup({ variant: 'warning', judul: 'Pengajuan Mutasi Terkirim' });
      toast({
        title: 'Pengajuan mutasi terkirim',
        description: 'Permohonan mutasi menunggu review admin.',
        variant: 'success',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal mengirim pengajuan mutasi.';
      toast({ title: 'Gagal mengirim mutasi', description: message, variant: 'destructive' });
    } finally {
      setSubmitting(null);
    }
  };

  const handleHouseholdSubmit = async () => {
    if (!validateHouseholdForm()) return;
    setSubmitting('tambahKk');
    try {
      await platformFetch('/user-requests/household-create', {
        method: 'POST',
        body: JSON.stringify({
          kkNumber: householdForm.kkNumber,
          address: householdForm.address.trim(),
          rt: householdForm.rt,
          rw: householdForm.rw,
        }),
      });
      setHouseholdForm(INITIAL_HOUSEHOLD_FORM);
      setActiveSheet(null);
      setPopup({ variant: 'warning', judul: 'Pengajuan KK Terkirim' });
      toast({
        title: 'Pengajuan KK terkirim',
        description: 'Permohonan kartu keluarga menunggu review admin.',
        variant: 'success',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal mengirim pengajuan KK.';
      toast({ title: 'Gagal mengirim KK', description: message, variant: 'destructive' });
    } finally {
      setSubmitting(null);
    }
  };

  const closeSheet = () => setActiveSheet(null);

  const closePopup = () => {
    setPopup(null);
    setBansosResult(null);
    setPemiluResult(null);
  };

  const isBansosSubmitDisabled =
    bansosNik.length !== 16 ||
    !bansosNama.trim() ||
    !bansosProgram ||
    !bansosIncome.trim() ||
    !bansosCertificateFile ||
    !bansosHousePhotoFile ||
    !bansosIncomeProofFile;
  const isPemiluSubmitDisabled = pemiluNik.length !== 16 || !pemiluTgl;

  return (
    <WargaPage>
      <PageHeader
        title="Beranda Warga"
        variant="brand"
        className="pb-7"
        rightSlot={
          <>
            <Button
              asChild
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-xl border-white/20 bg-white/10 text-primary-foreground hover:bg-white/15"
            >
              <Link href="/warga/settings" aria-label="Pengaturan">
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={toggleDark}
              className="h-10 w-10 rounded-xl border-white/20 bg-white/10 text-primary-foreground hover:bg-white/15"
              aria-label="Ubah tema"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </>
        }
        bottomSlot={
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-white/14 text-xl font-bold shadow-lg">
              {(identity.userName?.[0] ?? 'U').toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-bold leading-tight">{identity.userName}</p>
              <p className="mt-1 truncate font-mono text-xs text-primary-foreground/70">{identity.maskedNik}</p>
              {identity.verificationStatus === 'VERIFIED' && (
                <Badge
                  variant="secondary"
                  className="mt-2 w-fit gap-1.5 rounded-full border border-white/20 bg-white/15 px-2 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-none"
                >
                  <CheckCircle2 className="size-3.5" aria-hidden="true" />
                  Terverifikasi
                </Badge>
              )}
              {identity.verificationStatus === 'PENDING' && (
                <Badge
                  variant="secondary"
                  className="mt-2 w-fit rounded-full border border-[color:var(--status-warning)]/40 bg-[color:var(--status-warning)]/20 px-2 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-none"
                >
                  Menunggu Verifikasi
                </Badge>
              )}
              {identity.verificationStatus === 'REJECTED' && (
                <Badge
                  variant="secondary"
                  className="mt-2 w-fit rounded-full border border-[color:var(--status-error)]/40 bg-[color:var(--status-error)]/20 px-2 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-none"
                >
                  Verifikasi Ditolak
                </Badge>
              )}
            </div>
          </div>
        }
      />

      <WargaPageBody className="flex flex-col gap-3">
        {isRestricted && (
          <Alert className="relative overflow-hidden rounded-3xl border border-[color:var(--accent-amber)]/25 bg-[color:var(--accent-amber)]/10 p-4 shadow-sm">
            <div className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full bg-[color:var(--accent-amber)]/20 blur-2xl" />

            <div className="relative flex gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-(--accent-amber)/25 bg-(--accent-amber)/15">
                <AlertCircle className="size-5 text-(--accent-amber)" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <AlertTitle className="text-sm font-bold tracking-tight text-foreground">
                    Akses terbatas
                  </AlertTitle>

                  <span className="shrink-0 rounded-full bg-(--accent-amber)/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-(--accent-amber)">
                    {identity.verificationStatus}
                  </span>
                </div>

                <AlertDescription className="text-xs leading-relaxed text-muted-foreground">
                  {identity.verificationStatus === 'REJECTED'
                    ? `Verifikasi ditolak. ${identity.rejectionReason ? `Alasan: ${identity.rejectionReason}` : 'Hubungi admin RW/RT.'}`
                    : 'Akun Anda belum diverifikasi RW/RT. Sebagian fitur masih dikunci sampai proses verifikasi selesai.'}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        {blockedMessage && (
          <Alert className="rounded-3xl border border-[color:var(--status-error)]/20 bg-[color:var(--status-error)]/8 p-4 shadow-sm">
            <AlertDescription className="text-xs font-medium text-foreground">{blockedMessage}</AlertDescription>
          </Alert>
        )}

        <QuickActionsPanel isRestricted={isRestricted} onAction={openQuickActionSheet} />

        {isRestricted ? (
          <VerificationRequiredCard rejectionReason={identity.rejectionReason} />
        ) : (
          <>
            <FeatureCard
              icon={Gift}
              judul="Ajukan Bansos"
              deskripsi="Kirim pengajuan bansos lengkap dengan SKTM, foto rumah, dan bukti gaji."
              badge="Bantuan Sosial"
              variant="large"
              tone="primary"
              onClick={() => setActiveSheet('bansos')}
              delay={50}
            />

            <div className="grid grid-cols-2 gap-3">
              <FeatureCard
                icon={Flag}
                judul="Cek DPT/TPS"
                deskripsi="Periksa status pemilih Anda di DPT."
                badge="Pemilu"
                variant="compact"
                tone="sky"
                onClick={() => setActiveSheet('pemilu')}
                delay={100}
              />

              <FeatureCard
                icon={Megaphone}
                judul="Aspirasi"
                deskripsi="Kirim masukan atau keluhan Anda."
                badge="Laporan"
                variant="compact"
                tone="violet"
                onClick={() => setActiveSheet('aspirasi')}
                delay={150}
              />
            </div>

            {bansosPrograms.length > 0 ? (
              <section className="mt-2 flex flex-col gap-3">
                <div>
                  <h2 className="text-sm font-bold text-foreground">Program Bansos Warga</h2>
                  <p className="mt-1 text-xs text-muted-foreground">Nama warga akan tampil pada kartu program yang sudah diajukan.</p>
                </div>
                <div className="grid gap-3">
                  {bansosPrograms.map((program) => (
                    <Card key={program.id} className="rounded-3xl border border-input bg-card shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge className="rounded-full bg-primary/10 text-primary shadow-none">{program.assistanceType}</Badge>
                              {program.userApplication ? (
                                <Badge
                                  className={cn(
                                    'rounded-full shadow-none',
                                    program.userApplication.status === 'APPROVED'
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : program.userApplication.status === 'REJECTED'
                                        ? 'bg-red-50 text-red-700'
                                        : 'bg-amber-50 text-amber-700',
                                  )}
                                >
                                  {program.userApplication.status === 'APPROVED'
                                    ? 'Disetujui'
                                    : program.userApplication.status === 'REJECTED'
                                      ? 'Ditolak'
                                      : 'Menunggu'}
                                </Badge>
                              ) : null}
                            </div>
                            <h3 className="mt-3 text-base font-bold text-foreground">{program.title}</h3>
                            <p className="mt-1 text-sm text-muted-foreground">{formatBansosPeriod(program)} • {program.fundingSource}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="rounded-full"
                            onClick={() => {
                              setBansosProgram(program.id);
                              setActiveSheet('bansos');
                            }}
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="mt-4 rounded-2xl bg-muted/30 p-3">
                          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Cakupan RT</p>
                          <p className="mt-1 text-sm font-medium text-foreground">{program.allowedRtScope.map((rt) => `RT ${rt}`).join(', ')}</p>
                        </div>

                        {program.userApplication ? (
                          <div className="mt-4 rounded-2xl border border-primary/15 bg-primary/5 p-3">
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary">Atas Nama Warga</p>
                            <p className="mt-1 text-sm font-semibold text-foreground">{program.userApplication.applicantName}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Pengajuan {new Date(program.userApplication.createdAt).toLocaleDateString('id-ID')}
                            </p>
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}

        <CommentCarousel refreshKey={aspirationRefreshKey} />
      </WargaPageBody>

      <SlideUpSheet
        isOpen={activeSheet === 'bansos'}
        onClose={closeSheet}
        title="Ajukan Bansos"
        deskripsi="Lengkapi data dan unggah dokumen warga untuk pengajuan bansos."
      >
        <div className="flex flex-col gap-5 overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="bansos-nik">NIK (16 Digit)</Label>
            <Input
              id="bansos-nik"
              type="text"
              placeholder="Masukkan NIK Anda"
              maxLength={16}
              inputMode="numeric"
              value={bansosNik}
              onChange={(e) =>
                setBansosNik(e.target.value.replace(/\D/g, '').slice(0, 16))
              }
              className="h-12 rounded-xl bg-background"
            />
            <p className="text-[11px] text-muted-foreground">
              Nomor Induk Kependudukan sesuai KTP.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bansos-nama">Nama Lengkap</Label>
            <Input
              id="bansos-nama"
              type="text"
              placeholder="Sesuai KTP"
              value={bansosNama}
              onChange={(e) => setBansosNama(e.target.value)}
              className="h-12 rounded-xl bg-background"
            />
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Jenis Program Bansos</Label>

            <RadioGroup
              value={bansosProgram}
              onValueChange={setBansosProgram}
              className="grid gap-2"
            >
              {bansosPrograms.map((program) => {
                const isSelected = bansosProgram === program.id;

                return (
                  <Label
                    key={program.id}
                    htmlFor={program.id}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition-colors',
                      isSelected
                        ? 'border-primary/30 bg-primary text-primary-foreground'
                        : 'border-border bg-card hover:bg-muted/60'
                    )}
                  >
                    <RadioGroupItem
                      id={program.id}
                      value={program.id}
                      className={cn(
                        isSelected ? 'border-primary-foreground/60 text-primary-foreground' : undefined,
                      )}
                    />

                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          'text-sm font-semibold',
                          isSelected ? 'text-primary-foreground' : 'text-foreground'
                        )}
                      >
                        {program.title}
                      </p>
                      <p
                        className={cn(
                          'mt-0.5 text-xs',
                          isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'
                        )}
                      >
                        {program.assistanceType} • {formatBansosPeriod(program)}
                      </p>
                    </div>
                  </Label>
                );
              })}
            </RadioGroup>
            {bansosProgramsLoading ? (
              <p className="text-xs text-muted-foreground">Memuat program bansos...</p>
            ) : null}
            {!bansosProgramsLoading && bansosProgramsError ? (
              <p className="text-xs text-destructive">{bansosProgramsError}</p>
            ) : null}
            {!bansosProgramsLoading && !bansosProgramsError && bansosPrograms.length === 0 ? (
              <p className="text-xs text-muted-foreground">Belum ada program bansos dari admin.</p>
            ) : null}
          </div>

          <FormInput
            label="Nominal Gaji / Penghasilan"
            placeholder="Contoh: Rp1.500.000 / bulan"
            value={bansosIncome}
            onChange={(e) => setBansosIncome(e.target.value)}
          />

          <FormTextarea
            label="Catatan Tambahan"
            value={bansosNotes}
            onChange={setBansosNotes}
            placeholder="Tambahkan kondisi keluarga atau alasan pengajuan."
            maxLength={255}
          />

          <FormFileUpload
            label="Surat Keterangan Tidak Mampu"
            file={bansosCertificateFile}
            onChange={setBansosCertificateFile}
            accept=".jpg,.jpeg,.png,.pdf"
          />

          <FormFileUpload
            label="Foto Rumah"
            file={bansosHousePhotoFile}
            onChange={setBansosHousePhotoFile}
            accept=".jpg,.jpeg,.png,.webp"
          />

          <FormFileUpload
            label="Bukti Gaji"
            file={bansosIncomeProofFile}
            onChange={setBansosIncomeProofFile}
            accept=".jpg,.jpeg,.png,.pdf"
          />

          <Button
            onClick={handleBansosSubmit}
            disabled={isBansosSubmitDisabled || submitting === 'bansos'}
            className="h-12 rounded-xl font-semibold"
          >
            {submitting === 'bansos' ? 'Mengirim...' : 'Kirim Pengajuan'}
          </Button>
        </div>
      </SlideUpSheet>

      <SlideUpSheet
        isOpen={activeSheet === 'pemilu'}
        onClose={closeSheet}
        title="Cek Status Pemilih"
        deskripsi="Periksa apakah Anda sudah terdaftar di Daftar Pemilih Tetap (DPT)."
      >
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
            <p className="text-sm font-semibold text-foreground">Gunakan data akun aktif</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Sistem akan mengecek pemilu aktif dan TPS Anda langsung dari data warga terverifikasi.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={handlePemiluSelfCheck}
              disabled={submitting === 'pemilu'}
              className="mt-3 h-11 w-full rounded-xl"
            >
              {usingOwnPemiluData ? 'Memeriksa data saya...' : 'Cek Dengan Data Saya'}
            </Button>
          </div>

          <Separator />

          <FormInput
            label="NIK (16 Digit)"
            placeholder="Masukkan NIK Anda"
            value={pemiluNik}
            onChange={(e) =>
              setPemiluNik(e.target.value.replace(/\D/g, '').slice(0, 16))
            }
            maxLength={16}
            inputMode="numeric"
          />

          <FormDatePicker
            label="Tanggal Lahir"
            value={pemiluTgl}
            onChange={setPemiluTgl}
          />

          <Button
            onClick={handlePemiluSubmit}
            disabled={isPemiluSubmitDisabled || submitting === 'pemilu'}
            className="mt-2 h-12 rounded-xl font-semibold"
          >
            {submitting === 'pemilu' ? 'Memproses...' : 'Konfirmasi'}
          </Button>
        </div>
      </SlideUpSheet>

      <SlideUpSheet
        isOpen={activeSheet === 'aspirasi'}
        onClose={closeSheet}
        title="Sampaikan Aspirasi"
        deskripsi="Kirimkan masukan atau keluhan Anda untuk perbaikan lingkungan."
      >
        <div className="flex flex-col gap-4">
          <FormCheckbox
            label="Jenis Laporan"
            options={[
              { value: 'masukan', label: 'Masukan' },
              { value: 'keluhan', label: 'Keluhan' },
            ]}
            selected={aspirasiJenis}
            onChange={setAspirasiJenis}
            singleSelect
          />

          <FormTextarea
            label="Uraian"
            value={aspirasiUraian}
            onChange={setAspirasiUraian}
            placeholder="Jelaskan masukan atau keluhan Anda secara detail..."
            maxLength={500}
          />

          <FormFileUpload
            label="Lampiran Bukti (Opsional)"
            file={aspirasiFile}
            onChange={setAspirasiFile}
          />

          <Button
            onClick={handleAspirasiSubmit}
            disabled={aspirasiJenis.length === 0 || !aspirasiUraian.trim() || submitting === 'aspirasi'}
            className="mt-2 h-12 rounded-xl font-semibold"
          >
            {submitting === 'aspirasi' ? 'Mengirim...' : 'Konfirmasi'}
          </Button>
        </div>
      </SlideUpSheet>

      <SlideUpSheet
        isOpen={activeSheet === 'penduduk'}
        onClose={closeSheet}
        title="Pengajuan Data Penduduk"
        deskripsi="Data akan dikirim ke admin untuk diverifikasi sebelum masuk ke data warga."
      >
        <div className="flex max-h-[72dvh] flex-col gap-4 overflow-y-auto pr-1">
          <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
            <p className="text-sm font-semibold text-foreground">Identitas warga</p>
            <p className="mt-1 text-xs text-muted-foreground">Gunakan data sesuai KTP atau dokumen keluarga.</p>
          </div>

          <FormInput
            label="NIK"
            value={pendudukForm.nik}
            onChange={(e) => updatePendudukForm('nik', e.target.value.replace(/\D/g, '').slice(0, 16))}
            placeholder="16 digit NIK"
            maxLength={16}
            inputMode="numeric"
            error={pendudukErrors.nik}
          />
          <FormInput
            label="Nama Lengkap"
            value={pendudukForm.name}
            onChange={(e) => updatePendudukForm('name', e.target.value)}
            placeholder="Sesuai KTP"
            error={pendudukErrors.name}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormInput
              label="Tempat Lahir"
              value={pendudukForm.birthPlace}
              onChange={(e) => updatePendudukForm('birthPlace', e.target.value)}
              placeholder="Contoh: Cimahi"
            />
            <FormInput
              label="Tanggal Lahir"
              type="date"
              value={pendudukForm.birthDate}
              onChange={(e) => updatePendudukForm('birthDate', e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-semibold text-foreground">Jenis Kelamin</Label>
            <RadioGroup
              value={pendudukForm.gender}
              onValueChange={(value) => updatePendudukForm('gender', value)}
              className="grid grid-cols-2 gap-2"
            >
              {[
                ['L', 'Laki-laki'],
                ['P', 'Perempuan'],
              ].map(([value, label]) => (
                <Label
                  key={value}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-2xl border p-3 text-sm font-semibold',
                    pendudukForm.gender === value ? 'border-primary/30 bg-primary text-primary-foreground' : 'border-border bg-card'
                  )}
                >
                  <RadioGroupItem value={value} />
                  {label}
                </Label>
              ))}
            </RadioGroup>
            {pendudukErrors.gender ? <p className="text-xs text-destructive">{pendudukErrors.gender}</p> : null}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SelectField
              label="Hubungan Keluarga"
              value={pendudukForm.relationship}
              onValueChange={(value) => updatePendudukForm('relationship', value)}
              placeholder="Pilih hubungan"
              error={pendudukErrors.relationship}
              options={['Kepala Keluarga', 'Suami', 'Istri', 'Anak', 'Famili Lain']}
            />
            <SelectField
              label="Agama"
              value={pendudukForm.religion}
              onValueChange={(value) => updatePendudukForm('religion', value)}
              placeholder="Pilih agama"
              error={pendudukErrors.religion}
              options={['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu']}
            />
            <SelectField
              label="Status Perkawinan"
              value={pendudukForm.maritalStatus}
              onValueChange={(value) => updatePendudukForm('maritalStatus', value)}
              placeholder="Pilih status"
              error={pendudukErrors.maritalStatus}
              options={['Belum Kawin', 'Kawin', 'Cerai Hidup', 'Cerai Mati']}
            />
            <SelectField
              label="Pendidikan"
              value={pendudukForm.education}
              onValueChange={(value) => updatePendudukForm('education', value)}
              placeholder="Pilih pendidikan"
              error={pendudukErrors.education}
              options={['Tidak/Belum Sekolah', 'SD/Sederajat', 'SMP/Sederajat', 'SMA/Sederajat', 'Diploma', 'Sarjana']}
            />
          </div>

          <Button
            type="button"
            onClick={handlePendudukSubmit}
            disabled={submitting === 'penduduk'}
            className="h-12 rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {submitting === 'penduduk' ? 'Mengirim...' : 'Kirim Pengajuan'}
          </Button>
        </div>
      </SlideUpSheet>

      <SlideUpSheet
        isOpen={activeSheet === 'mutasi'}
        onClose={closeSheet}
        title="Pengajuan Mutasi"
        deskripsi="Ajukan mutasi masuk atau keluar untuk direview admin."
      >
        <div className="flex max-h-[72dvh] flex-col gap-4 overflow-y-auto pr-1">
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-semibold text-foreground">Jenis Mutasi</Label>
            <RadioGroup
              value={mutationForm.type}
              onValueChange={(value) => updateMutationForm('type', value)}
              className="grid grid-cols-2 gap-2"
            >
              {[
                ['MUTATION_IN', 'Mutasi Masuk'],
                ['MUTATION_OUT', 'Mutasi Keluar'],
              ].map(([value, label]) => (
                <Label
                  key={value}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-2xl border p-3 text-sm font-semibold',
                    mutationForm.type === value ? 'border-primary/30 bg-primary text-primary-foreground' : 'border-border bg-card'
                  )}
                >
                  <RadioGroupItem value={value} />
                  {label}
                </Label>
              ))}
            </RadioGroup>
            {mutationErrors.type ? <p className="text-xs text-destructive">{mutationErrors.type}</p> : null}
          </div>

          <FormInput
            label="Tanggal Mutasi"
            type="date"
            value={mutationForm.mutationDate}
            onChange={(e) => updateMutationForm('mutationDate', e.target.value)}
            error={mutationErrors.mutationDate}
          />
          <FormTextarea
            label="Alamat Asal"
            value={mutationForm.fromAddress}
            onChange={(value) => updateMutationForm('fromAddress', value)}
            placeholder="Alamat lama atau asal perpindahan"
            maxLength={255}
            error={mutationErrors.fromAddress}
          />
          <FormTextarea
            label="Alamat Tujuan"
            value={mutationForm.toAddress}
            onChange={(value) => updateMutationForm('toAddress', value)}
            placeholder="Alamat baru atau tujuan perpindahan"
            maxLength={255}
            error={mutationErrors.toAddress}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SelectField
              label="RT Tujuan"
              value={mutationForm.targetRt}
              onValueChange={(value) => updateMutationForm('targetRt', value)}
              placeholder="Pilih RT"
              error={mutationErrors.targetRt}
              options={RT_OPTIONS.map((rt) => `RT ${rt}`)}
              getValue={(label) => label.replace('RT ', '')}
            />
            <FormInput
              label="Nomor Telepon"
              value={mutationForm.phone}
              onChange={(e) => updateMutationForm('phone', e.target.value.replace(/[^\d+]/g, '').slice(0, 20))}
              placeholder="08..."
              inputMode="tel"
              error={mutationErrors.phone}
            />
          </div>

          <FormTextarea
            label="Alasan Mutasi"
            value={mutationForm.reason}
            onChange={(value) => updateMutationForm('reason', value)}
            placeholder="Contoh: pindah domisili karena pekerjaan"
            maxLength={255}
            error={mutationErrors.reason}
          />

          <Button
            type="button"
            onClick={handleMutationSubmit}
            disabled={submitting === 'mutasi'}
            className="h-12 rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {submitting === 'mutasi' ? 'Mengirim...' : 'Kirim Pengajuan'}
          </Button>
        </div>
      </SlideUpSheet>

      <SlideUpSheet
        isOpen={activeSheet === 'tambahKk'}
        onClose={closeSheet}
        title="Pengajuan Tambah KK"
        deskripsi="Ajukan pembuatan kartu keluarga baru untuk direview admin."
      >
        <div className="flex max-h-[72dvh] flex-col gap-4 overflow-y-auto pr-1">
          <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
            <p className="text-sm font-semibold text-foreground">Kepala keluarga memakai akun aktif</p>
            <p className="mt-1 text-xs text-muted-foreground">Admin akan memverifikasi akun warga sebagai kepala keluarga.</p>
          </div>

          <FormInput
            label="Nomor Kartu Keluarga"
            value={householdForm.kkNumber}
            onChange={(e) => updateHouseholdForm('kkNumber', e.target.value.replace(/\D/g, '').slice(0, 16))}
            placeholder="16 digit nomor KK"
            maxLength={16}
            inputMode="numeric"
            error={householdErrors.kkNumber}
          />
          <FormTextarea
            label="Alamat Lengkap"
            value={householdForm.address}
            onChange={(value) => updateHouseholdForm('address', value)}
            placeholder="Nama jalan, nomor rumah, gang, kelurahan, kecamatan"
            maxLength={255}
            error={householdErrors.address}
          />
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="RT"
              value={householdForm.rt}
              onValueChange={(value) => updateHouseholdForm('rt', value)}
              placeholder="Pilih RT"
              error={householdErrors.rt}
              options={RT_OPTIONS.map((rt) => `RT ${rt}`)}
              getValue={(label) => label.replace('RT ', '')}
            />
            <FormInput
              label="RW"
              value={householdForm.rw}
              onChange={(e) => updateHouseholdForm('rw', e.target.value.replace(/\D/g, '').slice(0, 3))}
              placeholder="25"
              inputMode="numeric"
              error={householdErrors.rw}
            />
          </div>

          <Button
            type="button"
            onClick={handleHouseholdSubmit}
            disabled={submitting === 'tambahKk'}
            className="h-12 rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {submitting === 'tambahKk' ? 'Mengirim...' : 'Kirim Pengajuan'}
          </Button>
        </div>
      </SlideUpSheet>

      {popup && bansosResult && (
        <StatusPopup
          isOpen
          onClose={closePopup}
          variant={popup.variant}
          judul={popup.judul}
          actions={
            <>
              <Button asChild className="h-12 w-full rounded-xl font-semibold">
                <Link href="/warga/history">Lihat Selengkapnya</Link>
              </Button>

              <Button
                variant="ghost"
                onClick={closePopup}
                className="h-12 w-full rounded-xl font-semibold text-muted-foreground"
              >
                Tutup
              </Button>
            </>
          }
        >
          <div className="mb-1 mt-2 text-left">
            {bansosResult.status === 'diverifikasi' && (
              <div className="flex flex-col gap-0.5 text-sm">
                <InfoRow label="Nama Warga" value={bansosResult.nama} />
                <InfoRow label="Program" value={bansosResult.program} />
                <InfoRow label="Status" value="Menunggu Review Admin" />
              </div>
            )}

            {bansosResult.status !== 'diverifikasi' && (
              <p className="text-center text-muted-foreground">
                {bansosResult.keterangan}
              </p>
            )}
          </div>
        </StatusPopup>
      )}

      {popup && pemiluResult && (
        <StatusPopup
          isOpen
          onClose={closePopup}
          variant={popup.variant}
          judul={popup.judul}
          actions={
            <>
              <Button asChild className="h-12 w-full rounded-xl font-semibold">
                <Link href="/warga/history">Lihat Selengkapnya</Link>
              </Button>

              <Button
                variant="ghost"
                onClick={closePopup}
                className="h-12 w-full rounded-xl font-semibold text-muted-foreground"
              >
                Tutup
              </Button>
            </>
          }
        >
          <div className="mb-1 mt-2 text-left">
            {pemiluResult.status === 'terdaftar' && (
              <div className="flex flex-col gap-0.5 text-sm">
                <InfoRow label="Nama" value={pemiluResult.nama || '-'} />
                <InfoRow
                  label="Pemilu Aktif"
                  value={pemiluResult.electionTitle || '-'}
                />
                <InfoRow label="NIK" value={pemiluResult.nik || '-'} />
                <InfoRow
                  label="Tanggal Pemilu"
                  value={pemiluResult.electionDate ? new Date(pemiluResult.electionDate).toLocaleDateString('id-ID') : '-'}
                />
                <InfoRow
                  label="TPS"
                  value={pemiluResult.tps || '-'}
                />
                <InfoRow label="Lokasi TPS" value={pemiluResult.tpsLocation || '-'} />
                <InfoRow label="RT Terdaftar" value={pemiluResult.assignedRt ? `RT ${pemiluResult.assignedRt}` : '-'} />
                <InfoRow label="Status" value="Aktif" />
              </div>
            )}

            {pemiluResult.status === 'tidak_terdaftar' && (
              <p className="text-center text-muted-foreground">
                {pemiluResult.keterangan}
              </p>
            )}
          </div>
        </StatusPopup>
      )}

      {popup && !bansosResult && !pemiluResult && (
        <StatusPopup
          isOpen
          onClose={closePopup}
          variant="success"
          judul="Laporan Berhasil Dikirim"
          actions={
            <>
              <Button asChild className="h-12 w-full rounded-xl font-semibold">
                <Link href="/warga/history">Lihat Selengkapnya</Link>
              </Button>

              <Button
                variant="ghost"
                onClick={closePopup}
                className="h-12 w-full rounded-xl font-semibold text-muted-foreground"
              >
                Tutup
              </Button>
            </>
          }
        >
          <div className="mb-1 mt-2 text-left">
            <div className="flex flex-col gap-0.5 text-sm">
              <InfoRow
                label="Jenis Laporan"
                value={submittedAspirasiJenis.join(', ') || '-'}
              />
              <InfoRow label="Pelapor" value={identity.userName} />
              <InfoRow
                label="Tanggal"
                value={new Date().toLocaleDateString('id-ID', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              />
            </div>
          </div>
        </StatusPopup>
      )}
    </WargaPage>
  );
}

function VerificationRequiredCard({ rejectionReason }: { rejectionReason?: string | null }) {
  return (
    <Card className="overflow-hidden rounded-3xl bg-card shadow-sm">
      <CardContent className="flex flex-col items-center px-6 pt-6 text-center">
        <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <LockKeyhole className="size-7" />
        </div>

        <Badge variant="secondary" className="mb-3 rounded-full">
          Butuh Verifikasi
        </Badge>

        <h3 className="text-base font-bold text-foreground">
          Verifikasi dibutuhkan
        </h3>

        <p className="mt-2 max-w-70 text-sm leading-relaxed text-muted-foreground">
          Setelah akun diverifikasi oleh RW/RT, Anda bisa cek bansos, DPT/TPS,
          dan mengirim aspirasi langsung dari aplikasi.
        </p>

        {rejectionReason ? (
          <div className="mt-4 w-full rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-left">
            <p className="text-[11px] font-bold uppercase tracking-wide text-red-600">Alasan penolakan</p>
            <p className="mt-1 text-sm text-red-700">{rejectionReason}</p>
          </div>
        ) : null}

        <div className="mt-6 grid w-full gap-2 text-left">
          <VerificationStep checked label="Data warga sudah dikirim" />
          <VerificationStep label="Menunggu validasi admin RW/RT" />
          <VerificationStep label="Akses fitur akan dibuka otomatis" />
        </div>
      </CardContent>
    </Card>
  );
}

function VerificationStep({
  label,
  checked,
}: {
  label: string;
  checked?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-background px-3 py-2.5">
      <div
        className={cn(
          'flex size-7 shrink-0 items-center justify-center rounded-full',
          checked ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        )}
      >
        {checked ? (
          <CheckCircle2 className="size-4" />
        ) : (
          <LockKeyhole className="size-3.5" />
        )}
      </div>

      <p className="text-xs font-medium text-foreground">{label}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-semibold text-foreground">{value}</span>
    </div>
  );
}

function SelectField({
  label,
  value,
  onValueChange,
  placeholder,
  options,
  error,
  getValue = (option) => option,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  options: string[];
  error?: string;
  getValue?: (option: string) => string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-semibold text-foreground">{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger
          className={cn(
            'h-11 rounded-xl border-border bg-muted/40',
            error && 'border-destructive focus:ring-destructive/50',
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={getValue(option)}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
