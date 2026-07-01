import type { EnrollmentStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type TryoutEnrollmentGate =
  | { ok: true; status: EnrollmentStatus }
  | { ok: false; status: 'none' | EnrollmentStatus; message: string };

/** Resolve enrollment for a tryout session (none if no row). */
export async function getTryoutEnrollmentStatus(
  userId: string,
  tryoutSessionId: string,
): Promise<'none' | EnrollmentStatus> {
  const row = await prisma.enrollment.findUnique({
    where: { userId_tryoutSessionId: { userId, tryoutSessionId } },
    select: { status: true },
  });
  return row?.status ?? 'none';
}

/**
 * Gate tryout access by enrollment + price.
 * Free sessions (priceIdr = 0) auto-activate ACTIVE enrollment.
 */
export async function ensureTryoutEnrollmentAccess(
  userId: string,
  session: { id: string; priceIdr: number; title: string },
): Promise<TryoutEnrollmentGate> {
  const existing = await prisma.enrollment.findUnique({
    where: { userId_tryoutSessionId: { userId, tryoutSessionId: session.id } },
  });

  if (existing?.status === 'ACTIVE') {
    return { ok: true, status: 'ACTIVE' };
  }

  if (session.priceIdr <= 0) {
    const enrollment = await prisma.enrollment.upsert({
      where: { userId_tryoutSessionId: { userId, tryoutSessionId: session.id } },
      create: {
        userId,
        tryoutSessionId: session.id,
        type: 'TRYOUT',
        status: 'ACTIVE',
      },
      update: { status: 'ACTIVE', type: 'TRYOUT' },
    });
    return { ok: true, status: enrollment.status };
  }

  if (existing?.status === 'PENDING') {
    return {
      ok: false,
      status: 'PENDING',
      message:
        'Pembayaran tryout menunggu verifikasi admin. Setelah dikonfirmasi, kamu bisa masuk ujian.',
    };
  }

  return {
    ok: false,
    status: 'none',
    message: `Tryout "${session.title}" berbayar. Daftar dan selesaikan pembayaran terlebih dahulu.`,
  };
}
