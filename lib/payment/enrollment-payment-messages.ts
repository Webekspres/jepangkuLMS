export type PaymentSettings = {
  provider: 'midtrans' | 'unavailable';
  checkoutMode: 'snap' | 'core' | 'unavailable';
  /** @deprecated Bank transfer retired — empty defaults only. */
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

/** Consult-only WhatsApp message (no bank transfer details). */
export function buildProgramConsultMessage(input: {
  kind: ProgramPaymentKind;
  productTitle: string;
}): string {
  return `Halo, saya ingin bertanya tentang ${programKindLabel(input.kind)} "${input.productTitle}".`;
}
