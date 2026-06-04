// ============================================================
// Dummy Data Admin — Satu file terpusat untuk semua mock data
// halaman admin. Import dari sini agar frontend rapi.
// ============================================================

/* ── Types ─────────────────────────────────────────────────── */

export type Penduduk = {
  nama: string;
  nik: string;
  noKK: string;
  alamat: string;
  status: 'Penduduk Tetap' | 'Ngekost';
};

export type KartuKeluarga = {
  nama: string;
  nik: string;
  noKK: string;
  alamat: string;
  rtRw: string;
  anggota: number;
};

export type Mutasi = {
  tgl: string;
  jam: string;
  nama: string;
  nik: string;
  jenis: 'Masuk' | 'Keluar';
  ket: string;
  status: 'Selesai' | 'Menunggu' | 'Ditolak';
  statusColor: string;
};

export type Aktivitas = {
  title: string;
  subtitle: string;
  time: string;
};

export type AksiCepat = {
  label: string;
  sub: string;
  href: string;
};

export type KelompokUmur = {
  label: string;
  value: number;
};

export type RekapRT = {
  rt: string;
  rw: string;
  kk: string;
  warga: string;
  mutasi: string;
  produktif: string;
};

export type BannerPermohonan = {
  label: string;
  line1: string;
  bold: string;
};

/* ── Dashboard Stats ───────────────────────────────────────── */

export const DASHBOARD_STATS = {
  totalWarga: 224,
  totalWargaDelta: '+7 Jiwa',
  totalKK: 63,
  totalMutasi: 15,
};

/* ── Current Admin Profile ─────────────────────────────────── */

export const CURRENT_ADMIN = {
  name: 'Faiq Haqqani',
  email: 'haqqanifaiq@gmail.com',
  role: 'Super Admin',
  initials: 'F',
  avatarColor: 'from-amber-400 to-amber-600',
};

/* ── Dashboard: Aktivitas Terbaru ──────────────────────────── */

export const ACTIVITIES: Aktivitas[] = [
  {
    title: 'Mutasi Pindah Masuk',
    subtitle: 'Faiq Haqqani dari : Jawa Barat',
    time: 'Baru Saja',
  },
  {
    title: 'Pembaruan Data KK',
    subtitle: 'Keluarga Riyadhul : Penambahan Anggota',
    time: '32 Menit lalu',
  },
  {
    title: 'Pembaruan data KK',
    subtitle: 'Keluarga Riyadhul : Penambahan Anggota',
    time: '1 Jam lalu',
  },
  {
    title: 'Penambahan Warga',
    subtitle: 'Siapa aja namanya',
    time: 'Kemarin',
  },
  {
    title: 'Pembaruan data KK',
    subtitle: 'Keluarga Faiq : Penambahan Anggota',
    time: '2 Hari lalu',
  },
];

/* ── Dashboard: Aksi Cepat ─────────────────────────────────── */

export const QUICK_ACTIONS: AksiCepat[] = [
  { label: 'Tambah Warga', sub: 'Data Penduduk', href: '/admin/data-penduduk' },
  { label: 'Tambah KK', sub: 'Kartu Keluarga', href: '/admin/kartu-keluarga' },
  { label: 'Laporan Mutasi', sub: 'Mutasi Penduduk', href: '/admin/mutasi' },
];

/* ── Data Penduduk ─────────────────────────────────────────── */

export const PENDUDUK_DATA: Penduduk[] = [
  { nama: 'Faiq Haqqani', nik: '3275010203040001', noKK: '3275010908070005', alamat: 'Blok A No. 14', status: 'Penduduk Tetap' },
  { nama: 'Anakin Skywalker', nik: '9275022203040000', noKK: '3275010908070005', alamat: 'Blok A No. 02', status: 'Ngekost' },
  { nama: 'Faiq Haqqani', nik: '3275010203040001', noKK: '3275010908070005', alamat: 'Blok A No. 14', status: 'Penduduk Tetap' },
  { nama: 'Anakin Skywalker', nik: '9275022203040000', noKK: '3275010908070005', alamat: 'Blok A No. 02', status: 'Penduduk Tetap' },
  { nama: 'Faiq Haqqani', nik: '3275010203040001', noKK: '3275010908070005', alamat: 'Blok A No. 14', status: 'Penduduk Tetap' },
  { nama: 'Anakin Skywalker', nik: '9275022203040000', noKK: '3275010908070005', alamat: 'Blok A No. 02', status: 'Ngekost' },
  { nama: 'Faiq Haqqani', nik: '3275010203040001', noKK: '3275010908070005', alamat: 'Blok A No. 14', status: 'Penduduk Tetap' },
];

export const TOTAL_PENDUDUK = 203;

