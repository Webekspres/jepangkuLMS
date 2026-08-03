const JAKARTA_TZ = 'Asia/Jakarta';

export { JAKARTA_TZ };

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

/** Previous calendar day in Asia/Jakarta as `YYYY-MM-DD`. */
export function getPreviousJakartaDateKey(dateKey: string): string {
  const date = new Date(`${dateKey}T12:00:00+07:00`);
  date.setDate(date.getDate() - 1);
  return getJakartaDateKey(date);
}

/** Next calendar day in Asia/Jakarta as `YYYY-MM-DD`. */
export function getNextJakartaDateKey(dateKey: string): string {
  const date = new Date(`${dateKey}T12:00:00+07:00`);
  date.setDate(date.getDate() + 1);
  return getJakartaDateKey(date);
}

/** Long date for Live Class schedule cards — always Asia/Jakarta. */
export function formatJakartaDateLong(date: Date): string {
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: JAKARTA_TZ,
  });
}

/** Clock time in Asia/Jakarta (locale digit style). */
export function formatJakartaTime(date: Date): string {
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: JAKARTA_TZ,
  });
}

/** `HH.mm – HH.mm WIB` in Asia/Jakarta. */
export function formatJakartaTimeRange(start: Date, end: Date): string {
  return `${formatJakartaTime(start)} – ${formatJakartaTime(end)} WIB`;
}
