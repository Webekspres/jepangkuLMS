import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { StudentCourseDetailPage } from '@/features/student/components/student-course-detail-page';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';
import { loadStudentCourseDetail } from '@/features/student/lib/load-student-course-detail';
import { getPaymentSettings } from '@/lib/payment/settings';

interface CourseDetailRouteProps {
  params: Promise<{ courseSlug: string }>;
}

export default async function DashboardCourseDetailRoute({ params }: CourseDetailRouteProps) {
  const { courseSlug } = await params;
  const data = await loadStudentCourseDetail(courseSlug);
  const paymentSettings = getPaymentSettings();

  if (!data) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <h1 className="text-xl font-bold text-foreground">Kursus tidak ditemukan</h1>
        <Button asChild className="mt-6">
          <Link href={STUDENT_ROUTES.kursus}>Ke kursus saya</Link>
        </Button>
      </div>
    );
  }

  if (!data.isEnrolled && !data.course.isPublished) {
    redirect(STUDENT_ROUTES.kursus);
  }

  return (
    <StudentCourseDetailPage
      course={{
        slug: data.course.slug,
        title: data.course.title,
        level: data.course.level,
        desc: data.course.desc,
        thumb: data.course.thumb,
        accent: data.course.accent,
        lessonCount: data.course.lessonCount,
        isPublished: data.course.isPublished,
        modules: data.course.modules,
        lessons: data.course.lessons,
      }}
      whatYouLearn={data.whatYouLearn}
      duration={data.duration}
      tags={data.tags}
      priceIdr={data.priceIdr}
      studentDisplayName={data.studentDisplayName}
      enrollmentStatus={data.enrollmentStatus}
      isEnrolled={data.isEnrolled}
      progressPercent={data.progress.percent}
      continueLessonSlug={data.progress.continueLessonSlug}
      paymentSettings={paymentSettings}
    />
  );
}
