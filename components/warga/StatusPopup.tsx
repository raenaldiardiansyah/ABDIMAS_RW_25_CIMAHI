'use client';

import { useEffect, type ReactNode } from 'react';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';

type StatusVariant = 'success' | 'warning' | 'error';

interface StatusPopupProps {
  isOpen: boolean;
  onClose: () => void;
  variant: StatusVariant;
  judul: string;
  children: ReactNode;
  actions?: ReactNode;
}

const VARIANT_CONFIG = {
  success: {
    icon: CheckCircle2,
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    iconColor: 'text-emerald-500',
    ringColor: 'ring-emerald-200 dark:ring-emerald-800',
  },
  warning: {
    icon: Clock,
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    iconColor: 'text-amber-500',
    ringColor: 'ring-amber-200 dark:ring-amber-800',
  },
  error: {
    icon: XCircle,
    bg: 'bg-red-50 dark:bg-red-950/30',
    iconColor: 'text-red-500',
    ringColor: 'ring-red-200 dark:ring-red-800',
  },
};

export default function StatusPopup({ isOpen, onClose, variant, judul, children, actions }: StatusPopupProps) {
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

  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      />

      {/* Popup Card */}
      <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl animate-scale-in overflow-hidden">
        {/* Icon Area */}
        <div className={`flex justify-center pt-8 pb-4 ${config.bg}`}>
          <div className={`w-16 h-16 rounded-full ${config.bg} ring-4 ${config.ringColor} flex items-center justify-center`}>
            <Icon className={`w-8 h-8 ${config.iconColor}`} />
          </div>
        </div>

        {/* Konten */}
        <div className="px-6 pt-4 pb-6 text-center">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{judul}</h3>
          <div className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
            {children}
          </div>
        </div>

        {/* Aksi */}
        {actions && (
          <div className="px-6 pb-6 flex flex-col gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
