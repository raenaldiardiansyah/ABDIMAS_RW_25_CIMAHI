'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function KelolaAdminPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/hak-akses');
  }, [router]);

  return null;
}
