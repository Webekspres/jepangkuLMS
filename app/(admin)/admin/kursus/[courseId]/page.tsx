import { redirect } from 'next/navigation';
import { ADMIN_ROUTES } from '@/lib/auth/constants';

export default function CourseRootPage({ params }: { params: { courseId: string } }) {
    redirect(ADMIN_ROUTES.kursusModules(params.courseId));
}
