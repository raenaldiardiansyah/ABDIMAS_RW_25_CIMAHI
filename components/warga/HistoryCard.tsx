'use client';

import { ReactNode } from 'react';
import StatusBadge from './StatusBadge';
import { ChevronDown } from 'lucide-react';

interface HistoryCardProps {
  tanggal: string;
  judul: string;
  deskripsi: string;
  status: string;
  statusColor: 'green' | 'amber' | 'red';
  isExpanded?: boolean;
  onClick: () => void;
  children?: ReactNode;
}

export default function HistoryCard({ 
  tanggal, 
  judul, 
  deskripsi, 
  status, 
  statusColor, 
  isExpanded = false,
  onClick,
  children
}: HistoryCardProps) {
  return (
    <div className="w-full bg-[var(--brand)] rounded-2xl overflow-hidden shadow-sm transition-all duration-200">
      <button
        onClick={onClick}
        className="
          w-full flex items-center gap-3 p-4 text-left
          hover:opacity-95 active:scale-[0.99]
          transition-all duration-200 relative
        "
      >
        {/* Pattern Layer */}
        <div className="card-pattern-layer opacity-40"></div>

        <div className="flex-1 min-w-0 relative z-10">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-[11px] text-[var(--card-sub)] font-medium opacity-80">{tanggal}</span>
            <StatusBadge status={status} color={statusColor} />
          </div>

          <div className="w-full border-t border-white/10 mb-2.5" />

          <h4 className="text-[15px] font-bold text-white truncate">{judul}</h4>
          <p className="text-[12px] text-[var(--card-sub)] mt-0.5 truncate">{deskripsi}</p>
        </div>
        
        <div className={`shrink-0 relative z-10 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
          <ChevronDown className="w-5 h-5 text-white/50" />
        </div>
      </button>

      {/* Expanded Content */}
      <div 
        className={`grid transition-all duration-300 ease-in-out bg-white ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">
          {/* Pembatas antara coklat dengan canvas putih */}
          <div className="p-4 pt-4 bg-white border-t-[3px] border-[#a07650]/30 shadow-inner">
            <div className="mt-1">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
