// ============================================================
// Abdi Masyarakat — Tipe Data Portal Warga
// ============================================================

/** Profil pengguna warga */
export interface UserProfile {
  nama: string;
  nik: string;
  avatar?: string;
  alamat?: string;
  rt?: string;
  rw?: string;
}

/** Jenis program bansos yang tersedia */
export type ProgramBansos = 'PKH' | 'BPNT' | 'Bantuan Tunai' | 'BLT Dana Desa';

/** Status hasil cek bansos */
export type StatusBansos = 'aktif' | 'diverifikasi' | 'tidak_layak';

/** Hasil pengecekan bansos */
export interface BansosResult {
  status: StatusBansos;
  nama: string;
  nik: string;
  program: ProgramBansos;
  dtks?: string;
  keterangan?: string;
}

/** Status hasil cek pemilu */
export type StatusPemilu = 'terdaftar' | 'tidak_terdaftar';

/** Hasil pengecekan kelayakan pemilu */
export interface PemiluResult {
  status: StatusPemilu;
  nama?: string;
  nik?: string;
  dptTahun?: string;
  noUrut?: string;
  jenisKelamin?: 'L' | 'P';
  tps?: string;
  tpsLocation?: string;
  electionTitle?: string;
  electionDate?: string;
  assignedRt?: string;
  keterangan?: string;
}

/** Jenis laporan aspirasi */
export type JenisAspirasi = 'masukan' | 'keluhan';
export type StatusAspirasi = 'SUBMITTED' | 'REVIEWED' | 'RESOLVED';
export type JenisPermohonan = 'HOUSEHOLD_CREATE' | 'MUTATION_IN' | 'MUTATION_OUT' | 'BANSOS_APPLICATION';
export type StatusPermohonan = 'PENDING' | 'APPROVED' | 'REJECTED';

/** Hasil pengiriman aspirasi */
export interface AspirasiResult {
  jenis: JenisAspirasi;
  pelapor: string;
  tanggal: string;
  uraian: string;
  lampiran?: string;
  status?: StatusAspirasi;
  tanggapanAdmin?: string | null;
  ditanggapiOleh?: string | null;
  tanggalTanggapan?: string | null;
}

export interface PermohonanResult {
  jenis: JenisPermohonan;
  tanggal: string;
  status: StatusPermohonan;
  ringkasan: string;
  requestId: string;
  alasanPenolakan?: string | null;
}

/** Tipe riwayat */
export type TipeRiwayat = 'bansos' | 'pemilu' | 'aspirasi' | 'permohonan';

/** Item riwayat generik */
export interface HistoryItem {
  id: string;
  tipe: TipeRiwayat;
  tanggal: string;
  status: string;
  statusColor: 'green' | 'amber' | 'red';
  judul: string;
  deskripsi: string;
  detail: BansosResult | PemiluResult | AspirasiResult | PermohonanResult;
}

/** Event jadwal RW */
export interface JadwalEvent {
  id: string;
  tanggal: string; // ISO date string
  judul: string;
  waktu: string;
  lokasi: string;
  kategori: 'rapat' | 'sosial' | 'kesehatan' | 'keamanan' | 'lainnya';
  deskripsi?: string;
}

/** State untuk form Cek Bansos */
export interface FormBansos {
  nik: string;
  nama: string;
  program: ProgramBansos | '';
}

/** State untuk form Cek Pemilu */
export interface FormPemilu {
  nik: string;
  tanggalLahir: string;
}

/** State untuk form Aspirasi */
export interface FormAspirasi {
  jenis: JenisAspirasi[];
  uraian: string;
  lampiran: File | null;
}
