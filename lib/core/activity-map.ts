/** Map LMS events → Core `activity_types.code`. */

export const LMS_TO_CORE_ACTIVITY = {
  lesson_complete: 'COMPLETED_LESSON',
  quiz_complete: 'COMPLETED_QUIZ',
  flashcard_visit: 'COMPLETED_LESSON',
  tryout_complete: 'COMPLETED_QUIZ',
  badge_unlock: 'COMPLETED_LESSON',
  daily_login: 'DAILY_LOGIN',
} as const;

export type LmsActivityKind = keyof typeof LMS_TO_CORE_ACTIVITY;

export function toCoreActivityType(kind: LmsActivityKind): string {
  return LMS_TO_CORE_ACTIVITY[kind];
}

/** Stable idempotency keys per ECOSYSTEM.md */
export function buildLmsIdempotencyKey(
  kind: LmsActivityKind,
  userId: string,
  ...parts: (string | null | undefined)[]
): string {
  const suffix = parts.filter(Boolean).join(':');
  return suffix ? `lms:${kind}:${suffix}:${userId}` : `lms:${kind}:${userId}`;
}
