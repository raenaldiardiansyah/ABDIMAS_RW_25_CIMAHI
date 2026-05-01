'use client';

import { type InputHTMLAttributes } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export default function FormInput({ label, error, hint, className = '', ...props }: FormInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-semibold text-foreground">{label}</Label>
      <Input className={cn('h-11 rounded-xl bg-muted/40', error && 'border-destructive focus-visible:ring-destructive/50', className)} {...props} />
      {error && <p className="text-xs text-destructive mt-0.5">{error}</p>}
      {hint && !error && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  );
}
