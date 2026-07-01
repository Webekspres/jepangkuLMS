/**
 * Aturan akses sesi live class (pure — aman dipakai di server loader & client).
 *
 * `meetingUrl` hanya boleh terlihat saat berada dalam jendela:
 *   [scheduledAt - 15 menit, endsAt]
 * Sebelum itu → "upcoming" (Belum Dimulai); sesudah → "ended" (Selesai, pakai recordingUrl).
 */

export type LiveSessionStatus = 'upcoming' | 'live' | 'ended';

/** Menit pratinjau sebelum jadwal mulai saat link meeting sudah boleh dibuka. */
export const LIVE_SESSION_REVEAL_BEFORE_MS = 15 * 60 * 1000;

export function resolveLiveSessionStatus(
  scheduledAt: Date,
  endsAt: Date,
  now: Date = new Date(),
): LiveSessionStatus {
  const t = now.getTime();
  const revealAt = scheduledAt.getTime() - LIVE_SESSION_REVEAL_BEFORE_MS;
  if (t < revealAt) return 'upcoming';
  if (t > endsAt.getTime()) return 'ended';
  return 'live';
}

export function isMeetingUrlVisible(
  scheduledAt: Date,
  endsAt: Date,
  now: Date = new Date(),
): boolean {
  return resolveLiveSessionStatus(scheduledAt, endsAt, now) === 'live';
}
