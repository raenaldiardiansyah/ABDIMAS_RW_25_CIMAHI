'use client';

import { type ReactNode } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface SlideUpSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  deskripsi?: string;
  children: ReactNode;
}

export default function SlideUpSheet({ isOpen, onClose, title, deskripsi, children }: SlideUpSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="mx-auto w-full max-w-md rounded-t-[2rem] border-0 px-0 pb-0 pt-3 shadow-2xl"
      >
        <div className="flex justify-center pb-2">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>
        <SheetHeader className="px-6 pb-4">
          <SheetTitle>{title}</SheetTitle>
          {deskripsi ? <SheetDescription>{deskripsi}</SheetDescription> : null}
        </SheetHeader>
        <div className="max-h-[70vh] overflow-y-auto px-6 pb-8">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
