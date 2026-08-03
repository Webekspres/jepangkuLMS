import type { EnrollmentLogAction } from '@prisma/client';

export const ENROLLMENT_LOG_ACTION_LABEL: Record<EnrollmentLogAction, string> = {
  REQUESTED: 'Diajukan',
  APPROVED: 'Disetujui',
  REJECTED: 'Ditolak',
  GRANTED: 'Diberikan manual',
  REVOKED: 'Akses dicabut',
  PAYMENT_SETTLED: 'Dibayar otomatis',
};

export const ENROLLMENT_LOG_ACTION_BADGE: Record<EnrollmentLogAction, string> = {
  REQUESTED: 'bg-muted text-muted-foreground',
  APPROVED: 'bg-emerald-500/10 text-emerald-700 ',
  REJECTED: 'bg-destructive/10 text-destructive',
  GRANTED: 'bg-blue-500/10 text-blue-600 ',
  REVOKED: 'bg-destructive/10 text-destructive',
  PAYMENT_SETTLED: 'bg-emerald-500/15 text-emerald-800 ',
};
