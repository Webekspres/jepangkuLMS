/** Path area siswa — prefix `/dashboard` agar tidak bentrok dengan marketing publik */
export const STUDENT_ROUTES = {
  home: '/dashboard',
  kursus: '/dashboard/kursus',
  leaderboard: '/dashboard/leaderboard',
  tryout: '/dashboard/tryout',
  profil: '/dashboard/profil',
  belajar: (courseSlug: string, lessonSlug: string) =>
    `/dashboard/belajar/${courseSlug}/${lessonSlug}`,
  kuis: (lessonSlug: string) => `/dashboard/kuis/${lessonSlug}`,
  kuisHasil: (lessonSlug: string) => `/dashboard/kuis/${lessonSlug}/hasil`,
} as const;
