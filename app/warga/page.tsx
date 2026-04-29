'use client';

import { useState } from 'react';
import { Gift, ShieldCheck, Megaphone } from 'lucide-react';
import { useTheme } from './layout';
import ProfileHeader from '@/components/warga/ProfileHeader';
import FeatureCard from '@/components/warga/FeatureCard';
import SlideUpSheet from '@/components/warga/SlideUpSheet';
import StatusPopup from '@/components/warga/StatusPopup';
import FormInput from '@/components/warga/FormInput';
import FormSelect from '@/components/warga/FormSelect';
import FormDatePicker from '@/components/warga/FormDatePicker';
import FormCheckbox from '@/components/warga/FormCheckbox';
import FormTextarea from '@/components/warga/FormTextarea';
import FormFileUpload from '@/components/warga/FormFileUpload';
import CommentCarousel from '@/components/warga/CommentCarousel';
import {
  MOCK_USER,
  PROGRAM_BANSOS_OPTIONS,
  BANSOS_AKTIF,
  BANSOS_DIVERIFIKASI,
  BANSOS_TIDAK_LAYAK,
  PEMILU_TERDAFTAR,
  PEMILU_TIDAK_TERDAFTAR,
} from '@/constants/mockData';
import type { BansosResult, PemiluResult, StatusBansos, StatusPemilu } from '@/types/warga';

type ActiveSheet = 'bansos' | 'pemilu' | 'aspirasi' | null;
type PopupState = { variant: 'success' | 'warning' | 'error'; judul: string } | null;

