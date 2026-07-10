'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  MessageCircle,
  Phone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatIdr, isFreeCourse } from '@/lib/lms/format-price';
import { buildWhatsAppUrl } from '@/lib/admin-contact';
import {
  buildProgramConsultMessage,
  buildProgramPaymentConfirmMessage,
  type PaymentSettings,
  type ProgramPaymentKind,
} from '@/lib/payment/enrollment-payment-messages';

export type ProgramEnrollmentStatus = 'none' | 'PENDING' | 'ACTIVE';

type ProgramPaymentPanelProps = {
  kind: ProgramPaymentKind;
  productTitle: string;
  /** Kode sesi, ID kelas, slug — ditambahkan ke pesan WA. */
  productDetail?: string;
  priceIdr: number;
  enrollmentStatus: ProgramEnrollmentStatus;
  studentDisplayName: string | null;
  paymentSettings: PaymentSettings;
  onRequestEnrollment: () => Promise<void>;
  /** Opsional: link pembayaran eksternal (mis. Live Class). */
  paymentLink?: string | null;
  disabled?: boolean;
  disabledMessage?: string;
};

export function ProgramPaymentPanel({
  kind,
  productTitle,
  productDetail,
  priceIdr,
  enrollmentStatus,
  studentDisplayName,
  paymentSettings,
  onRequestEnrollment,
  paymentLink,
  disabled = false,
  disabledMessage,
}: ProgramPaymentPanelProps) {
  const [copied, setCopied] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  if (isFreeCourse(priceIdr) || enrollmentStatus === 'ACTIVE') {
    return null;
  }

  const priceLabel = formatIdr(priceIdr);
  const isPending = enrollmentStatus === 'PENDING';

  const waConfirmUrl = buildWhatsAppUrl(
    buildProgramPaymentConfirmMessage({
      kind,
      productTitle,
      productDetail,
      priceLabel,
      studentName: studentDisplayName,
      paymentSettings,
    }),
  );
  const waConsultUrl = buildWhatsAppUrl(
    buildProgramConsultMessage({ kind, productTitle }),
  );

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(paymentSettings.accountNumber).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmPayment = async () => {
    if (!isPending) {
      setIsRequesting(true);
      try {
        await onRequestEnrollment();
      } finally {
        setIsRequesting(false);
      }
    }
    window.open(waConfirmUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-2xl font-extrabold text-brand-red">{priceLabel}</span>
          <span className="text-xs text-muted-foreground">sekali bayar</span>
        </div>

        {isPending ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-semibold">Menunggu verifikasi admin</p>
            <p className="mt-1 text-xs text-amber-800">
              Setelah transfer, kirim bukti via WhatsApp. Admin akan mengaktifkan akses setelah
              pembayaran dikonfirmasi.
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Transfer sesuai nominal, lalu konfirmasi via WhatsApp agar admin memverifikasi
            pendaftaranmu.
          </p>
        )}

        {disabled && disabledMessage ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {disabledMessage}
          </p>
        ) : null}

        {paymentLink ? (
          <Button asChild className="h-11 w-full gap-2 font-bold">
            <a href={paymentLink} target="_blank" rel="noopener noreferrer">
              Bayar Sekarang
              <ExternalLink className="size-4" />
            </a>
          </Button>
        ) : (
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
        )}

        <Button
          type="button"
          className="h-11 w-full gap-2 bg-[#25d366] hover:bg-[#128c7e]"
          disabled={isRequesting || disabled}
          onClick={handleConfirmPayment}
        >
          <MessageCircle className="size-4" />
          {isRequesting ? 'Memproses…' : 'Konfirmasi Pembayaran'}
        </Button>

        <Button
          asChild
          variant="outline"
          className="h-11 w-full gap-2 border-2 border-brand-red text-brand-red hover:bg-brand-red/5"
        >
          <a href={waConsultUrl} target="_blank" rel="noopener noreferrer">
            <Phone className="size-4" />
            Konsultasi Terlebih Dahulu
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
