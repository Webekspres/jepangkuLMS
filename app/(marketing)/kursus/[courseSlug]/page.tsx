import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CourseDetailPage } from '@/features/learning/components/course-detail-page';
import { loadMarketingCourseDetail } from '@/features/learning/lib/load-marketing-courses';

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
  const course = await loadMarketingCourseDetail(courseSlug);

  if (!course) {
    notFound();
  }

  return <CourseDetailPage course={course} />;
}
