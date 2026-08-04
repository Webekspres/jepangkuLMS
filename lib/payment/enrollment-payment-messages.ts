export type PaymentSettings = {
  provider: 'midtrans' | 'manual' | 'unavailable';
  checkoutMode: 'snap' | 'core' | 'unavailable';
  bankName: string;
  accountName: string;
  accountNumber: string;
  midtransClientKey: string | null;
  midtransSnapUrl: string | null;
};

export type ProgramPaymentKind = 'course' | 'tryout' | 'live-class';

function programKindLabel(kind: ProgramPaymentKind): string {
  if (kind === 'tryout') return 'JLPT Tryout';
  if (kind === 'live-class') return 'Live Class';
  return 'kursus';
}

/** WhatsApp confirm after student requests manual bank-transfer enrollment. */
export function buildProgramPaymentConfirmMessage(input: {
  kind: ProgramPaymentKind;
  productTitle: string;
  productDetail?: string;
  priceLabel: string;
  studentName: string | null;
  paymentSettings: Pick<PaymentSettings, 'bankName' | 'accountName' | 'accountNumber'>;
}): string {
  const name = input.studentName?.trim() || '[nama Anda]';
  const detail = input.productDetail ? ` (${input.productDetail})` : '';
  return [
    `Halo, saya ingin konfirmasi pembayaran untuk ${programKindLabel(input.kind)} "${input.productTitle}"${detail} (${input.priceLabel}).`,
    '',
    `Nama: ${name}`,
    `No. Rekening tujuan: ${input.paymentSettings.bankName} ${input.paymentSettings.accountNumber} a/n ${input.paymentSettings.accountName}`,
    '',
    'Mohon konfirmasi. Terima kasih!',
  ].join('\n');
}

/** Consult-only WhatsApp message (no bank transfer details). */
export function buildProgramConsultMessage(input: {
  kind: ProgramPaymentKind;
  productTitle: string;
}): string {
  return `Halo, saya ingin bertanya tentang ${programKindLabel(input.kind)} "${input.productTitle}".`;
}
