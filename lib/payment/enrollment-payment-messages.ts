export type PaymentSettings = {
  provider: 'midtrans' | 'unavailable';
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
