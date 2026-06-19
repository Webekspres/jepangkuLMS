import { notFound } from 'next/navigation';
import { AdminModuleForm } from '@/features/admin-cms/components/admin-module-form';
import {
  getNextModuleOrder,
  loadAdminCourseById,
  loadAdminModuleById,
} from '@/features/admin-cms/lib/load-admin-cms-data';
import { uuidSchema } from '@/lib/validations/shared';

type AdminModulFormPageProps = {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ id?: string }>;
};

export default async function AdminModulFormPage({ params, searchParams }: AdminModulFormPageProps) {
  const { courseId } = await params;
  const { id } = await searchParams;

  const parsedCourseId = uuidSchema.safeParse(courseId);
  if (!parsedCourseId.success) notFound();

  const course = await loadAdminCourseById(parsedCourseId.data);
  if (!course) notFound();

  if (!id) {
    const nextOrder = await getNextModuleOrder(course.id);
    return (
      <AdminModuleForm
        mode="create"
        courseId={course.id}
        courseTitle={course.title}
        initial={{ title: '', slug: '', description: '', order: nextOrder }}
      />
    );
  }

  const parsedModuleId = uuidSchema.safeParse(id);
  if (!parsedModuleId.success) notFound();

  const moduleRow = await loadAdminModuleById(course.id, parsedModuleId.data);
  if (!moduleRow) notFound();

  return (
    <AdminModuleForm
      mode="edit"
      courseId={course.id}
      courseTitle={course.title}
      moduleId={moduleRow.id}
      initial={{
        title: moduleRow.title,
        slug: moduleRow.slug,
        description: moduleRow.description ?? '',
        order: moduleRow.order,
      }}
    />
  );
}
