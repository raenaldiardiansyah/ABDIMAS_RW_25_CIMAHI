const fs = require('fs');
const glob = require('glob'); // Note: glob might not be installed, better to just list files
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
  
  if (content.includes('<input') && !content.includes('import { Input }')) {
    content = content.replace(/(import .*? from '.*?';\n)/, "$1import { Input } from '@/components/ui/input';\n");
    changed = true;
  }
  if (content.includes('<button') && !content.includes('import { Button }')) {
    content = content.replace(/(import .*? from '.*?';\n)/, "$1import { Button } from '@/components/ui/button';\n");
    changed = true;
  }
  
  content = content.replace(/<input\b/g, '<Input');
  content = content.replace(/<\/input>/g, '</Input>');
  
  content = content.replace(/<button\b/g, '<Button');
  content = content.replace(/<\/button>/g, '</Button>');
  
  if (changed || content.includes('<Input') || content.includes('<Button')) {
    fs.writeFileSync(file, content);
    console.log('Refactored', file);
  }
}
