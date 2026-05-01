'use client';

import { type ReactNode } from 'react';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

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
    bg: 'bg-[color:var(--accent-mint)]/12 border-[color:var(--accent-mint)]/30',
    iconColor: 'text-[color:var(--accent-mint)]',
    ringColor: 'ring-[color:var(--accent-mint)]/30',
  },
  warning: {
    icon: Clock,
    bg: 'bg-[color:var(--accent-amber)]/12 border-[color:var(--accent-amber)]/30',
    iconColor: 'text-[color:var(--accent-amber)]',
    ringColor: 'ring-[color:var(--accent-amber)]/30',
  },
  error: {
    icon: XCircle,
    bg: 'bg-[color:var(--accent-coral)]/12 border-[color:var(--accent-coral)]/30',
    iconColor: 'text-[color:var(--accent-coral)]',
    ringColor: 'ring-[color:var(--accent-coral)]/30',
  },
};

export default function StatusPopup({ isOpen, onClose, variant, judul, children, actions }: StatusPopupProps) {
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full max-w-sm rounded-3xl border-border bg-background p-0 overflow-hidden">
        <div className={cn('flex justify-center border-b pt-8 pb-4', config.bg)}>
          <div className={cn('flex h-16 w-16 items-center justify-center rounded-full border ring-4', config.bg, config.ringColor)}>
            <Icon className={cn('h-8 w-8', config.iconColor)} />
          </div>
        </div>
        <div className="px-6 pt-4 pb-6 text-center">
          <DialogTitle className="mb-3 text-lg font-bold text-foreground">{judul}</DialogTitle>
          <DialogDescription asChild>
            <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
          </DialogDescription>
        </div>
        {actions && (
          <div className="px-6 pb-6 flex flex-col gap-2">
            {actions}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
