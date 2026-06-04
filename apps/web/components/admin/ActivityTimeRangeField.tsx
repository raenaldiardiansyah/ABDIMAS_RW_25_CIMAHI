'use client';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TIME_SLOT_VALUES, formatActivityTimeRange } from '@/lib/activity-time';

type ActivityTimeRangeFieldProps = {
  endTime: string;
  error?: string | null;
  onEndTimeChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  startTime: string;
};

export function ActivityTimeRangeField({
  endTime,
  error,
  onEndTimeChange,
  onStartTimeChange,
  startTime,
}: ActivityTimeRangeFieldProps) {
  return (
    <div>
      <Label className="mb-1 block text-sm font-semibold text-[color:var(--admin-heading)]">Waktu (Jam)</Label>
      <div className="grid grid-cols-2 gap-3">
        <Select value={startTime} onValueChange={onStartTimeChange}>
          <SelectTrigger
            aria-label="Pilih jam mulai"
            className="w-full rounded-xl border-[color:var(--admin-border)] bg-[color:var(--admin-surface-muted)] px-4 py-2.5 text-sm"
          >
            <SelectValue placeholder="Jam mulai" />
          </SelectTrigger>
          <SelectContent>
            {TIME_SLOT_VALUES.map((slot) => (
              <SelectItem key={`start-${slot}`} value={slot}>
                {slot.replace(':', '.')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={endTime} onValueChange={onEndTimeChange}>
          <SelectTrigger
            aria-label="Pilih jam selesai"
            className="w-full rounded-xl border-[color:var(--admin-border)] bg-[color:var(--admin-surface-muted)] px-4 py-2.5 text-sm"
          >
            <SelectValue placeholder="Jam selesai" />
          </SelectTrigger>
          <SelectContent>
            {TIME_SLOT_VALUES.map((slot) => (
              <SelectItem key={`end-${slot}`} value={slot}>
                {slot.replace(':', '.')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="mt-2 text-xs text-[color:var(--admin-subtle)]">{formatActivityTimeRange(startTime, endTime)}</p>
      {error ? <p className="mt-1 text-xs font-medium text-red-500">{error}</p> : null}
    </div>
  );
}
