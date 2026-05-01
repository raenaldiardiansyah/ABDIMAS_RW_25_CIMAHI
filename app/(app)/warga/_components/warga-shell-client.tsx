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
        <div className="flex justify-center bg-muted min-h-[100svh] transition-colors duration-300">
          <div className="relative w-full max-w-md bg-background text-foreground flex flex-col min-h-[100svh] h-[100dvh] overflow-hidden shadow-2xl transition-colors duration-300">
            <main className="flex-1 overflow-y-auto pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">{children}</main>
            <BottomNavBar />
          </div>
        </div>
      </IdentityContext.Provider>
    </ThemeContext.Provider>
  );
}
