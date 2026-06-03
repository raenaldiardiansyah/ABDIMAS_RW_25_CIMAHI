// ============================================================
// Abdi Masyarakat — Data Mock untuk Prototyping
// ============================================================

import type {
  UserProfile,
  BansosResult,
  PemiluResult,
  AspirasiResult,
  HistoryItem,
  JadwalEvent,
} from '@/types/warga';

// ── Profil Pengguna ──────────────────────────────────────────

export const MOCK_USER: UserProfile = {
  nama: 'Ahmad Subagyo',
  nik: '3277012345678901',
  rt: '003',
  rw: '025',
  alamat: 'Jl. Cimahi Tengah No. 12',
};

// ── Hasil Cek Bansos (3 Skenario) ───────────────────────────

export const BANSOS_AKTIF: BansosResult = {
  status: 'aktif',
  nama: 'Ahmad Subagyo',
  nik: '3277012345678901',
  program: 'PKH',
  dtks: '2025',
  keterangan: 'Penerima aktif program PKH periode Januari–Juni 2026.',
};

export const BANSOS_DIVERIFIKASI: BansosResult = {
  status: 'diverifikasi',
  nama: 'Ahmad Subagyo',
  nik: '3277012345678901',
  program: 'BPNT',
  keterangan: 'Data Anda sedang dalam peninjauan oleh Dinas Sosial. Hasil akan muncul otomatis setelah berhasil diverifikasi.',
};

export const BANSOS_TIDAK_LAYAK: BansosResult = {
  status: 'tidak_layak',
  nama: 'Ahmad Subagyo',
  nik: '3277012345678901',
  program: 'Bantuan Tunai',
  keterangan: 'Berdasarkan data DTKS terbaru, Anda tidak memenuhi kriteria penerima. Jika kondisi Anda berubah, segera hubungi pihak terkait.',
};

// ── Hasil Cek Pemilu (2 Skenario) ───────────────────────────

export const PEMILU_TERDAFTAR: PemiluResult = {
  status: 'terdaftar',
  nama: 'Ahmad Subagyo',
  nik: '3277012345678901',
  dptTahun: '2026',
  noUrut: '247',
  jenisKelamin: 'L',
  tps: 'TPS 012 — Kelurahan Cimahi Tengah',
};

export const PEMILU_TIDAK_TERDAFTAR: PemiluResult = {
  status: 'tidak_terdaftar',
  nama: 'Ahmad Subagyo',
  nik: '3277012345678901',
  keterangan: 'NIK tidak ditemukan di DPT. Data DPT diperbarui per Maret 2026. Jika Anda merasa sudah mendaftar, cek kembali atau hubungi KPU/Kelurahan setempat.',
};

// ── Hasil Aspirasi ──────────────────────────────────────────

export const ASPIRASI_SUKSES: AspirasiResult = {
  jenis: 'masukan',
  pelapor: 'Ahmad Subagyo',
  tanggal: '26/04/2026',
  uraian: '',
};

// ── Riwayat (Mock) ──────────────────────────────────────────

export const MOCK_HISTORY: HistoryItem[] = [
  {
    id: 'h1',
    tipe: 'bansos',
    tanggal: '25 April 2026',
    status: 'Aktif',
    statusColor: 'green',
    judul: 'Cek Bansos — PKH',
    deskripsi: 'Program Keluarga Harapan',
    detail: BANSOS_AKTIF,
  },
  {
    id: 'h2',
    tipe: 'bansos',
    tanggal: '20 April 2026',
    status: 'Diverifikasi',
    statusColor: 'amber',
    judul: 'Cek Bansos — BPNT',
    deskripsi: 'Bantuan Pangan Non Tunai',
    detail: BANSOS_DIVERIFIKASI,
  },
  {
    id: 'h3',
    tipe: 'bansos',
    tanggal: '15 Maret 2026',
    status: 'Tidak Layak',
    statusColor: 'red',
    judul: 'Cek Bansos — Bantuan Tunai',
    deskripsi: 'Tidak memenuhi kriteria',
    detail: BANSOS_TIDAK_LAYAK,
  },
  {
    id: 'h4',
    tipe: 'pemilu',
    tanggal: '10 April 2026',
    status: 'Terdaftar',
    statusColor: 'green',
    judul: 'Cek DPT Pemilu 2026',
    deskripsi: 'Terdaftar di TPS 012',
    detail: PEMILU_TERDAFTAR,
  },
  {
    id: 'h5',
    tipe: 'pemilu',
    tanggal: '02 Februari 2026',
    status: 'Tidak Terdaftar',
    statusColor: 'red',
    judul: 'Cek DPT Pemilu 2026',
    deskripsi: 'NIK tidak ditemukan',
    detail: PEMILU_TIDAK_TERDAFTAR,
  },
  {
    id: 'h6',
    tipe: 'laporan',
    tanggal: '22 April 2026',
    status: 'Terkirim',
    statusColor: 'green',
    judul: 'Masukan — Perbaikan Jalan',
    deskripsi: 'Jalan RT 003 berlubang di depan mushola...',
    detail: {
      jenis: 'masukan' as const,
      pelapor: 'Ahmad Subagyo',
      tanggal: '22/04/2026',
      uraian: 'Jalan RT 003 berlubang di depan mushola Al-Ikhlas. Mohon segera diperbaiki karena membahayakan pengendara motor.',
      lampiran: '/dummy.jpg',
    },
  },
  {
    id: 'h7',
    tipe: 'laporan',
    tanggal: '18 April 2026',
    status: 'Terkirim',
    statusColor: 'green',
    judul: 'Keluhan — Sampah Menumpuk',
    deskripsi: 'Tempat sampah di gang 5 sudah penuh...',
    detail: {
      jenis: 'keluhan' as const,
      pelapor: 'Ahmad Subagyo',
      tanggal: '18/04/2026',
      uraian: 'Tempat sampah di gang 5 sudah penuh selama 3 hari dan belum diangkut. Bau menyengat mengganggu warga sekitar.',
    },
  },
  {
    id: 'h8',
    tipe: 'laporan',
    tanggal: '05 Maret 2026',
    status: 'Terkirim',
    statusColor: 'green',
    judul: 'Masukan — Lampu Jalan',
    deskripsi: 'Lampu jalan di persimpangan RT 003/004 mati...',
    detail: {
      jenis: 'masukan' as const,
      pelapor: 'Ahmad Subagyo',
      tanggal: '05/03/2026',
      uraian: 'Lampu jalan di persimpangan RT 003/004 sudah mati sejak minggu lalu. Mohon segera diganti untuk keamanan warga.',
    },
  },
  {
    id: 'h9',
    tipe: 'laporan',
    tanggal: '20 April 2026',
    status: 'Selesai',
    statusColor: 'green',
    judul: 'Keluhan — Pohon Tumbang',
    deskripsi: 'Ada dahan pohon rindang yang rawan patah...',
    detail: {
      jenis: 'keluhan' as const,
      pelapor: 'Budi Santoso',
      tanggal: '20/04/2026',
      uraian: 'Dahan pohon beringin di dekat pos satpam sudah sangat rapuh dan rawan patah menimpa kabel listrik. Tolong segera dipangkas.',
    },
  },
  {
    id: 'h10',
    tipe: 'laporan',
    tanggal: '10 April 2026',
    status: 'Diproses',
    statusColor: 'amber',
    judul: 'Masukan — Kegiatan Karang Taruna',
    deskripsi: 'Usulan kegiatan olahraga bersama pemuda...',
    detail: {
      jenis: 'masukan' as const,
      pelapor: 'Siti Aminah',
      tanggal: '10/04/2026',
      uraian: 'Mohon diadakan turnamen bulu tangkis antar RT untuk menyemarakkan kegiatan pemuda di lingkungan RW 025.',
    },
  },
];

