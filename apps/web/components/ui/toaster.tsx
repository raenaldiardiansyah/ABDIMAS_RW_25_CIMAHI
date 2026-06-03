"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useToast, type ToastItem } from "@/components/ui/use-toast";

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const variant = item.variant ?? "default";

  const variantClass =
    variant === "destructive"
      ? "border-red-500/30 bg-[color:var(--panel-on-brand)] text-[color:var(--panel-on-brand-foreground)]"
      : variant === "success"
        ? "border-emerald-500/30 bg-[color:var(--panel-on-brand)] text-[color:var(--panel-on-brand-foreground)]"
        : "border-input bg-background text-foreground";

  return (
    <div
      className={cn(
        "pointer-events-auto w-full max-w-[360px] rounded-xl border shadow-lg px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80",
        variantClass,
      )}
      role="status"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {item.title ? <p className="text-sm font-semibold leading-snug">{item.title}</p> : null}
          {item.description ? (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.description}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition"
          aria-label="Tutup notifikasi"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}

function ToasterInner() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed z-[200] top-4 right-4 flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => (
        <ToastCard key={t.id} item={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  );
}

export function Toaster() {
  return <ToasterInner />;
}
