import type { ReactNode } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";

/**
 * Inline script that runs BEFORE React hydration to strip the "dark" class
 * from <html>. The warga side persists dark-mode preference in localStorage
 * and applies it eagerly via useState initialiser, so by the time any
 * useEffect fires the page is already painted dark. This script runs
 * synchronously in the <head> equivalent and guarantees a clean light-mode
 * shell for the admin panel.
 */
const FORCE_LIGHT_SCRIPT = `document.documentElement.classList.remove("dark");`;

export default function AdminMainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[color:var(--admin-background)] text-[color:var(--admin-heading)]">
      <script dangerouslySetInnerHTML={{ __html: FORCE_LIGHT_SCRIPT }} />
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar />
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
          <div className="mx-auto w-full max-w-[1440px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
