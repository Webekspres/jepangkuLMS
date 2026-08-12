import type { Prisma } from '@prisma/client';

/**
 * Enrollment rows that belong in admin Antrian / sidebar badge.
 * Midtrans checkout only — not every `Enrollment.status = PENDING`
 * (expired/canceled/failed payment leftovers stay PENDING in DB but are not actionable queue).
 */
export const adminEnrollmentQueueWhere = {
  status: 'PENDING',
  payment: {
    is: {
      provider: 'MIDTRANS',
      status: { in: ['PENDING', 'CHALLENGE'] },
    },
  },
} satisfies Prisma.EnrollmentWhereInput;
