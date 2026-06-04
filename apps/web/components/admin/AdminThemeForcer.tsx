'use client';

import { useEffect } from 'react';

export function AdminThemeForcer() {
  useEffect(() => {
    // Memaksa menghapus class "dark" dari html jika ada (misal terbawa dari halaman warga atau local storage)
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
  }, []);

  return null;
}
