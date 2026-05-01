'use client';

import { useRef } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

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
      <Label className="text-sm font-semibold text-foreground">{label}</Label>

      {!file ? (
        <Card
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="
            flex flex-col items-center justify-center gap-2 p-6 rounded-xl cursor-pointer
            border-2 border-dashed border-border
            bg-muted/40
            hover:border-primary
            hover:bg-primary/5
            transition-all duration-200
          "
        >
          <Upload className="w-6 h-6 text-muted-foreground/70" />
          <div className="text-center">
            <p className="text-sm text-muted-foreground font-medium">
              Klik atau seret file ke sini
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              JPG, PNG, PDF — Maks. {maxSizeMB}MB
            </p>
          </div>
        </Card>
      ) : (
        <Card className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border-border">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground/70">
              {(file.size / 1024).toFixed(0)} KB
            </p>
          </div>
          <Button
            type="button"
            onClick={() => onChange(null)}
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </Card>
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
      {error && <p className="text-xs text-destructive mt-0.5">{error}</p>}
    </div>
  );
}
