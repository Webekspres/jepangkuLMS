const JAKARTA_TZ = 'Asia/Jakarta';

/** Calendar date in Asia/Jakarta as `YYYY-MM-DD`. */
export function getJakartaDateKey(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: JAKARTA_TZ }).format(now);
}

/** Start/end of the current calendar day in Asia/Jakarta. */
export function getJakartaDayBounds(now = new Date()): { start: Date; end: Date } {
  const key = getJakartaDateKey(now);
  const start = new Date(`${key}T00:00:00+07:00`);
  const end = new Date(`${key}T23:59:59.999+07:00`);
  return { start, end };
}

export function isWithinJakartaDay(date: Date, now = new Date()): boolean {
  const { start, end } = getJakartaDayBounds(now);
  return date >= start && date <= end;
}
