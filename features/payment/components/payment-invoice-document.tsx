import Image from 'next/image';
import type { CheckoutProductType } from '@/lib/payment-engine/types';
import { BRAND_LOGO_SRC } from '@/lib/brand-logo';
import { formatIdr } from '@/lib/lms/format-price';
import { cn } from '@/lib/utils';

const TYPE_LABEL: Record<CheckoutProductType, string> = {
  COURSE: 'Kursus',
  LIVE_CLASS: 'Live Class',
  TRYOUT: 'Tryout',
};

function formatIssuedDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).replace(/ /g, '-');
}

export type PaymentInvoiceDocumentProps = {
  orderId: string;
  amountIdr: number;
  paidAt: string;
  productType: CheckoutProductType;
  productTitle: string;
  methodLabel: string;
  billFrom: {
    name: string;
    website: string;
    email: string;
    phoneDisplay: string;
  };
  billTo: {
    name: string;
    email: string | null;
  };
  className?: string;
};

export function PaymentInvoiceDocument({
  orderId,
  amountIdr,
  paidAt,
  productType,
  productTitle,
  methodLabel,
  billFrom,
  billTo,
  className,
}: PaymentInvoiceDocumentProps) {
  return (
    <article
      className={cn(
        'invoice-print-root overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm',
        className,
      )}
    >
      <div className="space-y-8 p-6 sm:p-8">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <Image
            src={BRAND_LOGO_SRC}
            alt="JepangKu"
            width={180}
            height={52}
            className="h-10 w-auto object-contain sm:h-12"
            priority
          />
          <div className="text-left sm:text-right">
            <p className="text-xs text-muted-foreground">
              Issued:{' '}
              <span className="font-medium text-foreground">{formatIssuedDate(paidAt)}</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Status:{' '}
              <span className="font-bold uppercase tracking-wide text-emerald-700">Berhasil</span>
            </p>
          </div>
        </header>

        <div>
          <p className="font-mono text-xl font-extrabold tracking-tight text-brand-navy sm:text-2xl">
            #{orderId}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {TYPE_LABEL[productType]}: {productTitle}
          </p>
        </div>

        <div className="grid gap-6 border-t border-border pt-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Bill From
            </p>
            <p className="mt-2 text-sm font-bold text-foreground">{billFrom.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{billFrom.website}</p>
            <p className="text-sm text-muted-foreground">
              WhatsApp {billFrom.phoneDisplay}
            </p>
            <p className="text-sm text-muted-foreground">{billFrom.email}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Bill To
            </p>
            <p className="mt-2 text-sm font-bold text-foreground">{billTo.name}</p>
            {billTo.email ? (
              <p className="mt-1 text-sm text-muted-foreground">{billTo.email}</p>
            ) : null}
            <p className="mt-1 text-sm text-muted-foreground">Siswa JepangKu</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-muted/60 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2.5 sm:px-4">#</th>
                <th className="px-3 py-2.5 sm:px-4">Nama produk</th>
                <th className="px-3 py-2.5 text-right sm:px-4">Harga</th>
                <th className="px-3 py-2.5 text-right sm:px-4">Qty</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border">
                <td className="px-3 py-3 tabular-nums text-muted-foreground sm:px-4">1</td>
                <td className="px-3 py-3 font-medium text-foreground sm:px-4">
                  <span className="block">{productTitle}</span>
                  <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                    {TYPE_LABEL[productType]} · {methodLabel}
                  </span>
                </td>
                <td className="px-3 py-3 text-right font-semibold tabular-nums text-foreground sm:px-4">
                  {formatIdr(amountIdr)}
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-muted-foreground sm:px-4">
                  1
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="border-t border-border bg-muted/40">
                <td colSpan={2} className="px-3 py-3 text-sm font-semibold text-foreground sm:px-4">
                  Total
                </td>
                <td
                  colSpan={2}
                  className="px-3 py-3 text-right text-base font-extrabold tabular-nums text-brand-red sm:px-4"
                >
                  {formatIdr(amountIdr)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Terima kasih telah belajar bersama JepangKu. Semangat terus menuju JLPT!
        </p>
      </div>
    </article>
  );
}
