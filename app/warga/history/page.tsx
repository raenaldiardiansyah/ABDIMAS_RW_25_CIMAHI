'use client';

import { useState } from 'react';
import { ClipboardList, Inbox, ImageIcon, X } from 'lucide-react';
import TabBar from '@/components/warga/TabBar';
import HistoryCard from '@/components/warga/HistoryCard';
import BansosResultSheet from '@/components/warga/BansosResultSheet';
import PemiluResultSheet from '@/components/warga/PemiluResultSheet';
import { MOCK_HISTORY, MOCK_USER } from '@/constants/mockData';
import type { HistoryItem, BansosResult, PemiluResult, AspirasiResult } from '@/types/warga';

const TABS = ['Bansos', 'Pemilu', 'Laporan'];
const TAB_TYPE_MAP = ['bansos', 'pemilu', 'laporan'] as const;

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedBansos, setSelectedBansos] = useState<BansosResult | null>(null);
  const [selectedPemilu, setSelectedPemilu] = useState<PemiluResult | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const filteredItems = MOCK_HISTORY.filter((item) => item.tipe === TAB_TYPE_MAP[activeTab]);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const handleBansosClick = (item: HistoryItem) => {
    setSelectedBansos(item.detail as BansosResult);
  };

  const renderDetail = (item: HistoryItem) => {
    if (item.tipe === 'bansos') {
      const d = item.detail as BansosResult;
      return (
        <div className="flex flex-col gap-1.5">
          <DetailRow label="Nama Penerima" value={d.nama} />
          <DetailRow label="NIK" value={d.nik} />
          <DetailRow label="Program" value={d.program} />
          {d.dtks && <DetailRow label="DTKS Tahun" value={d.dtks} />}
          {d.keterangan && (
            <div className="mt-2 pt-2 border-t border-[#4a2810]/10">
              <p className="text-[12px] text-[#7a5230] leading-relaxed">{d.keterangan}</p>
            </div>
          )}
        </div>
      );
    }
    if (item.tipe === 'pemilu') {
      const d = item.detail as PemiluResult;
      return (
        <div className="flex flex-col gap-1.5">
          {d.nama && <DetailRow label="Nama" value={d.nama} />}
          {d.nik && <DetailRow label="NIK" value={d.nik} />}
          {/* We omit some details from the accordion so the user sees them in the popup, but since the requirement says "dimuncul kan nama pengguna NIK dll", we keep them or just the basic ones */}
          <div className="mt-3">
            <button 
              onClick={() => setSelectedPemilu(d)}
              className="w-full py-2.5 rounded-xl text-[13px] font-bold text-center bg-[#4a2810] text-white hover:bg-[#5a3318] transition-colors"
            >
              Lihat Detail Pemilu
            </button>
          </div>
        </div>
      );
    }
    if (item.tipe === 'laporan') {
      const d = item.detail as AspirasiResult;
      return (
        <div className="flex flex-col gap-1.5">
          <DetailRow label="Jenis Laporan" value={d.jenis === 'masukan' ? 'Masukan' : 'Keluhan'} />
          <DetailRow label="Pelapor" value={d.pelapor} />
          <DetailRow label="Tanggal" value={d.tanggal} />
          <div className="mt-2 pt-2 border-t border-[#4a2810]/10">
            <p className="text-[13px] font-bold text-[#4a2810] mb-1">Komentar:</p>
            <p className="text-[12px] text-[#7a5230] leading-relaxed">{d.uraian}</p>
            
            {d.lampiran && (
              <button 
                onClick={() => setSelectedPhoto(d.lampiran!)}
                className="mt-3 flex items-center justify-center gap-2 w-full py-2 bg-[#f5e8dc] hover:bg-[#e8d5c4] text-[#4a2810] text-[13px] font-bold rounded-xl transition-colors border border-[#4a2810]/10"
              >
                <ImageIcon className="w-4 h-4" />
                Foto
              </button>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 bg-white border-b-[0.5px] border-[#EEE5DF]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--brand-faint)] flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-[var(--brand)]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">Riwayat Aktivitas</h1>
            <p className="text-[12px] text-gray-400">Semua riwayat pengecekan & laporan Anda</p>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="px-5 py-3 bg-white">
        <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Daftar Riwayat */}
      <div className="flex-1 px-5 pb-6 pt-3">
        {TAB_TYPE_MAP[activeTab] === 'laporan' ? (
          (() => {
            const myReports = filteredItems.filter(i => (i.detail as AspirasiResult).pelapor === MOCK_USER.nama);
            const otherReports = filteredItems.filter(i => (i.detail as AspirasiResult).pelapor !== MOCK_USER.nama);
            
            return (
              <div className="flex flex-col gap-5">
                <div>
                  <h2 className="text-sm font-bold text-[#4a2810] mb-3">Laporan Saya</h2>
                  {myReports.length > 0 ? (
                    <div className="flex flex-col gap-2.5 stagger-children">
                      {myReports.map((item) => (
                        <HistoryCard
                          key={item.id}
                          tanggal={item.tanggal}
                          judul={item.judul}
                          deskripsi={item.deskripsi}
                          status={item.status}
                          statusColor={item.statusColor}
                          isExpanded={expandedId === item.id}
                          onClick={() => toggleExpand(item.id)}
                        >
                          {renderDetail(item)}
                        </HistoryCard>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center border border-dashed border-[#4a2810]/20 rounded-2xl bg-white/50">
                      <p className="text-sm font-semibold text-[#a07650]">Laporan Kosong</p>
                      <p className="text-xs text-[#a07650]/80 mt-1">Anda belum mengirim laporan apapun.</p>
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="text-sm font-bold text-[#4a2810] mb-3 pt-2 border-t border-[#4a2810]/10">Semua Laporan Warga</h2>
                  {otherReports.length > 0 ? (
                    <div className="flex flex-col gap-2.5 stagger-children">
                      {otherReports.map((item) => (
                        <HistoryCard
                          key={item.id}
                          tanggal={item.tanggal}
                          judul={item.judul}
                          deskripsi={item.deskripsi}
                          status={item.status}
                          statusColor={item.statusColor}
                          isExpanded={expandedId === item.id}
                          onClick={() => toggleExpand(item.id)}
                        >
                          {renderDetail(item)}
                        </HistoryCard>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#a07650] text-center py-4">Belum ada laporan dari warga lain.</p>
                  )}
                </div>
              </div>
            );
          })()
        ) : filteredItems.length > 0 ? (
          <div className="flex flex-col gap-2.5 stagger-children">
            {filteredItems.map((item) => (
              <HistoryCard
                key={item.id}
                tanggal={item.tanggal}
                judul={item.judul}
                deskripsi={item.deskripsi}
                status={item.status}
                statusColor={item.statusColor}
                isExpanded={item.tipe !== 'bansos' && expandedId === item.id}
                onClick={() => item.tipe === 'bansos' ? handleBansosClick(item) : toggleExpand(item.id)}
              >
                {item.tipe !== 'bansos' && renderDetail(item)}
              </HistoryCard>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white border border-[#4a2810]/10 flex items-center justify-center mb-4">
              <Inbox className="w-7 h-7 text-[#a07650]" />
            </div>
            <p className="text-sm font-semibold text-[#4a2810]">Belum Ada Riwayat</p>
            <p className="text-xs text-[#7a5230] mt-1 max-w-[200px]">
              Riwayat akan muncul setelah Anda melakukan pengecekan.
            </p>
          </div>
        )}
      </div>

      {/* Bansos Result Sheet (slide-up popup) */}
      {selectedBansos && (
        <BansosResultSheet
          isOpen={!!selectedBansos}
          onClose={() => setSelectedBansos(null)}
          result={selectedBansos}
        />
      )}

      {/* Pemilu Result Sheet (slide-up popup) */}
      {selectedPemilu && (
        <PemiluResultSheet
          isOpen={!!selectedPemilu}
          onClose={() => setSelectedPemilu(null)}
          result={selectedPemilu}
        />
      )}

      {/* Photo Viewer Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200">
          <button 
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/50 rounded-full transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="relative w-full max-w-2xl h-full max-h-[80vh] rounded-xl overflow-hidden flex items-center justify-center">
            {/* Using standard img for external/dummy url support */}
            <img 
              src={selectedPhoto} 
              alt="Lampiran Laporan" 
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start py-1">
      <span className="text-[#7a5230] text-[13px] shrink-0">{label}</span>
      <span className="font-semibold text-[#4a2810] text-[13px] text-right ml-4">{value}</span>
    </div>
  );
}
