const fs = require('fs');
const files = [
  'd:/Downloads/TELKOM/ABDIMAS_RW_25_CIMAHI/apps/web/app/(app)/admin/(main)/data-penduduk/tambah/page.tsx',
  'd:/Downloads/TELKOM/ABDIMAS_RW_25_CIMAHI/apps/web/app/(app)/admin/(main)/page.tsx',
  'd:/Downloads/TELKOM/ABDIMAS_RW_25_CIMAHI/apps/web/app/(app)/admin/(main)/kartu-keluarga/page.tsx',
  'd:/Downloads/TELKOM/ABDIMAS_RW_25_CIMAHI/apps/web/app/(app)/admin/(main)/kartu-keluarga/[id]/page.tsx',
  'd:/Downloads/TELKOM/ABDIMAS_RW_25_CIMAHI/apps/web/app/(app)/admin/(main)/kegiatan/page.tsx',
  'd:/Downloads/TELKOM/ABDIMAS_RW_25_CIMAHI/apps/web/app/(app)/admin/(main)/kelola-admin/page.tsx',
  'd:/Downloads/TELKOM/ABDIMAS_RW_25_CIMAHI/apps/web/app/(app)/admin/(main)/laporan/page.tsx',
  'd:/Downloads/TELKOM/ABDIMAS_RW_25_CIMAHI/apps/web/app/(app)/admin/(main)/mutasi/page.tsx',
  'd:/Downloads/TELKOM/ABDIMAS_RW_25_CIMAHI/apps/web/app/(app)/admin/(main)/permohonan/page.tsx',
  'd:/Downloads/TELKOM/ABDIMAS_RW_25_CIMAHI/apps/web/app/(app)/admin/(main)/settings/page.tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  const hasInput = content.includes('<Input');
  const hasButton = content.includes('<Button');
  
  if (hasInput && !content.includes('import { Input }')) {
    content = content.replace(/(['"]use client['"];?\r?\n)/, "$1import { Input } from '@/components/ui/input';\n");
    changed = true;
  }
  
  if (hasButton && !content.includes('import { Button }')) {
    content = content.replace(/(['"]use client['"];?\r?\n)/, "$1import { Button } from '@/components/ui/button';\n");
    changed = true;
  }
  
  // also fix the TS7006 Parameter 'e' implicitly has an 'any' type in all these files by doing onChange={(e: any) =>
  if (content.includes('onChange={(e) =>')) {
     content = content.replace(/onChange=\{\(e\) =>/g, 'onChange={(e: any) =>');
     changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Fixed imports in', file);
  }
}
