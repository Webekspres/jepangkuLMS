import { PaymentInvoicePage } from '@/features/payment/components/payment-invoice-page';
import { loadPaymentInvoice } from '@/features/payment/lib/load-payment-invoice';

type Props = { params: Promise<{ paymentId: string }> };

export default async function PembayaranInvoiceRoute({ params }: Props) {
  const { paymentId } = await params;
  const invoice = await loadPaymentInvoice(paymentId);
  return <PaymentInvoicePage invoice={invoice} />;
}
