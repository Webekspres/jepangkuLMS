/**
 * Query key factory — hindari string magic di useQuery / prefetchQuery.
 * Tambah key per domain saat fitur client-fetch dibuat.
 */
export const queryKeys = {
  gamification: {
    all: ['gamification'] as const,
    leaderboard: () => [...queryKeys.gamification.all, 'leaderboard'] as const,
    profile: (userId: string) => [...queryKeys.gamification.all, 'profile', userId] as const,
  },
  learning: {
    all: ['learning'] as const,
    courses: () => [...queryKeys.learning.all, 'courses'] as const,
    course: (courseSlug: string) => [...queryKeys.learning.all, 'course', courseSlug] as const,
    lesson: (courseSlug: string, lessonSlug: string) =>
      [...queryKeys.learning.all, 'lesson', courseSlug, lessonSlug] as const,
  },
  quiz: {
    all: ['quiz'] as const,
    session: (lessonSlug: string) => [...queryKeys.quiz.all, 'session', lessonSlug] as const,
  },
  admin: {
    all: ['admin'] as const,
    dashboard: () => [...queryKeys.admin.all, 'dashboard'] as const,
    payments: () => [...queryKeys.admin.all, 'payments'] as const,
  },
} as const;
