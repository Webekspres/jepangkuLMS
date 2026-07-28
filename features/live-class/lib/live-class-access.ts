export const LIVE_CLASS_ENROLLMENT_CUTOFF_DAYS = 1;

export function getLiveClassEnrollmentCutoff(firstSessionAt: Date): Date {
  return new Date(
    firstSessionAt.getTime() - LIVE_CLASS_ENROLLMENT_CUTOFF_DAYS * 24 * 60 * 60 * 1000,
  );
}

export function isLiveClassEnrollmentClosed(
  firstSessionAt: Date | null | undefined,
  now: Date,
): boolean {
  if (!firstSessionAt) return false;
  return now.getTime() >= getLiveClassEnrollmentCutoff(firstSessionAt).getTime();
}
