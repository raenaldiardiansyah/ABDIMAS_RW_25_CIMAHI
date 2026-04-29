'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface SlideUpSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  deskripsi?: string;
  children: ReactNode;
}

export default function SlideUpSheet({ isOpen, onClose, title, deskripsi, children }: SlideUpSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Tutup dengan tombol Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-t-[2rem] shadow-2xl animate-slide-up max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 dark:bg-zinc-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-2 pb-4">
          <div className="flex-1 pr-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
            {deskripsi && (
              <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1 leading-relaxed">{deskripsi}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors mt-1 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Konten */}
        <div className="flex-1 overflow-y-auto px-6 pb-8">
          {children}
        </div>
      </div>
    </div>
  );
}
