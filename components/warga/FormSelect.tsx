'use client';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface FormSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  error?: string;
}

export default function FormSelect({ label, value, onChange, options, placeholder = 'Pilih...', error }: FormSelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-semibold text-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className={cn('h-11 rounded-xl bg-muted/40', error && 'border-destructive focus-visible:ring-destructive/50')}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
        ))}
        </SelectContent>
      </Select>
      {error && <p className="text-xs text-destructive mt-0.5">{error}</p>}
    </div>
  );
}
