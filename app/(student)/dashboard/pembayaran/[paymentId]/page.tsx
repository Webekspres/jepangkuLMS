import { notFound } from 'next/navigation';
import { requireAuthUserWithAnchor } from '@/lib/auth/require-auth-user';
import { listCheckoutMethods } from '@/lib/payment-engine/registry/methods';
import { parsePaymentInstructions } from '@/lib/payment-engine/charge-course';
import { PaymentDetailPage } from '@/features/payment/components/payment-detail-page';
import { prisma } from '@/lib/prisma';

type Props = { params: Promise<{ paymentId: string }> };

export default async function PembayaranDetailRoute({ params }: Props) {
  const { paymentId } = await params;
  const userId = await requireAuthUserWithAnchor();

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      enrollment: {
        include: {
          course: { select: { slug: true, title: true } },
        },
      },
    },
  });

  if (!payment || payment.enrollment.userId !== userId) notFound();
  if (!payment.enrollment.course) notFound();

  return (
    <PaymentDetailPage
      initial={{
        paymentId: payment.id,
        orderId: payment.orderId,
        status: payment.status,
        amountIdr: payment.amountIdr,
        checkoutMethod: payment.checkoutMethod,
        instructions: parsePaymentInstructions(payment.instructions),
        expiresAt: payment.expiresAt?.toISOString() ?? null,
        course: payment.enrollment.course,
        methods: listCheckoutMethods(),
      }}
    />
  );
}
