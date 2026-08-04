'use client';

import { useState } from 'react';
import { CheckCircle2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PaymentSettings } from '@/lib/payment/enrollment-payment-messages';

type ManualBankTransferCardProps = {
  paymentSettings: Pick<PaymentSettings, 'bankName' | 'accountName' | 'accountNumber'>;
  priceLabel: string;
};

/** Shared bank-account block for PAYMENT_PROVIDER=manual bridge. */
export function ManualBankTransferCard({
  paymentSettings,
  priceLabel,
}: ManualBankTransferCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(paymentSettings.accountNumber).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Transfer via {paymentSettings.bankName}
      </p>
      <div className="space-y-2 rounded-xl bg-muted/60 p-3.5">
        <div>
          <p className="text-xs text-muted-foreground">Nama Rekening</p>
          <p className="text-sm font-semibold text-foreground">{paymentSettings.accountName}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Nomor Rekening</p>
          <div className="flex items-center justify-between gap-2">
            <p className="text-base font-bold tracking-widest text-foreground">
              {paymentSettings.accountNumber}
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-8 gap-1 text-xs"
              onClick={handleCopyAccount}
            >
              {copied ? (
                <>
                  <CheckCircle2 className="size-3.5" />
                  Tersalin
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  Salin
                </>
              )}
            </Button>
          </div>
        </div>
        <div className="border-t border-border pt-2">
          <p className="text-xs text-muted-foreground">Jumlah Transfer</p>
          <p className="text-sm font-bold text-brand-red">{priceLabel}</p>
        </div>
      </div>
    </div>
  );
}
