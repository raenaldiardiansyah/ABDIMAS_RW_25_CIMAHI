'use client';

import { WarningCircle as AlertTriangle, Tray as Inbox, SpinnerGap as Loader2, ArrowClockwise as RotateCw } from '@phosphor-icons/react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type AdminAsyncStateProps = {
  mode: 'loading' | 'error' | 'empty';
  page: string;
  action: string;
  onRetry?: () => void;
  title?: string;
  description?: string;
  retryLabel?: string;
  className?: string;
  compact?: boolean;
};

export default function AdminAsyncState({
  mode,
  page,
  action,
  onRetry,
  title,
  description,
  retryLabel = 'Muat ulang',
  className,
  compact = false,
}: AdminAsyncStateProps) {
  const isLoading = mode === 'loading';
  const isError = mode === 'error';

  const Icon = isLoading ? Loader2 : isError ? AlertTriangle : Inbox;
  const iconClassName = isLoading
    ? 'text-[#2563EB]'
    : isError
      ? 'text-red-500'
      : 'text-[#94A3B8]';
  const containerClassName = isError
    ? 'border-red-100 bg-red-50/70'
    : 'border-[color:var(--admin-border)] bg-white';

  const resolvedTitle =
    title ??
    (isLoading
      ? `Memuat ${page}`
      : isError
        ? `Gagal ${action}`
        : `Belum ada data ${page.toLowerCase()}`);

  const resolvedDescription =
    description ??
    (isLoading
      ? `Sistem sedang ${action} untuk halaman ${page.toLowerCase()}.`
      : isError
        ? `Terjadi kendala saat ${action} untuk halaman ${page.toLowerCase()}. Coba muat ulang.`
        : `Data untuk halaman ${page.toLowerCase()} belum tersedia.`);

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-3xl border text-center shadow-sm',
        compact ? 'px-5 py-8' : 'px-6 py-12',
        containerClassName,
        className,
      )}
    >
      <div
        className={cn(
          'mb-4 flex items-center justify-center rounded-full',
          compact ? 'h-12 w-12' : 'h-14 w-14',
          isError ? 'bg-red-100' : 'bg-[#EFF6FF]',
        )}
      >
        <Icon className={cn(compact ? 'h-5 w-5' : 'h-6 w-6', iconClassName, isLoading && 'animate-spin')} />
      </div>
      <h3 className="text-base font-bold text-[#1E293B]">{resolvedTitle}</h3>
      <p className="mt-2 max-w-xl text-sm text-[#64748B]">{resolvedDescription}</p>
      {isError && onRetry ? (
        <Button
          type="button"
          onClick={onRetry}
          className="mt-5 rounded-xl bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
        >
          <RotateCw className="mr-2 h-4 w-4" />
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
