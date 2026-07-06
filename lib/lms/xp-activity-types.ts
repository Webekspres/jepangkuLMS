/** Client-safe types & formatters for XP activity — no Prisma/pg. */

export type XpActivityRow = {
  id: string;
  label: string;
  xpGained: number;
  createdAt: Date;
};

const JAKARTA_TZ = 'Asia/Jakarta';

/** Deterministic timestamp for SSR — avoids `Date.now()` hydration drift. */
export function formatStableActivityTime(date: Date | string): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: JAKARTA_TZ,
  }).format(d);
}

function formatRelativeTime(date: Date, nowMs: number): string {
  const diffMs = nowMs - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'Baru saja';
  if (diffMin < 60) return `${diffMin} mnt lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return 'Kemarin';
  if (diffDay < 7) return `${diffDay} hari lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', timeZone: JAKARTA_TZ });
}

export function formatXpActivityTime(date: Date | string, nowMs: number = Date.now()): string {
  return formatRelativeTime(new Date(date), nowMs);
}
