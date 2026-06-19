import { notFound } from 'next/navigation';
import { AdminLessonsPage } from '@/features/admin-cms/components/admin-lessons-page';
import { loadAdminModuleById } from '@/features/admin-cms/lib/load-admin-cms-data';
import { uuidSchema } from '@/lib/validations/shared';

type AdminLessonListPageProps = {
  params: Promise<{ courseId: string; moduleId: string }>;
};

export default async function AdminLessonListPage({ params }: AdminLessonListPageProps) {
  const { courseId, moduleId } = await params;
  const parsedCourseId = uuidSchema.safeParse(courseId);
  const parsedModuleId = uuidSchema.safeParse(moduleId);
  if (!parsedCourseId.success || !parsedModuleId.success) notFound();

  const moduleRow = await loadAdminModuleById(parsedCourseId.data, parsedModuleId.data);
  if (!moduleRow) notFound();

  return (
    <AdminLessonsPage
      course={{
        id: moduleRow.course.id,
        title: moduleRow.course.title,
        slug: moduleRow.course.slug,
      }}
      module={{
        id: moduleRow.id,
        title: moduleRow.title,
        slug: moduleRow.slug,
        order: moduleRow.order,
      }}
      lessons={moduleRow.lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        slug: lesson.slug,
        order: lesson.order,
        videoUrl: lesson.videoUrl,
        materialCount:
          lesson._count.kanjis + lesson._count.kosakatas + lesson._count.tataBahasas,
        quizCount: lesson._count.questions,
      }))}
    />
  );
}
