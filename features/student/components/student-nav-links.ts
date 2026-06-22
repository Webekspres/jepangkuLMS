import { STUDENT_ROUTES } from './student-routes';

/** Navigasi utama area siswa */
export const STUDENT_NAV_LINKS = [
  { href: STUDENT_ROUTES.home, label: 'Beranda' },
  { href: STUDENT_ROUTES.kursus, label: 'Kursus' },
  { href: STUDENT_ROUTES.liveClass, label: 'Live Class' },
  { href: STUDENT_ROUTES.leaderboard, label: 'Leaderboard' },
  { href: STUDENT_ROUTES.tryout, label: 'Tryout JLPT' },
] as const;

export const STUDENT_PROFILE_LINKS = [
  { href: STUDENT_ROUTES.profil, label: 'Profil & XP' },
  { href: '/sign-in', label: 'Keluar' },
] as const;
