const fs = require('fs');
const path = 'apps/web/app/(app)/admin/(main)/settings/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add PageHeader to the top
const returnStart = code.indexOf('return (\n    <div className="flex flex-col gap-5 py-6 w-full">');
if (returnStart !== -1) {
  code = code.substring(0, returnStart) + `return (
    <div className="flex flex-col gap-5 py-6 w-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#18212F]">Pengaturan</h1>
        <p className="text-[#667085] mt-1">Kelola preferensi akun dan sistem Anda</p>
      </div>
` + code.substring(returnStart + 'return (\n    <div className="flex flex-col gap-5 py-6 w-full">'.length);
}

// 2. Fix Tentang Aplikasi to show Dialog directly instead of event
code = code.replace(
  /onClick=\{\(\) => document\.dispatchEvent\(new CustomEvent\('open-admin-help'\)\)\}/,
  `onClick={() => setActiveDialog('tentang')}`
);

// 3. Add 'tentang' to the activeDialog handling
const dialogString = `{activeDialog === 'bahasa' && 'Pilih Bahasa'}\n              {activeDialog === 'security' && 'Fitur Segera Hadir'}`;
code = code.replace(
  dialogString,
  `{activeDialog === 'bahasa' && 'Pilih Bahasa'}\n              {activeDialog === 'security' && 'Fitur Segera Hadir'}\n              {activeDialog === 'tentang' && 'Tentang Aplikasi'}`
);

const descString = `{activeDialog === 'bahasa' && 'Pilih bahasa antarmuka sistem.'}\n              {activeDialog === 'security' && 'Pengaturan keamanan di halaman ini masih bersifat informasional. Perubahan kredensial dikelola dari alur admin management/backend.'}`;
code = code.replace(
  descString,
  `{activeDialog === 'bahasa' && 'Pilih bahasa antarmuka sistem.'}\n              {activeDialog === 'security' && 'Pengaturan keamanan di halaman ini masih bersifat informasional. Perubahan kredensial dikelola dari alur admin management/backend.'}\n              {activeDialog === 'tentang' && 'Informasi tentang Portal RW 25.'}`
);

const dialogFooterStart = code.indexOf('<AlertDialogFooter className="mt-6">');
if (dialogFooterStart !== -1) {
  const tentangContent = `
          {activeDialog === 'tentang' && (
            <div className="flex flex-col gap-4 mt-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F6ECE6]">
                  <Smartphone className="h-8 w-8 text-[#A44A3F]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#18212F]">Portal RW 25</h3>
                  <p className="text-sm text-[#667085]">Versi 1.0.0</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-[#667085]">
                Portal RW 25 adalah sistem informasi digital untuk mengelola data kependudukan warga di lingkungan RW 025, Kota Cimahi. Aplikasi ini membantu pengurus RW mengelola data warga, kartu keluarga, mutasi penduduk, dan permohonan secara efisien.
              </p>
              <div className="h-px bg-[#EEF2F6]" />
              <div className="space-y-1 text-sm text-[#667085]">
                <p><strong>Versi:</strong> 1.0.0 (Build 2026.04)</p>
                <p><strong>Dikembangkan oleh:</strong> Tim ABDIMAS — Telkom University</p>
                <p><strong>Untuk:</strong> RW 025, Kota Cimahi, Jawa Barat</p>
              </div>
            </div>
          )}
          `;
  code = code.substring(0, dialogFooterStart) + tentangContent + code.substring(dialogFooterStart);
}

fs.writeFileSync(path, code, 'utf8');
