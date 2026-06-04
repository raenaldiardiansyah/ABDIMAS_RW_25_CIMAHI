const fs = require('fs');
const path = 'apps/web/app/(app)/warga/(main)/settings/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Remove Keamanan
// Match <div className="h-px bg-input mx-4" /> ... {/* Keamanan */} ... </div>
code = code.replace(
  /<div className="h-px bg-input mx-4" \/>\s*\{\/\* Keamanan \*\/\}[\s\S]*?(?=<\/div>\s*<\/div>\s*\{\/\* ── Tentang)/,
  ''
);

// 2. Update Notifikasi Logic
code = code.replace(
  /const \[notifikasi, setNotifikasi\] = useState\(true\);/,
  `const [notifikasi, setNotifikasi] = useState(false);
  const [notifStatus, setNotifStatus] = useState<string>('default');`
);

// Add useEffect
code = code.replace(
  /  useEffect\(\(\) => \{\n    let mounted = true;/,
  `  useEffect(() => {
    let mounted = true;

    const checkPermission = () => {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setNotifStatus(Notification.permission);
      }
    };
    checkPermission();
    window.addEventListener('notif-updated', checkPermission);`
);

// cleanup
code = code.replace(
  /    return \(\) => \{\n      mounted = false;\n    \};/,
  `    return () => {
      mounted = false;
      window.removeEventListener('notif-updated', checkPermission);
    };`
);

// Update button onClick for notification
code = code.replace(
  /onClick=\{async \(\) => \{\s*const nextValue = !notifikasi;\s*setNotifikasi\(nextValue\);\s*try \{\s*await savePreferences\(\{ notificationEnabled: nextValue \}\);\s*\} catch \{\s*setNotifikasi\(!nextValue\);\s*toast\(\{\s*title: 'Gagal menyimpan notifikasi',\s*description: 'Silakan coba lagi\.',\s*variant: 'destructive',\s*\}\);\s*\}\s*\}\}/,
  `onClick={async () => {
                  if (typeof window === 'undefined' || !('Notification' in window)) {
                    toast({ title: 'Tidak Didukung', description: 'Browser Anda tidak mendukung notifikasi.' });
                    return;
                  }
                  if (notifStatus === 'denied') {
                    toast({ title: 'Notifikasi Diblokir', description: 'Anda memblokir notifikasi. Silakan ubah di pengaturan browser.', variant: 'destructive' });
                    return;
                  }
                  if (notifStatus !== 'granted') {
                    const p = await Notification.requestPermission();
                    setNotifStatus(p);
                    window.dispatchEvent(new CustomEvent('notif-updated'));
                    if (p === 'granted') {
                      new Notification('Portal RW 25', { body: 'Notifikasi berhasil diaktifkan!', icon: '/favicon.ico' });
                    } else {
                      return;
                    }
                  }
                  const nextValue = !notifikasi;
                  setNotifikasi(nextValue);
                  try {
                    await savePreferences({ notificationEnabled: nextValue });
                  } catch {
                    setNotifikasi(!nextValue);
                    toast({
                      title: 'Gagal menyimpan notifikasi',
                      description: 'Silakan coba lagi.',
                      variant: 'destructive',
                    });
                  }
                }}`
);

// Update Notification toggle rendering logic
code = code.replace(
  /\{notifikasi \? t\.active : t\.inactive\}/g,
  `{notifStatus === 'granted' ? t.active : notifStatus === 'denied' ? 'Diblokir' : t.inactive}`
);
code = code.replace(
  /\$\{notifikasi \? 'bg-primary' : 'bg-muted-foreground\/35'\}/g,
  `\${notifStatus === 'granted' && notifikasi ? 'bg-primary' : 'bg-muted-foreground/35'}`
);
code = code.replace(
  /\$\{notifikasi \? 'left-\[22px\]' : 'left-0\.5'\}/g,
  `\${notifStatus === 'granted' && notifikasi ? 'left-[22px]' : 'left-0.5'}`
);

// 3. Update Tentang Aplikasi Content
// <SlideUpSheet isOpen={activeSheet === 'tentang'} ...> <div> ... </div> </SlideUpSheet>
code = code.replace(
  /<SlideUpSheet\s*isOpen=\{activeSheet === 'tentang'\}\s*onClose=\{\(\) => setActiveSheet\(null\)\}\s*title=\{t\.appAbout\}\s*>[\s\S]*?<\/SlideUpSheet>/,
  `<SlideUpSheet
        isOpen={activeSheet === 'tentang'}
        onClose={() => setActiveSheet(null)}
        title={t.appAbout}
      >
        <div className="flex flex-col p-6 text-left gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg shrink-0">
              <Landmark className="w-8 h-8 text-white" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Portal RW 25</h3>
              <p className="text-sm text-muted-foreground">Versi 1.0.0</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Portal RW 25 adalah sistem informasi digital untuk mengelola data kependudukan warga di lingkungan RW 025, Kota Cimahi. Aplikasi ini membantu pengurus RW mengelola data warga, kartu keluarga, mutasi penduduk, dan permohonan secara efisien.
          </p>
          <div className="w-full h-px bg-input my-2" />
          <div className="space-y-1 text-sm text-muted-foreground">
            <p><strong>Versi:</strong> 1.0.0 (Build 2026.04)</p>
            <p><strong>Dikembangkan oleh:</strong> Tim ABDIMAS — Telkom University</p>
            <p><strong>Untuk:</strong> RW 025, Kota Cimahi, Jawa Barat</p>
          </div>
        </div>
      </SlideUpSheet>`
);

fs.writeFileSync(path, code, 'utf8');
