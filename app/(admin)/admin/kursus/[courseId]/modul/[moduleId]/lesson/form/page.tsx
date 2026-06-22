import { notFound } from 'next/navigation';
import { AdminLessonForm } from '@/features/admin-cms/components/admin-lesson-form';
import { AdminLessonWorkspace } from '@/features/admin-cms/components/admin-lesson-workspace';
import { formatModuleDisplayTitle } from '@/features/admin-cms/lib/curriculum-display';
import { loadAdminModuleById } from '@/features/admin-cms/lib/load-admin-cms-data';
import { loadAdminLessonContent } from '@/features/admin-cms/lib/load-admin-lesson-content';
import { uuidSchema } from '@/lib/validations/shared';

type AdminLessonFormPageProps = {
  params: Promise<{ courseId: string; moduleId: string }>;
  searchParams: Promise<{ id?: string; tab?: string }>;
};

export default async function AdminLessonFormPage({ params, searchParams }: AdminLessonFormPageProps) {
  const { courseId, moduleId } = await params;
  const { id } = await searchParams;

  const parsedCourseId = uuidSchema.safeParse(courseId);
  const parsedModuleId = uuidSchema.safeParse(moduleId);
  if (!parsedCourseId.success || !parsedModuleId.success) notFound();

  const moduleRow = await loadAdminModuleById(parsedCourseId.data, parsedModuleId.data);
  if (!moduleRow) notFound();

  if (!id) {
    return (
      <AdminLessonForm
        mode="create"
        courseId={moduleRow.course.id}
        moduleId={moduleRow.id}
        moduleTitle={formatModuleDisplayTitle(moduleRow.order, moduleRow.title)}
      />
    );
  }

  const parsedLessonId = uuidSchema.safeParse(id);
  if (!parsedLessonId.success) notFound();

  const content = await loadAdminLessonContent(
    parsedCourseId.data,
    parsedModuleId.data,
    parsedLessonId.data,
  );
  if (!content) notFound();

  return (
    <AdminLessonWorkspace
      scope={{
        courseId: moduleRow.course.id,
        moduleId: moduleRow.id,
        lessonId: content.lesson.id,
      }}
      courseSlug={moduleRow.course.slug}
      moduleTitle={formatModuleDisplayTitle(moduleRow.order, moduleRow.title)}
      content={content}
    />
  );
}
