import type { Metadata } from 'next';
import { auth } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';
import { CourseDetailPage } from '@/features/learning/components/course-detail-page';
import { loadMarketingCourseDetail } from '@/features/learning/lib/load-marketing-courses';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';
import { getPaymentSettings } from '@/lib/payment/settings';

type PageProps = {
  params: Promise<{ courseSlug: string }>;
};

/** Render at request time — `next build` (CI/Docker) has no PostgreSQL. Data cached via unstable_cache. */
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { courseSlug } = await params;
  const course = await loadMarketingCourseDetail(courseSlug);

  if (!course) {
    return { title: 'Kursus tidak ditemukan — JepangKu LMS' };
  }

  return {
    title: `${course.title} — JepangKu LMS`,
    description: course.desc,
  };
}

export default async function KursusDetailRoute({ params }: PageProps) {
  const { courseSlug } = await params;
  const { userId } = await auth();

  if (userId) {
    redirect(STUDENT_ROUTES.kursusDetail(courseSlug));
  }

  const course = await loadMarketingCourseDetail(courseSlug);

  if (!course) {
    notFound();
  }

  const paymentSettings = getPaymentSettings();

  return <CourseDetailPage course={course} paymentSettings={paymentSettings} />;
}
