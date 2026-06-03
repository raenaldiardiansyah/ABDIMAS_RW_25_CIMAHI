"use client";

import { useEffect, useState, type ReactNode } from "react";
import BottomNavBar from "@/components/warga/BottomNavBar";
import { ThemeContext } from "./theme-context";
import { IdentityContext, type VerificationStatus } from "./identity-context";

export default function WargaShellClient({
  children,
  identity,
}: {
  children: ReactNode;
  identity: {
    userName: string;
    userEmail: string;
    maskedNik: string;
    verificationStatus: VerificationStatus;
  };
}) {
  const [isDark, setIsDark] = useState(() => {
    try {
      return localStorage.getItem("abdimas-dark") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const toggleDark = () => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("abdimas-dark", String(next));
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleDark }}>
      <IdentityContext.Provider value={identity}>
        <div className="flex min-h-[100svh] justify-center bg-slate-100 px-0 transition-colors duration-300 sm:px-6 sm:py-6">
          <div className="relative flex h-[100dvh] min-h-[100svh] w-full max-w-md flex-col overflow-hidden bg-background text-foreground shadow-xl transition-colors duration-300 sm:min-h-[780px] sm:rounded-[28px] sm:border sm:border-slate-200">
            <main className="flex-1 overflow-y-auto pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">{children}</main>
            <BottomNavBar />
          </div>
        </div>
      </IdentityContext.Provider>
    </ThemeContext.Provider>
  );
}
