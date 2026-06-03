const fs = require('fs');

const path = 'apps/web/app/(app)/admin/(main)/kartu-keluarga/page.tsx';
let lines = fs.readFileSync(path, 'utf8').split('\n');

if (!lines.some(l => l.includes('@/components/ui/select'))) {
  const inputIdx = lines.findIndex(l => l.includes('@/components/ui/input'));
  lines.splice(inputIdx + 1, 0, `import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';`);
}

const filterOpenIdx = lines.findIndex(l => l.includes('const [filterOpen, setFilterOpen]'));
if (filterOpenIdx !== -1) lines.splice(filterOpenIdx, 1);
const tempRtIdx = lines.findIndex(l => l.includes('const [tempRt, setTempRt]'));
if (tempRtIdx !== -1) lines.splice(tempRtIdx, 1);

const startIdx = lines.findIndex(l => l.includes('<div className="relative">') && lines[lines.indexOf(l) + 1].includes('<Button'));

if (startIdx !== -1) {
    const replacement = `        <div className="w-[180px] shrink-0">
          <Select value={activeRt === '' ? 'ALL' : activeRt} onValueChange={(val: any) => setActiveRt(val === 'ALL' ? '' : val)}>
            <SelectTrigger className="h-10 rounded-full border border-gray-200 bg-white font-medium text-gray-700 shadow-sm focus:ring-[#3B82F6]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-[#3B82F6]" />
                <SelectValue placeholder="Semua RT" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua RT</SelectItem>
              <SelectItem value="01">RT 01</SelectItem>
              <SelectItem value="02">RT 02</SelectItem>
              <SelectItem value="03">RT 03</SelectItem>
              <SelectItem value="04">RT 04</SelectItem>
              <SelectItem value="05">RT 05</SelectItem>
            </SelectContent>
          </Select>
        </div>`;
    lines.splice(startIdx, 46, replacement);
}

fs.writeFileSync(path, lines.join('\n'));
console.log('Successfully updated filter in kartu-keluarga/page.tsx using line slicing');
