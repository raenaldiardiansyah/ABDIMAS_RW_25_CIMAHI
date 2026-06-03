import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function WargaPage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("min-h-full flex flex-col", className)}>{children}</div>;
}

export function WargaPageBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex-1 px-5 pt-5", className)}>
      {children}
    </div>
  );
}
