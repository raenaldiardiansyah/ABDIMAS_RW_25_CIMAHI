'use client';

import { useRef } from 'react';
import { Upload, FileText, X } from 'lucide-react';

interface FormFileUploadProps {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
  accept?: string;
  maxSizeMB?: number;
  error?: string;
}

export default function FormFileUpload({
  label,
  file,
  onChange,
  accept = '.jpg,.jpeg,.png,.pdf',
  maxSizeMB = 5,
  error,
}: FormFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (f.size > maxSizeMB * 1024 * 1024) {
      alert(`Ukuran file maksimal ${maxSizeMB}MB`);
      return;
    }
    onChange(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
        {label}
      </label>

      {!file ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="
            flex flex-col items-center justify-center gap-2 p-6 rounded-xl cursor-pointer
            border-2 border-dashed border-gray-300 dark:border-zinc-600
            bg-gray-50 dark:bg-zinc-800/50
            hover:border-[#5c3a21] dark:hover:border-[#c4a07a]
            hover:bg-[#5c3a21]/5 dark:hover:bg-[#c4a07a]/5
            transition-all duration-200
          "
        >
          <Upload className="w-6 h-6 text-gray-400 dark:text-zinc-500" />
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-zinc-400 font-medium">
              Klik atau seret file ke sini
            </p>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
              JPG, PNG, PDF — Maks. {maxSizeMB}MB
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700">
          <div className="w-10 h-10 rounded-lg bg-[#5c3a21]/10 dark:bg-[#c4a07a]/10 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-[#5c3a21] dark:text-[#c4a07a]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 dark:text-zinc-300 truncate">{file.name}</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500">
              {(file.size / 1024).toFixed(0)} KB
            </p>
          </div>
          <button
            onClick={() => onChange(null)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-400 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
        className="hidden"
      />
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}
