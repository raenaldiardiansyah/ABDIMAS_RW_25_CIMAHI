const fs = require('fs');
const path = 'apps/web/app/(app)/warga/(main)/settings/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Remove Mode Gelap
const modeGelapStart = code.indexOf('{/* Dark Mode Toggle */}');
const modeGelapEnd = code.indexOf('{/* Bahasa */}');
if (modeGelapStart !== -1 && modeGelapEnd !== -1) {
  code = code.substring(0, modeGelapStart) + code.substring(modeGelapEnd);
}

// 2. Remove Keamanan
const keamananStart = code.indexOf('{/* Keamanan */}');
const keamananEnd = code.indexOf('</div>\n        </div>\n\n        {/* ── Tentang');
if (keamananStart !== -1 && keamananEnd !== -1) {
  // also remove the separator line before it
  const separatorStart = code.lastIndexOf('<div className="h-px bg-input mx-4" />', keamananStart);
  if (separatorStart !== -1) {
    code = code.substring(0, separatorStart) + code.substring(keamananEnd);
  }
}

// 3. Update Notifikasi Logic
code = code.replace(
  /const \[notifikasi, setNotifikasi\] = useState\(true\);/,
  `const [notifikasi, setNotifikasi] = useState(false);
  const [notifStatus, setNotifStatus] = useState<string>('default');`
);

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

code = code.replace(
  /    return \(\) => \{\n      mounted = false;\n    \};/,
  `    return () => {
      mounted = false;
      window.removeEventListener('notif-updated', checkPermission);
    };`
);

const notifOnClickOriginal = `                onClick={async () => {
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
                }}`;
const notifOnClickNew = `                onClick={async () => {
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
                }}`;
code = code.replace(notifOnClickOriginal, notifOnClickNew);

code = code.replace(
  /\{notifikasi \? t\.active : t\.inactive\}/,
  `{notifStatus === 'granted' ? t.active : notifStatus === 'denied' ? 'Diblokir' : t.inactive}`
);
code = code.replace(
  /\$\{notifikasi \? 'bg-primary' : 'bg-muted-foreground\/35'\}/,
  `\${notifStatus === 'granted' && notifikasi ? 'bg-primary' : 'bg-muted-foreground/35'}`
);
code = code.replace(
  /\$\{notifikasi \? 'left-\[22px\]' : 'left-0\.5'\}/,
  `\${notifStatus === 'granted' && notifikasi ? 'left-[22px]' : 'left-0.5'}`
);

// 4. Update Tentang Aplikasi Content
const tentangOldStart = code.indexOf('<div className="flex flex-col items-center justify-center p-6 text-center gap-4">');
const tentangOldEnd = code.indexOf('</SlideUpSheet>', tentangOldStart);

if (tentangOldStart !== -1 && tentangOldEnd !== -1) {
  const tentangNew = `<div className="flex flex-col p-6 text-left gap-4">
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
      `;
  code = code.substring(0, tentangOldStart) + tentangNew + code.substring(tentangOldEnd);
}

fs.writeFileSync(path, code, 'utf8');
