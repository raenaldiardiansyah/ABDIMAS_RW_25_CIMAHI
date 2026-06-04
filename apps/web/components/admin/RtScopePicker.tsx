'use client';

import { X } from 'lucide-react';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RT_OPTIONS } from '@/lib/rt-options';

type RtScopePickerProps = {
  helperText?: string;
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
};

export function RtScopePicker({ helperText, label, value, onChange }: RtScopePickerProps) {
  const availableOptions = RT_OPTIONS.filter((rt) => !value.includes(rt));

  function handleAdd(rt: string) {
    if (value.includes(rt)) return;
    onChange([...value, rt]);
  }

  function handleRemove(rt: string) {
    onChange(value.filter((item) => item !== rt));
  }

  return (
    <div className="rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-soft)] p-4">
      <Label className="text-sm font-bold text-[color:var(--admin-heading)]">{label}</Label>
      {helperText ? <p className="mt-1 text-xs text-[color:var(--admin-subtle)]">{helperText}</p> : null}

      <div className="mt-4">
        <Select value="" onValueChange={handleAdd}>
          <SelectTrigger className="rounded-xl border-[color:var(--admin-border)] bg-[color:var(--admin-surface)]">
            <SelectValue placeholder="Tambah RT dari dropdown" />
          </SelectTrigger>
          <SelectContent>
            {availableOptions.length === 0 ? (
              <SelectItem value="__empty" disabled>
                Semua RT sudah dipilih
              </SelectItem>
            ) : (
              availableOptions.map((rt) => (
                <SelectItem key={rt} value={rt}>
                  RT {rt}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {value.length > 0 ? (
          value.map((rt) => (
            <button
              key={rt}
              type="button"
              onClick={() => handleRemove(rt)}
              className="inline-flex items-center gap-2 rounded-full border border-[color:var(--admin-primary-soft-border)] bg-[color:var(--admin-primary-soft)] px-3 py-1.5 text-xs font-semibold text-[color:var(--admin-primary-soft-foreground)]"
            >
              RT {rt}
              <X className="h-3.5 w-3.5" />
            </button>
          ))
        ) : (
          <p className="text-sm text-[color:var(--admin-subtle)]">Belum ada RT dipilih.</p>
        )}
      </div>
    </div>
  );
}
