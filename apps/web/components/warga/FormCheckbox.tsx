'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

interface CheckboxOption {
  value: string;
  label: string;
}

interface FormCheckboxProps {
  label: string;
  options: CheckboxOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  error?: string;
  singleSelect?: boolean;
}

export default function FormCheckbox({ label, options, selected, onChange, error, singleSelect }: FormCheckboxProps) {
  const toggle = (value: string) => {
    if (singleSelect) {
      if (selected.includes(value)) {
        onChange([]);
      } else {
        onChange([value]);
      }
    } else {
      if (selected.includes(value)) {
        onChange(selected.filter((v) => v !== value));
      } else {
        onChange([...selected, value]);
      }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-sm font-semibold text-foreground">{label}</Label>
      {singleSelect ? (
        <RadioGroup value={selected[0]} onValueChange={(value) => onChange(value ? [value] : [])} className="gap-2">
          {options.map((opt) => {
            const isSelected = selected.includes(opt.value);

            return (
              <label
                key={opt.value}
                className={cn(
                  "flex items-center gap-3 overflow-hidden px-4 py-3 rounded-2xl border text-sm transition-colors duration-200 text-left cursor-pointer",
                  isSelected
                    ? "bg-primary border-primary/30 text-primary-foreground"
                    : "bg-muted/40 border-border text-foreground hover:bg-muted/55",
                )}
              >
                <RadioGroupItem
                  value={opt.value}
                  className={cn(
                    isSelected ? "border-primary-foreground/60 text-primary-foreground" : undefined,
                  )}
                />
                <span className="font-medium">{opt.label}</span>
              </label>
            );
          })}
        </RadioGroup>
      ) : (
        <div className="flex flex-col gap-2">
          {options.map((opt) => {
            const isSelected = selected.includes(opt.value);

            return (
              <Button
                key={opt.value}
                type="button"
                onClick={() => toggle(opt.value)}
                variant="outline"
                className={cn(
                  "h-auto flex items-center justify-start gap-3 overflow-hidden px-4 py-3 rounded-2xl border text-sm transition-colors duration-200 text-left",
                  isSelected
                    ? "bg-primary border-primary/30 text-primary-foreground hover:bg-primary"
                    : "bg-muted/40 border-border text-foreground hover:bg-muted/55",
                )}
              >
                <Checkbox
                  checked={isSelected}
                  className={cn(
                    "h-5 w-5 rounded-md",
                    isSelected
                      ? "border-primary-foreground/50 data-[state=checked]:bg-primary-foreground data-[state=checked]:text-primary"
                      : "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
                  )}
                />
                <span className="font-medium">{opt.label}</span>
              </Button>
            );
          })}
        </div>
      )}
      {error && <p className="text-xs text-destructive mt-0.5">{error}</p>}
    </div>
  );
}
