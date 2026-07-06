import type { LucideIcon } from 'lucide-react';
import { BookOpen, Target, Trophy, User } from 'lucide-react';
import { STUDENT_ROUTES } from './student-routes';

export type StudentAccountMenuItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

/** Menu akun siswa — dipakai dropdown desktop & drawer mobile (sumber tunggal). */
export const STUDENT_ACCOUNT_MENU_ITEMS: StudentAccountMenuItem[] = [
  { href: STUDENT_ROUTES.profil, label: 'Profil Saya', icon: User },
  { href: STUDENT_ROUTES.kursus, label: 'Kursus Saya', icon: BookOpen },
  { href: STUDENT_ROUTES.tryout, label: 'JLPT Try Out', icon: Target },
  { href: STUDENT_ROUTES.achievements, label: 'Pencapaian', icon: Trophy },
];
