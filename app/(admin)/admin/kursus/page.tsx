import { AdminCoursesPage } from '@/features/admin-cms/components/admin-courses-page';
import { loadAdminCourses } from '@/features/admin-cms/lib/load-admin-cms-data';

export default async function AdminKursusPage() {
  const courses = await loadAdminCourses();
  return <AdminCoursesPage courses={courses} />;
}
