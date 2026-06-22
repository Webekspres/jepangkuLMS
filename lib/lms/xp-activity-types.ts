/** Client-safe types & formatters for XP activity — no Prisma/pg. */

export type XpActivityRow = {
  id: string;
  label: string;
  xpGained: number;
  createdAt: Date;
};

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'Baru saja';
  if (diffMin < 60) return `${diffMin} mnt lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return 'Kemarin';
  if (diffDay < 7) return `${diffDay} hari lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

export function formatXpActivityTime(date: Date | string): string {
  return formatRelativeTime(new Date(date));
}
