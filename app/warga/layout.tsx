'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import BottomNavBar from '@/components/warga/BottomNavBar';

// ── Dark Mode Context ────────────────────────────────────
interface ThemeContextType {
  isDark: boolean;
  toggleDark: () => void;
}

const ThemeContext = createContext<ThemeContextType>({ isDark: false, toggleDark: () => {} });
export const useTheme = () => useContext(ThemeContext);

export default function WargaLayout({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  // Cek preferensi dark mode tersimpan
  useEffect(() => {
    const saved = localStorage.getItem('abdimas-dark');
    if (saved === 'true') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDark = () => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('abdimas-dark', String(next));
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleDark }}>
      <div className="flex justify-center bg-gray-100 dark:bg-zinc-950 min-h-screen transition-colors duration-300">
        <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 flex flex-col h-[100dvh] overflow-hidden shadow-2xl transition-colors duration-300">

          {/* Area scroll konten */}
          <main className="flex-1 overflow-y-auto pb-24">
            {children}
          </main>

          {/* Bottom Navbar — menempel di bawah */}
          <BottomNavBar />
        </div>
      </div>
    </ThemeContext.Provider>
  );
}
