'use client';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface FormTextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  error?: string;
}

export default function FormTextarea({ label, value, onChange, placeholder, maxLength = 500, error }: FormTextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold text-foreground">{label}</Label>
        <span className={`text-xs ${value.length >= maxLength ? 'text-destructive' : 'text-muted-foreground'}`}>
          {value.length}/{maxLength}
        </span>
      </div>
      <Textarea
        value={value}
        onChange={(e) => {
          if (e.target.value.length <= maxLength) {
            onChange(e.target.value);
          }
        }}
        placeholder={placeholder}
        rows={4}
        className={cn(
          'min-h-[112px] resize-none rounded-2xl border-border bg-muted/40 px-3 py-3 shadow-none focus-visible:ring-1 focus-visible:ring-primary/35 focus-visible:ring-offset-0',
          error && 'border-destructive focus-visible:ring-destructive/50',
        )}
      />
      {error && <p className="text-xs text-destructive mt-0.5">{error}</p>}
    </div>
  );
}
