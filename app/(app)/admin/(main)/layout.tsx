import type { ReactNode } from "react";

export default function AdminMainLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-[100svh] bg-[color:var(--admin-background)] text-[color:var(--admin-foreground)] p-6">
      <div className="mx-auto w-full max-w-5xl">{children}</div>
    </main>
  );
}

