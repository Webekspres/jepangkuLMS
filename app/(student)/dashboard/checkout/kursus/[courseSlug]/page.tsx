import { redirect } from 'next/navigation';
import { startCourseCheckout } from '@/features/checkout/actions/checkout-actions';
import { CheckoutPage } from '@/features/checkout/components/checkout-page';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';

type Props = { params: Promise<{ courseSlug: string }> };

export default async function CourseCheckoutRoute({ params }: Props) {
  const { courseSlug } = await params;
  const data = await startCourseCheckout(courseSlug);

  if (!data.ok) {
    redirect(STUDENT_ROUTES.kursusDetail(courseSlug));
  }

  return (
    <CheckoutPage
      course={data.course}
      methods={data.methods}
      existingPaymentId={data.existingPaymentId}
    />
  );
}