/* ── Kartu Keluarga ────────────────────────────────────────── */

export const KK_DATA: KartuKeluarga[] = [
  { nama: 'Faiq Haqqani', nik: '3275010203040001', noKK: '3275010908070005', alamat: 'Blok A No. 14', rtRw: '01/04', anggota: 2 },
  { nama: 'Anakin Skywalker', nik: '9275022203040000', noKK: '3275010908070005', alamat: 'Blok A No. 02', rtRw: '01/12', anggota: 4 },
  { nama: 'Faiq Haqqani', nik: '3275010203040001', noKK: '3275010908070005', alamat: 'Blok A No. 14', rtRw: '02/01', anggota: 2 },
  { nama: 'Anakin Skywalker', nik: '9275022203040000', noKK: '3275010908070005', alamat: 'Blok A No. 02', rtRw: '02/03', anggota: 2 },
  { nama: 'Faiq Haqqani', nik: '3275010203040001', noKK: '3275010908070005', alamat: 'Blok A No. 14', rtRw: '01/03', anggota: 8 },
  { nama: 'Anakin Skywalker', nik: '9275022203040000', noKK: '3275010908070005', alamat: 'Blok A No. 02', rtRw: '01/02', anggota: 4 },
  { nama: 'Faiq Haqqani', nik: '3275010203040001', noKK: '3275010908070005', alamat: 'Blok A No. 14', rtRw: '01/11', anggota: 12 },
];

export const TOTAL_KK = 203;

/* ── Mutasi Penduduk ───────────────────────────────────────── */

export const MUTASI_DATA: Mutasi[] = [
  { tgl: '12 Januari 2028', jam: '09:10 WIB', nama: 'Anakin Skywalker', nik: '9275022203040000', jenis: 'Masuk', ket: 'Pindah dari Tatooin...', status: 'Selesai', statusColor: '#6366F1' },
  { tgl: '9 Januari 2028', jam: '23:11 WIB', nama: 'C3PO', nik: '100000911019901091', jenis: 'Masuk', ket: 'Pindah dari Tatooin...', status: 'Menunggu', statusColor: '#1E293B' },
  { tgl: '9 Januari 2028', jam: '13:24 WIB', nama: 'R2 D2', nik: '9999000018188888', jenis: 'Masuk', ket: 'Pindah dari Tatooin...', status: 'Selesai', statusColor: '#6366F1' },
  { tgl: '27 Desember 2027', jam: '23:11 WIB', nama: 'C3PO', nik: '100000911019901091', jenis: 'Keluar', ket: 'Pindah dari Tatooin...', status: 'Ditolak', statusColor: '#EF4444' },
];

export const MUTASI_STATS = {
  masuk: 11,
  masukDelta: '+2 laporan',
  keluar: 2,
  keluarDelta: '+1 laporan',
  total: 15,
};

/* ── Laporan ───────────────────────────────────────────────── */

export const AGE_GROUPS: KelompokUmur[] = [
  { label: '0 - 15', value: 18 },
  { label: '16 - 30', value: 64 },
  { label: '31 - 50', value: 38 },
  { label: '51 - 65', value: 51 },
  { label: '65+', value: 20 },
];

export const MAX_AGE_VALUE = Math.max(...AGE_GROUPS.map((g) => g.value));

export const GENDER_STATS = {
  lakiLaki: { persen: 54, jiwa: 120 },
  perempuan: { persen: 46, jiwa: 104 },
  total: 224,
};

export const RT_DATA: RekapRT[] = [
  { rt: 'RT 01', rw: 'RW 05', kk: '8', warga: '22', mutasi: '7', produktif: '14 Jiwa' },
  { rt: 'RT 02', rw: 'RW 05', kk: '12', warga: '29', mutasi: '2', produktif: '20 Jiwa' },
  { rt: 'RT 03', rw: 'RW 05', kk: '42', warga: '57', mutasi: '0', produktif: '33 Jiwa' },
  { rt: 'RT 02', rw: 'RW 05', kk: '15', warga: '41', mutasi: '3', produktif: '25 Jiwa' },
  { rt: 'RT 03', rw: 'RW 05', kk: '20', warga: '65', mutasi: '5', produktif: '40 Jiwa' },
];

/* ── Permohonan ────────────────────────────────────────────── */

export const BANNERS: BannerPermohonan[] = [
  { label: 'Data Penduduk', line1: 'Permohonan', bold: 'Data Kependudukan.' },
  { label: 'Kartu Keluarga', line1: 'Permohonan', bold: 'Data Kartu Keluarga.' },
  { label: 'Mutasi Penduduk', line1: 'Permohonan', bold: 'Laporan Permutasian.' },
];
