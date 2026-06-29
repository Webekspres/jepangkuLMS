/**
 * Gerbang akses tryout (pure — aman dipakai di server action & client).
 *
 * - `isStrictTimeBound = true`  → hanya boleh dikerjakan saat waktu kini berada
 *   dalam [scheduledAt, scheduledAt + timeLimitMinutes].
 * - `isStrictTimeBound = false` → open practice: boleh kapan saja (timer tetap
 *   berjalan saat siswa menekan mulai, di-handle workspace ujian).
 */

export type TryoutAccessReason = 'NOT_SCHEDULED' | 'NOT_STARTED' | 'ENDED';

export type TryoutAccessResult =
  | { ok: true }
  | { ok: false; reason: TryoutAccessReason; message: string };

export function evaluateTryoutAccess(params: {
  isStrictTimeBound: boolean;
  scheduledAt: Date | null;
  timeLimitMinutes: number;
  now?: Date;
}): TryoutAccessResult {
  // Open practice — selalu boleh untuk siswa terdaftar.
  if (!params.isStrictTimeBound) return { ok: true };

  if (!params.scheduledAt || Number.isNaN(params.scheduledAt.getTime())) {
    return {
      ok: false,
      reason: 'NOT_SCHEDULED',
      message: 'Jadwal tryout belum ditentukan.',
    };
  }

  const now = (params.now ?? new Date()).getTime();
  const start = params.scheduledAt.getTime();
  const end = start + params.timeLimitMinutes * 60_000;

  if (now < start) {
    return {
      ok: false,
      reason: 'NOT_STARTED',
      message: 'Tryout belum dibuka. Silakan kembali sesuai jadwal.',
    };
  }
  if (now > end) {
    return {
      ok: false,
      reason: 'ENDED',
      message: 'Jendela waktu tryout sudah berakhir.',
    };
  }
  return { ok: true };
}
