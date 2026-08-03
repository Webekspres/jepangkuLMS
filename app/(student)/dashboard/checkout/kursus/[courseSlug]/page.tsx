import { redirect } from 'next/navigation';
import { startCheckout } from '@/features/checkout/actions/checkout-actions';
import { CheckoutPage } from '@/features/checkout/components/checkout-page';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';

type Props = { params: Promise<{ courseSlug: string }> };

export default async function CourseCheckoutRoute({ params }: Props) {
  const { courseSlug } = await params;
  const data = await startCheckout({ productType: 'COURSE', productKey: courseSlug });

  if (!data.ok) {
    redirect(STUDENT_ROUTES.kursusDetail(courseSlug));
  }

  return (
    <CheckoutPage
      product={data.product}
      methods={data.methods}
      existingPaymentId={data.existingPaymentId}
    />
  );
}
