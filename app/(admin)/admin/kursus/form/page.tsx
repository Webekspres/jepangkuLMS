import { notFound } from 'next/navigation';
import { AdminCourseForm } from '@/features/admin-cms/components/admin-course-form';
import { loadAdminCourseById } from '@/features/admin-cms/lib/load-admin-cms-data';
import { uuidSchema } from '@/lib/validations/shared';

type AdminKursusFormPageProps = {
  searchParams: Promise<{ id?: string }>;
};

export default async function AdminKursusFormPage({ searchParams }: AdminKursusFormPageProps) {
  const { id } = await searchParams;

  if (!id) {
    return <AdminCourseForm mode="create" />;
  }

  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) notFound();

  const course = await loadAdminCourseById(parsedId.data);
  if (!course) notFound();

  return (
    <AdminCourseForm
      mode="edit"
      courseId={course.id}
      initial={{
        title: course.title,
        slug: course.slug,
        description: course.description ?? '',
        outcomes: course.outcomes,
        level: course.level,
        priceIdr: course.priceIdr,
        isPublished: course.isPublished,
      }}
    />
  );
}
