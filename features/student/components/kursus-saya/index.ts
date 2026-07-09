export { EnrolledCourseCard } from './enrolled-course-row-card';
export { KursusSayaExploreCta } from './kursus-saya-explore-cta';

export type KursusSayaTab = 'semua' | 'berjalan' | 'selesai';

export const KURSUS_SAYA_TABS: { value: KursusSayaTab; label: string }[] = [
  { value: 'semua', label: 'Semua Kursus' },
  { value: 'berjalan', label: 'Sedang Berjalan' },
  { value: 'selesai', label: 'Selesai' },
];

export function isEnrolledCourseCompleted(
  status: 'completed' | 'active' | 'not_started',
  progress: number,
) {
  return status === 'completed' || progress >= 100;
}