// ── Jadwal RW (Mock) ────────────────────────────────────────

export const MOCK_JADWAL: JadwalEvent[] = [
  {
    id: 'j1',
    tanggal: '2026-04-27',
    judul: 'Rapat Koordinasi RT/RW',
    waktu: '19:30 — 21:00 WIB',
    lokasi: 'Balai RW 025',
    kategori: 'rapat',
    deskripsi: 'Pembahasan program kerja bulanan dan evaluasi kegiatan.',
  },
  {
    id: 'j2',
    tanggal: '2026-04-29',
    judul: 'Posyandu Balita',
    waktu: '08:00 — 11:00 WIB',
    lokasi: 'Pos Kesehatan RT 003',
    kategori: 'kesehatan',
    deskripsi: 'Penimbangan balita, pemberian vitamin, dan imunisasi.',
  },
  {
    id: 'j3',
    tanggal: '2026-05-01',
    judul: 'Kerja Bakti Lingkungan',
    waktu: '07:00 — 10:00 WIB',
    lokasi: 'Seluruh area RW 025',
    kategori: 'sosial',
    deskripsi: 'Gotong royong membersihkan saluran air dan taman.',
  },
  {
    id: 'j4',
    tanggal: '2026-05-03',
    judul: 'Ronda Malam Gabungan',
    waktu: '22:00 — 04:00 WIB',
    lokasi: 'Pos Kamling RW 025',
    kategori: 'keamanan',
    deskripsi: 'Patroli keamanan bersama seluruh RT.',
  },
  {
    id: 'j5',
    tanggal: '2026-05-05',
    judul: 'Sosialisasi Bansos 2026',
    waktu: '13:00 — 15:00 WIB',
    lokasi: 'Balai RW 025',
    kategori: 'sosial',
    deskripsi: 'Penjelasan mekanisme penyaluran bantuan sosial tahun 2026.',
  },
  {
    id: 'j6',
    tanggal: '2026-05-10',
    judul: 'Rapat Bulanan Mei',
    waktu: '19:30 — 21:00 WIB',
    lokasi: 'Balai RW 025',
    kategori: 'rapat',
    deskripsi: 'Evaluasi program April dan perencanaan kegiatan Mei.',
  },
  {
    id: 'j7',
    tanggal: '2026-05-15',
    judul: 'Senam Sehat Bersama',
    waktu: '06:00 — 07:30 WIB',
    lokasi: 'Lapangan RW 025',
    kategori: 'kesehatan',
    deskripsi: 'Kegiatan olahraga rutin bulanan untuk seluruh warga.',
  },
  {
    id: 'j8',
    tanggal: '2026-05-20',
    judul: 'Pelatihan UMKM Digital',
    waktu: '09:00 — 12:00 WIB',
    lokasi: 'Balai RW 025',
    kategori: 'lainnya',
    deskripsi: 'Pelatihan pemasaran digital untuk pelaku usaha mikro.',
  },
];

// ── Program Bansos Options ──────────────────────────────────

export const PROGRAM_BANSOS_OPTIONS = [
  { value: 'PKH', label: 'PKH (Program Keluarga Harapan)' },
  { value: 'BPNT', label: 'BPNT (Bantuan Pangan Non Tunai)' },
  { value: 'Bantuan Tunai', label: 'Bantuan Tunai Langsung' },
  { value: 'BLT Dana Desa', label: 'BLT Dana Desa' },
];

// ── Kategori Jadwal Colors ──────────────────────────────────

export const KATEGORI_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  rapat: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  sosial: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  kesehatan: { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },
  keamanan: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  lainnya: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
};
