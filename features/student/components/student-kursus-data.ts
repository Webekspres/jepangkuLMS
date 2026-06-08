import { CATALOG_COURSES } from '@/features/learning/components/courses-data';

export type StudentCourseStatus = 'completed' | 'active' | 'not_started';

/** Enrollment mock — ganti dengan Prisma setelah auth siap */
export type StudentEnrollment = {
  courseSlug: string;
  continueLessonSlug: string;
  progress: number;
  status: StudentCourseStatus;
  lastAccessLabel: string;
};

export const STUDENT_ENROLLMENTS: StudentEnrollment[] = [
  {
    courseSlug: 'jlpt-n5-kursus-lengkap',
    continueLessonSlug: 'hiragana-pengenalan',
    progress: 100,
    status: 'completed',
    lastAccessLabel: '2 hari lalu',
  },
  {
    courseSlug: 'kosakata-n4-1500-kata',
    continueLessonSlug: 'kosakata-sehari-hari',
    progress: 77,
    status: 'active',
    lastAccessLabel: 'Hari ini',
  },
  {
    courseSlug: 'n4-tata-bahasa-intensif',
    continueLessonSlug: 'te-form-dasar',
    progress: 30,
    status: 'active',
    lastAccessLabel: 'Kemarin',
  },
];

const enrollmentBySlug = Object.fromEntries(
  STUDENT_ENROLLMENTS.map((entry) => [entry.courseSlug, entry]),
);

export function getStudentEnrollment(courseSlug: string) {
  return enrollmentBySlug[courseSlug];
}

export const STUDENT_ENROLLED_COURSES = STUDENT_ENROLLMENTS.map((enrollment) => {
  const course = CATALOG_COURSES.find((c) => c.slug === enrollment.courseSlug);
  if (!course) return null;
  return { course, enrollment };
}).filter((entry): entry is NonNullable<typeof entry> => entry != null);

export const STUDENT_KURSU_STATS = {
  enrolled: STUDENT_ENROLLMENTS.length,
  active: STUDENT_ENROLLMENTS.filter((e) => e.status === 'active').length,
  completed: STUDENT_ENROLLMENTS.filter((e) => e.status === 'completed').length,
};
