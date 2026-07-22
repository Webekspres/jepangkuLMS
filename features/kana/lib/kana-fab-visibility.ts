import { STUDENT_ROUTES } from '@/features/student/components/student-routes';

/** Exact hub paths — same hierarchy as Beranda / Program lists. */
const EXACT_HUB_PATHS = new Set<string>([
  STUDENT_ROUTES.home,
  STUDENT_ROUTES.kursus,
  STUDENT_ROUTES.kursusSaya,
  STUDENT_ROUTES.liveClass,
  STUDENT_ROUTES.tryout,
  STUDENT_ROUTES.tryoutHistory,
  STUDENT_ROUTES.leaderboard,
  STUDENT_ROUTES.achievements,
  STUDENT_ROUTES.profil,
  `${STUDENT_ROUTES.profil}/edit`,
]);

/**
 * Whether the kana floating launcher should render on this student pathname.
 * Allowlist of dashboard hubs only — hidden on belajar, kuis, course detail, tryout exam, etc.
 */
export function shouldShowKanaFab(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, '') || '/';

  if (EXACT_HUB_PATHS.has(path)) return true;

  if (path === STUDENT_ROUTES.kana || path.startsWith(`${STUDENT_ROUTES.kana}/`)) {
    return true;
  }

  return false;
}
