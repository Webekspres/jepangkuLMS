/** Path area siswa — prefix `/dashboard` agar tidak bentrok dengan marketing publik */
export const STUDENT_ROUTES = {
  home: '/dashboard',
  kursus: '/dashboard/kursus',
  kursusSaya: '/dashboard/kursus-saya',
  kursusDetail: (courseSlug: string) => `/dashboard/kursus/${courseSlug}`,
  kana: '/dashboard/kana',
  kanaScript: (script: 'hiragana' | 'katakana') => `/dashboard/kana/${script}`,
  leaderboard: '/dashboard/leaderboard',
  tryout: '/dashboard/tryout',
  tryoutExam: (sessionCode: string) =>
    `/dashboard/tryout/${encodeURIComponent(sessionCode)}`,
  tryoutResult: (attemptId: string) => `/dashboard/tryout/hasil/${encodeURIComponent(attemptId)}`,
  tryoutHistory: '/dashboard/tryout/riwayat',
  placement: '/dashboard/tes-penempatan',
  placementExam: '/dashboard/tes-penempatan/ujian',
  placementResult: (attemptId: string) =>
    `/dashboard/tes-penempatan/hasil/${encodeURIComponent(attemptId)}`,
  liveClass: '/dashboard/live-class',
  profil: '/dashboard/profil',
  achievements: '/dashboard/achievements',
  belajar: (courseSlug: string, lessonSlug: string) =>
    `/dashboard/belajar/${courseSlug}/${lessonSlug}`,
  kuis: (lessonSlug: string) => `/dashboard/kuis/${lessonSlug}`,
  kuisHasil: (lessonSlug: string) => `/dashboard/kuis/${lessonSlug}/hasil`,
} as const;
