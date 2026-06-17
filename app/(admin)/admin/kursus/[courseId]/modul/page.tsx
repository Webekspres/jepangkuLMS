import { notFound } from 'next/navigation';
import { AdminModulesPage } from '@/features/admin-cms/components/admin-modules-page';
import { loadAdminCourseById } from '@/features/admin-cms/lib/load-admin-cms-data';
import { uuidSchema } from '@/lib/validations/shared';

type AdminModulPageProps = {
  params: Promise<{ courseId: string }>;
};

export default async function AdminModulPage({ params }: AdminModulPageProps) {
  const { courseId } = await params;
  const parsedId = uuidSchema.safeParse(courseId);
  if (!parsedId.success) notFound();

  const course = await loadAdminCourseById(parsedId.data);
  if (!course) notFound();

  return (
    <AdminModulesPage
      course={{
        id: course.id,
        title: course.title,
        slug: course.slug,
        level: course.level,
        isPublished: course.isPublished,
      }}
      modules={course.modules.map((mod) => ({
        id: mod.id,
        title: mod.title,
        slug: mod.slug,
        order: mod.order,
        description: mod.description,
        lessonCount: mod._count.lessons,
      }))}
    />
  );
}
