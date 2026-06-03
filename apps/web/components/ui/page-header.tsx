import type { ReactNode } from "react";
import { Landmark } from "lucide-react";

import { cn } from "@/lib/utils";

type PageHeaderVariant = "default" | "brand";

interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
  bottomSlot?: ReactNode;
  variant?: PageHeaderVariant;
  className?: string;
  contentClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  disableSafeArea?: boolean;
}

export default function PageHeader({
  title,
  description,
  eyebrow = "Portal RW 25 Cimahi",
  leftSlot,
  rightSlot,
  bottomSlot,
  variant = "default",
  className,
  contentClassName,
  titleClassName,
  descriptionClassName,
  disableSafeArea = false,
}: PageHeaderProps) {
  const isBrand = variant === "brand";

  return (
    <header
      className={cn(
        "relative overflow-hidden border-b border-input transition-colors duration-300",
        "min-h-[208px]",
        isBrand ? "bg-primary text-primary-foreground" : "bg-background text-foreground",
        disableSafeArea ? "px-5 py-4" : "safe-top px-5 pb-4",
        className,
      )}
    >
      {isBrand ? <div className="batik-primary-overlay" /> : null}

      <div className={cn("relative z-10 flex items-start justify-between gap-3", contentClassName)}>
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              "flex items-center gap-1.5 text-[10px] font-semibold",
              isBrand ? "text-primary-foreground/70" : "text-muted-foreground",
            )}
          >
            <Landmark className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="truncate">{eyebrow}</span>
          </div>
          <h1 className={cn("mt-1 text-lg font-bold tracking-tight", titleClassName)}>{title}</h1>
          {description ? (
            <p
              className={cn(
                "mt-1 text-[12px]",
                isBrand ? "text-primary-foreground/75" : "text-muted-foreground",
                descriptionClassName,
              )}
            >
              {description}
            </p>
          ) : null}
        </div>

        {(leftSlot || rightSlot) && (
          <div className="flex shrink-0 items-center gap-2">
            {leftSlot}
            {rightSlot}
          </div>
        )}
      </div>

      {bottomSlot ? <div className="relative z-10 mt-4">{bottomSlot}</div> : null}
    </header>
  );
}
