export const TIME_SLOT_VALUES = Array.from({ length: 48 }, (_, index) => {
  const hour = String(Math.floor(index / 2)).padStart(2, '0');
  const minute = index % 2 === 0 ? '00' : '30';
  return `${hour}:${minute}`;
});

const TIME_VALUE_REGEX = /^([01]\d|2[0-3]):(00|30)$/;

export function isValidTimeSlot(value: string | null | undefined): value is string {
  return typeof value === 'string' && TIME_VALUE_REGEX.test(value);
}

export function isValidTimeRange(startTime: string | null | undefined, endTime: string | null | undefined) {
  return isValidTimeSlot(startTime) && isValidTimeSlot(endTime) && startTime < endTime;
}

export function formatTimeLabel(value: string | null | undefined) {
  if (!isValidTimeSlot(value)) return '-';
  return value.replace(':', '.');
}

export function formatActivityTimeRange(startTime: string | null | undefined, endTime: string | null | undefined) {
  if (isValidTimeRange(startTime, endTime)) {
    return `${formatTimeLabel(startTime)} - ${formatTimeLabel(endTime)} WIB`;
  }

  if (isValidTimeSlot(startTime)) {
    return `${formatTimeLabel(startTime)} WIB`;
  }

  if (isValidTimeSlot(endTime)) {
    return `${formatTimeLabel(endTime)} WIB`;
  }

  return '-';
}
