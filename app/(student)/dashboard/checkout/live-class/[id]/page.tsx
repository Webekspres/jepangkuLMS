import { redirect } from 'next/navigation';
import { startCheckout } from '@/features/checkout/actions/checkout-actions';
import { CheckoutPage } from '@/features/checkout/components/checkout-page';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';

type Props = { params: Promise<{ id: string }> };

export default async function LiveClassCheckoutRoute({ params }: Props) {
  const { id } = await params;
  const data = await startCheckout({ productType: 'LIVE_CLASS', productKey: id });

  if (!data.ok) {
    redirect(STUDENT_ROUTES.liveClassDetail(id));
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
