'use client';

import { ReactNode } from 'react';
import StatusBadge from './StatusBadge';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
    <Card className="w-full border border-input rounded-2xl overflow-hidden shadow-sm transition-all duration-200 bg-card">
      <Button
        type="button"
        onClick={onClick}
        variant="ghost"
        className={cn("w-full h-auto flex justify-start gap-3 p-4 text-left hover:bg-muted/30 transition-all duration-200 relative rounded-none", isExpanded ? "items-start" : "items-center")}
      >
        <div className="flex-1 min-w-0 relative z-10">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-[11px] text-muted-foreground font-semibold">{tanggal}</span>
            <StatusBadge status={status} color={statusColor} />
          </div>

          <div className="w-full border-t border-input mb-2.5" />

          <h4 className={cn("text-[15px] font-bold text-foreground break-words", !isExpanded && "line-clamp-2")}>
            {judul}
          </h4>
          <p className={cn("text-[12px] text-muted-foreground mt-0.5 break-words", !isExpanded && "line-clamp-3")}>
            {deskripsi}
          </p>
        </div>

        <div className={`shrink-0 relative z-10 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
          <div className="h-8 w-8 rounded-full bg-muted border border-input flex items-center justify-center">
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </Button>

      {/* Expanded Content */}
      <div
        className={cn("grid transition-all duration-300 ease-in-out bg-card", isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}
      >
        <div className="overflow-hidden">
          <div className="p-4 pt-4 bg-(--panel-soft) border-t border-(--panel-soft-border)">
            <div className="mt-1">
              {children}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}