import { redirect } from 'next/navigation';
import { startCheckout } from '@/features/checkout/actions/checkout-actions';
import { CheckoutPage } from '@/features/checkout/components/checkout-page';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';

type Props = { params: Promise<{ sessionCode: string }> };

export default async function TryoutCheckoutRoute({ params }: Props) {
  const { sessionCode } = await params;
  const decoded = decodeURIComponent(sessionCode);
  const data = await startCheckout({ productType: 'TRYOUT', productKey: decoded });

  if (!data.ok) {
    redirect(STUDENT_ROUTES.tryout);
  }

  return (
    <CheckoutPage
      product={data.product}
      methods={data.methods}
      existingPaymentId={data.existingPaymentId}
      checkoutMode={data.checkoutMode}
      midtransClientKey={data.midtransClientKey}
      midtransSnapUrl={data.midtransSnapUrl}
    />
  );
}
