'use client';

import Link from 'next/link';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PaymentInvoiceDocument } from '@/features/payment/components/payment-invoice-document';
import type { PaymentInvoiceView } from '@/features/payment/lib/load-payment-invoice';

export function PaymentInvoicePage({ invoice }: { invoice: PaymentInvoiceView }) {
  return (
    <div data-invoice-page className="mx-auto max-w-3xl space-y-6 pb-12">
      <div className="print:hidden">
        <Link
          href={invoice.detailHref}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="size-3.5" />
          Kembali ke detail transaksi
        </Link>
        <h1 className="mt-3 font-heading text-2xl font-extrabold text-foreground md:text-3xl">
          Invoice
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Unduh bukti pembayaran sebagai dokumentasi pribadi (Cetak / Simpan PDF).
        </p>
      </div>

      <PaymentInvoiceDocument
        orderId={invoice.orderId}
        amountIdr={invoice.amountIdr}
        paidAt={invoice.paidAt}
        productType={invoice.product.type}
        productTitle={invoice.product.title}
        methodLabel={invoice.methodLabel}
        billFrom={invoice.billFrom}
        billTo={invoice.billTo}
      />

      <div className="flex justify-center print:hidden">
        <Button
          type="button"
          size="lg"
          className="h-11 min-w-48 gap-2"
          onClick={() => window.print()}
        >
          <Printer className="size-4" />
          Cetak Invoice
        </Button>
      </div>
    </div>
  );
}
