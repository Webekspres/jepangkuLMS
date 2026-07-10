export type PaymentSettings = {
  bankName: string;
  accountName: string;
  accountNumber: string;
};

export type ProgramPaymentKind = 'course' | 'tryout' | 'live-class';

function programKindLabel(kind: ProgramPaymentKind): string {
  if (kind === 'tryout') return 'JLPT Tryout';
  if (kind === 'live-class') return 'Live Class';
  return 'kursus';
}

export function buildProgramPaymentConfirmMessage(input: {
  kind: ProgramPaymentKind;
  productTitle: string;
  productDetail?: string;
  priceLabel: string;
  studentName: string | null;
  paymentSettings: PaymentSettings;
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

export function buildProgramConsultMessage(input: {
  kind: ProgramPaymentKind;
  productTitle: string;
}): string {
  return `Halo, saya ingin konsultasi tentang ${programKindLabel(input.kind)} "${input.productTitle}" sebelum mendaftar. Terima kasih!`;
}
