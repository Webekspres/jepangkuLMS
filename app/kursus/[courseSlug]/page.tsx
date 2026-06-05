import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CourseDetailPage } from '@/features/learning/components/course-detail-page';
import { getAllCourseSlugs, getCourseBySlug } from '@/features/learning/components/course-detail-data';

type PageProps = {
  params: Promise<{ courseSlug: string }>;
};

export async function generateStaticParams() {
  return getAllCourseSlugs().map((courseSlug) => ({ courseSlug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { courseSlug } = await params;
  const course = getCourseBySlug(courseSlug);

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
  const course = getCourseBySlug(courseSlug);

  if (!course) {
    notFound();
  }

  return <CourseDetailPage course={course} />;
}
