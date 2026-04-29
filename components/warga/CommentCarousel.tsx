'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const MOCK_COMMENTS = [
  { id: 1, name: "Budi Santoso", category: "Infrastruktur", report: "Jalan berlubang di RT 03", comment: "Sudah dikoordinasikan dengan dinas PU, akan diperbaiki minggu depan.", time: "2 jam yang lalu" },
  { id: 2, name: "Siti Aminah", category: "Fasilitas Umum", report: "Lampu jalan mati", comment: "Petugas sudah ke lokasi untuk pengecekan dan penggantian lampu.", time: "5 jam yang lalu" },
  { id: 3, name: "Ahmad Riyadi", category: "Kebersihan", report: "Tumpukan sampah di pinggir kali", comment: "Jadwal pengangkutan sampah tambahan sedang diatur.", time: "1 hari yang lalu" },
  { id: 4, name: "Rina Kusuma", category: "Keamanan", report: "Pos ronda butuh perbaikan atap", comment: "Dana swadaya sudah terkumpul, perbaikan dimulai akhir bulan ini.", time: "2 hari yang lalu" }
];

export default function CommentCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;

    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          // Reset to start if we reached the end
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          // Scroll slightly to the right
          scrollRef.current.scrollBy({ left: clientWidth * 0.85, behavior: 'smooth' });
        }
      }
    }, 4000); // 4 seconds interval

    return () => clearInterval(interval);
  }, [isHovered]);

  return (
    <div className="w-full bg-[#f8f5f2] dark:bg-[#1a1a1a] border-t border-[#e5dcd3] dark:border-zinc-800 pt-5 pb-8 flex flex-col mt-auto shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
      <div className="px-5 flex justify-between items-center mb-4">
        <h3 className="font-bold text-[#4a2810] dark:text-zinc-100 flex items-center gap-2 text-[15px]">
          <MessageSquare size={18} className="text-[#8a5d3b] dark:text-[#c4a888]" />
          Tanggapan Laporan
        </h3>
        <Link href="/warga/history" className="text-xs font-semibold text-[#8a5d3b] dark:text-[#c4a888] flex items-center gap-1 hover:text-[#4a2810] dark:hover:text-zinc-200 transition-colors bg-[#f0eadd] dark:bg-zinc-800 px-3 py-1.5 rounded-full">
          Lihat Semua <ArrowRight size={14} />
        </Link>
      </div>

      <div 
        ref={scrollRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={() => setIsHovered(true)}
        onTouchEnd={() => setIsHovered(false)}
        className="w-full overflow-x-auto flex gap-4 px-5 pb-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {MOCK_COMMENTS.map((item) => (
          <div 
            key={item.id} 
            className="snap-center shrink-0 w-[85%] max-w-[320px] bg-white dark:bg-zinc-800/80 rounded-2xl p-4 shadow-sm border border-[#f0eadd] dark:border-zinc-700/50 flex flex-col gap-3"
          >
            <div className="flex justify-between items-start gap-2">
              <div>
                <p className="text-[10px] font-bold text-[#8a5d3b] dark:text-[#c4a888] uppercase tracking-wider">{item.category}</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100 line-clamp-1 mt-0.5">{item.report}</p>
              </div>
              <span className="text-[10px] font-medium text-gray-400 dark:text-zinc-500 whitespace-nowrap bg-gray-50 dark:bg-zinc-900 px-2 py-0.5 rounded-md">{item.time}</span>
            </div>
            
            <div className="bg-[#f8f5f2] dark:bg-zinc-900/80 rounded-xl p-3 border-l-2 border-[#8a5d3b] dark:border-[#c4a888] mt-1">
              <p className="text-xs text-gray-700 dark:text-zinc-300 leading-relaxed italic">
                "{item.comment}"
              </p>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-4 h-4 rounded-full bg-[#4a2810] dark:bg-[#c4a888] flex items-center justify-center">
                  <span className="text-[8px] font-bold text-white dark:text-[#1a1a1a]">RW</span>
                </div>
                <p className="text-[10px] font-semibold text-gray-600 dark:text-zinc-400">Admin RW 25</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
