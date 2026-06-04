const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'apps/web/app/(app)/warga/mutasi/tambah/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove STEPS 3 and make STEPS 3 Konfirmasi
content = content.replace(/\{ id: 3, label: 'Berkas pendukung' \},\s*\{ id: 4, label: 'Konfirmasi' \},/, "{ id: 3, label: 'Konfirmasi' },");

// 2. Remove FormFileUpload imports
content = content.replace(/import FormFileUpload from '@/components/warga/FormFileUpload';\n/, '');

// 3. Remove files from FormData types
content = content.replace(/suratKeterangan: File \| null;\n\s*ktp: File \| null;\n\s*kk: File \| null;\n/, '');
content = content.replace(/suratKeterangan: null,\n\s*ktp: null,\n\s*kk: null,\n/g, '');

// 4. Update validateStep
content = content.replace(/if \(step === 1\) {[\s\S]*?if \(step === 2\)/, if (step === 1) {
      if (!form.jenisMutasi) newErrors.jenisMutasi = 'Jenis mutasi wajib dipilih';
      if (!form.tanggalMutasi) newErrors.tanggalMutasi = 'Tanggal mutasi wajib diisi';
    }
    if (step === 2));
content = content.replace(/if \(step === 3\) {[\s\S]*?setErrors\(newErrors\);/m, if (step === 3) {
      if (!form.telepon) newErrors.telepon = 'Nomor telepon wajib diisi';
    }
    setErrors(newErrors););

// 5. Update handleNext logic to 3 steps
content = content.replace(/if \(currentStep < 4\)/g, "if (currentStep < 3)");
content = content.replace(/if \(!validateStep\(4\)\) return;/g, "if (!validateStep(3)) return;");

// 6. Update handleSubmit to send JSON to /user-requests/mutation
const newSubmit = wait platformFetch('/user-requests/mutation', {
            method: 'POST',
            body: JSON.stringify({
              type: form.jenisMutasi === 'Mutasi Masuk' ? 'MUTATION_IN' : 'MUTATION_OUT',
              mutationDate: form.tanggalMutasi,
              fromAddress: form.alamatLama,
              toAddress: form.alamatBaru,
              targetRt: form.rtTujuan,
              phone: form.telepon,
              reason: form.alasanPindah
            }),
          });;
content = content.replace(/const formData = new FormData\(\);[\s\S]*?body: formData,\s*}\);/m, newSubmit);
content = content.replace(/router.push\('\/admin\/mutasi'\);/g, "router.push('/warga/layanan');");

// 7. Remove Detail Penduduk inputs from Step 1
content = content.replace(/<div className="rounded-\[12px\] border border-\[color:var\(--admin-border\)\] bg-white p-6 shadow-sm">\s*<h2 className="mb-6 text-xl font-bold text-\[color:var\(--admin-heading\)\]">Detail Penduduk<\/h2>[\s\S]*?<\/div>\s*<\/div>/,
            <div className="rounded-[12px] border border-gray-200 bg-white p-4 md:p-6 shadow-sm mt-6">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-800">Tanggal Mutasi<span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Input
                      ref={dateRef}
                      type="date"
                      value={form.tanggalMutasi}
                      onChange={(e) => handleFieldChange('tanggalMutasi', e.target.value)}
                      className={\h-12 rounded-xl pr-10 [&::-webkit-calendar-picker-indicator]:hidden \\}
                    />
                    <Calendar
                      className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 cursor-pointer text-gray-400 transition-colors hover:text-violet-600"
                      onClick={() => {
                        try {
                          dateRef.current?.showPicker();
                        } catch (e) {
                          dateRef.current?.focus();
                        }
                      }}
                    />
                  </div>
                  {errors.tanggalMutasi && <p className="mt-1 text-xs text-red-500">{errors.tanggalMutasi}</p>}
                </div>
            </div>
          );

// 8. Remove Step 3 (Berkas Pendukung) block, change Step 4 to Step 3
content = content.replace(/{\/\* STEP 3: Berkas Pendukung \*\/}
        {currentStep === 3 && \([\s\S]*?\)}/m, "");
content = content.replace(/{\/\* STEP 4: Konfirmasi \*\//, "{/* STEP 3: Konfirmasi */}");
content = content.replace(/currentStep === 4/g, "currentStep === 3");

// 9. Remove NIK, Nama, Jenis Kelamin, Pekerjaan from Konfirmasi
content = content.replace(/<div className="font-semibold text-\[color:var\(--admin-heading\)\]">NIK<\/div>[\s\S]*?<div className="text-right font-medium text-\[color:var\(--admin-heading\)\]">{form.pekerjaan}<\/div>/, "");

// 10. Replace colors
content = content.replace(/\[color:var\(--admin-primary\)\]/g, "#7C3AED"); // Violet 600
content = content.replace(/\[color:var\(--admin-primary-soft\)\]/g, "#EDE9FE"); // Violet 100
content = content.replace(/\[color:var\(--admin-primary-soft-border\)\]/g, "#DDD6FE"); // Violet 200
content = content.replace(/\[color:var\(--admin-primary-strong\)\]/g, "#6D28D9"); // Violet 700
content = content.replace(/\[color:var\(--admin-border\)\]/g, "gray-200");
content = content.replace(/\[color:var\(--admin-surface-muted\)\]/g, "#F8FAFC");
content = content.replace(/\[color:var\(--admin-heading\)\]/g, "gray-900");
content = content.replace(/\[color:var\(--admin-subtle\)\]/g, "gray-500");
content = content.replace(/\[color:var\(--admin-surface-soft\)\]/g, "gray-50");

// 11. Responsive grid columns (from grid-cols-2 to grid-cols-1 md:grid-cols-2)
content = content.replace(/className="grid grid-cols-2 gap-4"/g, 'className="grid grid-cols-1 md:grid-cols-2 gap-4"');
content = content.replace(/className="grid grid-cols-2 gap-6"/g, 'className="grid grid-cols-1 md:grid-cols-2 gap-6"');

// 12. Make headers and steps responsive
content = content.replace(/text-2xl/g, 'text-xl md:text-2xl');
content = content.replace(/p-6/g, 'p-4 md:p-6');

// Additional cleanup for the Berkas Pendukung block in Konfirmasi
content = content.replace(/<div className="rounded-\[12px\] border border-gray-200 bg-white p-4 md:p-6 shadow-sm">\s*<div className="mb-4 flex items-center gap-2">\s*<FileText[\s\S]*?<\/div>\s*<\/div>/,
            <div className="rounded-[12px] border border-gray-200 bg-white p-4 md:p-6 shadow-sm">
              <div className="mb-6 grid grid-cols-2 gap-y-4 text-sm">
                <div className="font-semibold text-gray-900">Nomor Telepon</div>
                <div className="text-right font-medium text-gray-900">+62 {form.telepon}</div>
              </div>
            </div>
);

fs.writeFileSync(filePath, content);
console.log('Done modifying mutasi/tambah/page.tsx');
