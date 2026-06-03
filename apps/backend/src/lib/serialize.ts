type DateLike = Date | string | null | undefined;

export function toIso(value: DateLike) {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.toISOString();
}