export default function WargaHomePage() {
  const { isDark, toggleDark } = useTheme();

  // ── Sheet State ─────────────────────────────────────────
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);
  const [popup, setPopup] = useState<PopupState>(null);

  // ── Form: Bansos ────────────────────────────────────────
  const [bansosNik, setBansosNik] = useState('');
  const [bansosNama, setBansosNama] = useState('');
  const [bansosProgram, setBansosProgram] = useState('');
  const [bansosResult, setBansosResult] = useState<BansosResult | null>(null);

  const handleBansosSubmit = () => {
    const scenarios: BansosResult[] = [BANSOS_AKTIF, BANSOS_DIVERIFIKASI, BANSOS_TIDAK_LAYAK];
    const result = scenarios[Math.floor(Math.random() * scenarios.length)];
    setBansosResult(result);
    setActiveSheet(null);

    const variantMap: Record<StatusBansos, 'success' | 'warning' | 'error'> = {
      aktif: 'success',
      diverifikasi: 'warning',
      tidak_layak: 'error',
    };
    const judulMap: Record<StatusBansos, string> = {
      aktif: 'Anda Layak Menerima Bansos',
      diverifikasi: 'Bansos Sedang Diverifikasi',
      tidak_layak: 'Tidak Memenuhi Kriteria',
    };

    setPopup({ variant: variantMap[result.status], judul: judulMap[result.status] });
  };

  // ── Form: Pemilu ────────────────────────────────────────
  const [pemiluNik, setPemiluNik] = useState('');
  const [pemiluTgl, setPemiluTgl] = useState('');
  const [pemiluResult, setPemiluResult] = useState<PemiluResult | null>(null);

  const handlePemiluSubmit = () => {
    const scenarios: PemiluResult[] = [PEMILU_TERDAFTAR, PEMILU_TIDAK_TERDAFTAR];
    const result = scenarios[Math.floor(Math.random() * scenarios.length)];
    setPemiluResult(result);
    setActiveSheet(null);

    const variantMap: Record<StatusPemilu, 'success' | 'error'> = {
      terdaftar: 'success',
      tidak_terdaftar: 'error',
    };
    const judulMap: Record<StatusPemilu, string> = {
      terdaftar: 'Terdaftar Sebagai Pemilih',
      tidak_terdaftar: 'Belum Terdaftar di DPT',
    };

    setPopup({ variant: variantMap[result.status], judul: judulMap[result.status] });
  };

  // ── Form: Aspirasi ──────────────────────────────────────
  const [aspirasiJenis, setAspirasiJenis] = useState<string[]>([]);
  const [aspirasiUraian, setAspirasiUraian] = useState('');
  const [aspirasiFile, setAspirasiFile] = useState<File | null>(null);

  const handleAspirasiSubmit = () => {
    setActiveSheet(null);
    setPopup({ variant: 'success', judul: 'Laporan Berhasil Dikirim' });
  };

  const closeSheet = () => setActiveSheet(null);

  const closePopup = () => {
    setPopup(null);
    setBansosResult(null);
    setPemiluResult(null);
  };

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-zinc-800 last:border-0">
      <span className="text-gray-500 dark:text-zinc-500">{label}</span>
      <span className="font-semibold text-gray-800 dark:text-zinc-200 text-right">{value}</span>
    </div>
  );

  return (
    <div className="min-h-full flex flex-col">
      {/* Header Profil */}
      <ProfileHeader
        nama={MOCK_USER.nama}
        nik={MOCK_USER.nik}
        isDark={isDark}
        onToggleDark={toggleDark}
      />

      {/* Konten Utama */}
      <div className="flex-1 px-5 pt-5 pb-6 flex flex-col gap-2.5 stagger-children">
        {/* Card 1: Cek Bansos (Besar) */}
        <FeatureCard
          icon={Gift}
          judul="Cek Status Bansos"
          deskripsi="Verifikasi kelayakan dan status bantuan sosial Anda berdasarkan data DTKS."
          badge="Bantuan Sosial"
          variant="large"
          onClick={() => setActiveSheet('bansos')}
          delay={50}
        />

        {/* Card 2 & 3: Grid */}
        <div className="grid grid-cols-2 gap-3">
          <FeatureCard
            icon={ShieldCheck}
            judul="Cek DPT/TPS"
            deskripsi="Periksa status pemilih Anda di DPT."
            badge="Pemilu"
            variant="compact"
            onClick={() => setActiveSheet('pemilu')}
            delay={100}
          />
          <FeatureCard
            icon={Megaphone}
            judul="Aspirasi"
            deskripsi="Kirim masukan atau keluhan Anda."
            badge="Laporan"
            variant="compact"
            onClick={() => setActiveSheet('aspirasi')}
            delay={150}
          />
        </div>
      </div>

      {/* Carousel Komentar / Tanggapan (Full Width) */}
      <CommentCarousel />

      {/* ═══ SLIDE-UP SHEETS ═══════════════════════════════ */}

      {/* Sheet: Cek Bansos */}
      <SlideUpSheet
        isOpen={activeSheet === 'bansos'}
        onClose={closeSheet}
        title="Cek Status Bansos"
        deskripsi="Masukkan data Anda untuk memeriksa kelayakan penerima bantuan sosial."
      >
        <div className="flex flex-col">
          {/* NIK */}
          <div className="mb-4">
            <label className="block text-[13px] font-semibold text-[#1a1a1a] dark:text-white mb-2">NIK (16 Digit)</label>
            <input
              className="w-full bg-[#4a2810] border-none rounded-[10px] px-4 py-[13px] text-[14px] text-[#f5e8dc] placeholder-[#c4a888] focus:bg-[#5a3318] focus:outline-none transition-colors"
              type="text"
              placeholder="Masukkan NIK Anda"
              maxLength={16}
              inputMode="numeric"
              value={bansosNik}
              onChange={(e) => setBansosNik(e.target.value.replace(/\D/g, '').slice(0, 16))}
            />
            <p className="text-[11px] text-[#aaa] mt-1.5">Nomor Induk Kependudukan sesuai KTP</p>
          </div>

          {/* Nama Lengkap */}
          <div className="mb-4">
            <label className="block text-[13px] font-semibold text-[#1a1a1a] dark:text-white mb-2">Nama Lengkap</label>
            <input
              className="w-full bg-[#4a2810] border-none rounded-[10px] px-4 py-[13px] text-[14px] text-[#f5e8dc] placeholder-[#c4a888] focus:bg-[#5a3318] focus:outline-none transition-colors"
              type="text"
              placeholder="Sesuai KTP"
              value={bansosNama}
              onChange={(e) => setBansosNama(e.target.value)}
            />
          </div>

          {/* Divider */}
          <div className="h-[1px] bg-[#efefef] dark:bg-zinc-800 my-4"></div>

          {/* Radio List */}
          <label className="block text-[13px] font-semibold text-[#1a1a1a] dark:text-white mb-2.5">Jenis Program Bansos</label>
          <div className="rounded-xl overflow-hidden bg-[#4a2810] mb-6">
            {[
              { id: 'PKH', name: 'Program Keluarga Harapan', desc: 'PKH · Bantuan tunai bersyarat' },
              { id: 'BPNT', name: 'Bantuan Pangan Non-Tunai', desc: 'BPNT · Sembako & kebutuhan pokok' },
              { id: 'BST', name: 'Bantuan Sosial Tunai', desc: 'BST · Bantuan langsung tunai' },
            ].map((prog) => {
              const isSelected = bansosProgram === prog.name;
              return (
                <div
                  key={prog.id}
                  onClick={() => setBansosProgram(prog.name)}
                  className={`flex items-center justify-between px-4 py-3 cursor-pointer select-none transition-colors border-b border-white/5 last:border-b-0 ${isSelected ? 'bg-[#613a1d]' : 'hover:bg-[#5a3318]'}`}
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-[13px] font-semibold text-[#f5e8dc]">{prog.name}</span>
                    <span className="text-[11px] text-[#c4a888]">{prog.desc}</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 ml-3 flex-shrink-0 flex items-center justify-center transition-colors ${isSelected ? 'border-[#f5e8dc] bg-[#f5e8dc]' : 'border-[#c4a888]'}`}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-[#4a2810]"></div>}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleBansosSubmit}
            disabled={!bansosNik || bansosNik.length !== 16 || !bansosNama || !bansosProgram}
            className="w-full bg-[#4a2810] text-white border-none rounded-xl py-4 text-[15px] font-semibold cursor-pointer tracking-wide hover:bg-[#5a3318] active:bg-[#3a1f0a] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Konfirmasi
          </button>
        </div>
      </SlideUpSheet>

      {/* Sheet: Kelayakan Pemilu */}
      <SlideUpSheet
        isOpen={activeSheet === 'pemilu'}
        onClose={closeSheet}
        title="Cek Status Pemilih"
        deskripsi="Periksa apakah Anda sudah terdaftar di Daftar Pemilih Tetap (DPT)."
      >
        <div className="flex flex-col gap-4">
          <FormInput
            label="NIK (16 Digit)"
            placeholder="Masukkan NIK Anda"
            value={pemiluNik}
            onChange={(e) => setPemiluNik(e.target.value.replace(/\D/g, '').slice(0, 16))}
            maxLength={16}
            inputMode="numeric"
          />
          <FormDatePicker
            label="Tanggal Lahir"
            value={pemiluTgl}
            onChange={setPemiluTgl}
          />
          <button
            onClick={handlePemiluSubmit}
            disabled={!pemiluNik || !pemiluTgl}
            className="mt-2 w-full py-3.5 rounded-xl font-bold text-sm tracking-wide bg-[#5c3a21] text-white hover:bg-[#4a2f1a] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-md"
          >
            Konfirmasi
          </button>
        </div>
      </SlideUpSheet>

      {/* Sheet: Aspirasi */}
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
          <button
            onClick={handleAspirasiSubmit}
            disabled={aspirasiJenis.length === 0 || !aspirasiUraian.trim()}
            className="mt-2 w-full py-3.5 rounded-xl font-bold text-sm tracking-wide bg-[#5c3a21] text-white hover:bg-[#4a2f1a] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-md"
          >
            Konfirmasi
          </button>
        </div>
      </SlideUpSheet>

      {/* ═══ STATUS POPUPS ═════════════════════════════════ */}

      {/* Popup: Hasil Bansos */}
      {popup && bansosResult && (
        <StatusPopup
          isOpen
          onClose={closePopup}
          variant={popup.variant}
          judul={popup.judul}
          actions={
            <>
              <a href="/warga/history" className="w-full py-3 rounded-xl text-sm font-bold text-center bg-[#5c3a21] text-white hover:bg-[#4a2f1a] transition-colors block">
                Lihat Selengkapnya
              </a>
              <button onClick={closePopup} className="w-full py-3 rounded-xl text-sm font-semibold text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
                Tutup
              </button>
            </>
          }
        >
          <div className="text-left mt-2 mb-1">
            {bansosResult.status === 'aktif' && (
              <div className="flex flex-col gap-0.5 text-sm">
                <InfoRow label="Nama Penerima" value={bansosResult.nama} />
                <InfoRow label="Program" value={bansosResult.program} />
                <InfoRow label="DTKS Tahun" value={bansosResult.dtks || '-'} />
                <InfoRow label="Status" value="Aktif" />
              </div>
            )}
            {bansosResult.status === 'diverifikasi' && (
              <p className="text-center text-gray-600 dark:text-zinc-400">{bansosResult.keterangan}</p>
            )}
            {bansosResult.status === 'tidak_layak' && (
              <p className="text-center text-gray-600 dark:text-zinc-400">{bansosResult.keterangan}</p>
            )}
          </div>
        </StatusPopup>
      )}

      {/* Popup: Hasil Pemilu */}
      {popup && pemiluResult && (
        <StatusPopup
          isOpen
          onClose={closePopup}
          variant={popup.variant}
          judul={popup.judul}
          actions={
            <>
              <a href="/warga/history" className="w-full py-3 rounded-xl text-sm font-bold text-center bg-[#5c3a21] text-white hover:bg-[#4a2f1a] transition-colors block">
                Lihat Selengkapnya
              </a>
              <button onClick={closePopup} className="w-full py-3 rounded-xl text-sm font-semibold text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
                Tutup
              </button>
            </>
          }
        >
          <div className="text-left mt-2 mb-1">
            {pemiluResult.status === 'terdaftar' && (
              <div className="flex flex-col gap-0.5 text-sm">
                <InfoRow label="Nama" value={pemiluResult.nama || '-'} />
                <InfoRow label="DPT Tahun" value={pemiluResult.dptTahun || '-'} />
                <InfoRow label="NIK" value={pemiluResult.nik || '-'} />
                <InfoRow label="Jenis Kelamin" value={pemiluResult.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'} />
                <InfoRow label="No. Urut DPT" value={pemiluResult.noUrut || '-'} />
                <InfoRow label="Lokasi TPS" value={pemiluResult.tps || '-'} />
                <InfoRow label="Status" value="Aktif" />
              </div>
            )}
            {pemiluResult.status === 'tidak_terdaftar' && (
              <p className="text-center text-gray-600 dark:text-zinc-400">{pemiluResult.keterangan}</p>
            )}
          </div>
        </StatusPopup>
      )}

      {/* Popup: Hasil Aspirasi */}
      {popup && !bansosResult && !pemiluResult && (
        <StatusPopup
          isOpen
          onClose={closePopup}
          variant="success"
          judul="Laporan Berhasil Dikirim"
          actions={
            <>
              <a href="/warga/history" className="w-full py-3 rounded-xl text-sm font-bold text-center bg-[#5c3a21] text-white hover:bg-[#4a2f1a] transition-colors block">
                Lihat Selengkapnya
              </a>
              <button onClick={closePopup} className="w-full py-3 rounded-xl text-sm font-semibold text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
                Tutup
              </button>
            </>
          }
        >
          <div className="text-left mt-2 mb-1">
            <div className="flex flex-col gap-0.5 text-sm">
              <InfoRow label="Jenis Laporan" value={aspirasiJenis.join(', ') || '-'} />
              <InfoRow label="Pelapor" value={MOCK_USER.nama} />
              <InfoRow label="Tanggal" value={new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })} />
            </div>
          </div>
        </StatusPopup>
      )}
    </div>
  );
}
