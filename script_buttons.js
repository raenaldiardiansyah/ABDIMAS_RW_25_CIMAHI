const fs = require('fs');
const path = 'apps/web/app/(app)/warga/(main)/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// Bansos
const bansosButton = `<Button
            onClick={handleBansosSubmit}
            disabled={isBansosSubmitDisabled || submitting === 'bansos'}
            className="h-12 rounded-xl font-semibold"
          >
            {submitting === 'bansos' ? 'Memproses...' : 'Konfirmasi'}
          </Button>`;

const bansosReplacement = `<div className="mt-2 flex gap-3">
            <Button
              variant="outline"
              onClick={closeSheet}
              disabled={submitting === 'bansos'}
              className="h-12 flex-1 rounded-xl font-semibold"
            >
              Batal
            </Button>
            <Button
              onClick={handleBansosSubmit}
              disabled={isBansosSubmitDisabled || submitting === 'bansos'}
              className="h-12 flex-1 rounded-xl font-semibold"
            >
              {submitting === 'bansos' ? 'Memproses...' : 'Konfirmasi'}
            </Button>
          </div>`;
code = code.replace(bansosButton, bansosReplacement);

// Pemilu
const pemiluButton = `<Button
            onClick={handlePemiluSubmit}
            disabled={isPemiluSubmitDisabled || submitting === 'pemilu'}
            className="mt-2 h-12 rounded-xl font-semibold"
          >
            {submitting === 'pemilu' ? 'Memproses...' : 'Konfirmasi'}
          </Button>`;

const pemiluReplacement = `<div className="mt-2 flex gap-3">
            <Button
              variant="outline"
              onClick={closeSheet}
              disabled={submitting === 'pemilu'}
              className="h-12 flex-1 rounded-xl font-semibold"
            >
              Batal
            </Button>
            <Button
              onClick={handlePemiluSubmit}
              disabled={isPemiluSubmitDisabled || submitting === 'pemilu'}
              className="h-12 flex-1 rounded-xl font-semibold"
            >
              {submitting === 'pemilu' ? 'Memproses...' : 'Konfirmasi'}
            </Button>
          </div>`;
code = code.replace(pemiluButton, pemiluReplacement);

// Aspirasi
const aspirasiButton = `<Button
            onClick={handleAspirasiSubmit}
            disabled={aspirasiJenis.length === 0 || !aspirasiUraian.trim() || submitting === 'aspirasi'}
            className="mt-2 h-12 rounded-xl font-semibold"
          >
            {submitting === 'aspirasi' ? 'Mengirim...' : 'Konfirmasi'}
          </Button>`;

const aspirasiReplacement = `<div className="mt-2 flex gap-3">
            <Button
              variant="outline"
              onClick={closeSheet}
              disabled={submitting === 'aspirasi'}
              className="h-12 flex-1 rounded-xl font-semibold"
            >
              Batal
            </Button>
            <Button
              onClick={handleAspirasiSubmit}
              disabled={aspirasiJenis.length === 0 || !aspirasiUraian.trim() || submitting === 'aspirasi'}
              className="h-12 flex-1 rounded-xl font-semibold"
            >
              {submitting === 'aspirasi' ? 'Mengirim...' : 'Konfirmasi'}
            </Button>
          </div>`;
code = code.replace(aspirasiButton, aspirasiReplacement);

fs.writeFileSync(path, code, 'utf8');
