/** Placeholder — ganti dengan kontak resmi saat go-live. */
export const ADMIN_CONTACT = {
  waNumber: '6281234567890',
  waDisplay: '0812-3456-7890',
  email: 'admin@jepangku.com',
  hours: 'Senin–Jumat, 09.00–17.00 WIB',
  responseNote: 'Balasan dalam 1×24 jam kerja',
} as const;

export const ADMIN_WA_NUMBER = ADMIN_CONTACT.waNumber;

export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/${ADMIN_CONTACT.waNumber}?text=${encodeURIComponent(message)}`;
}
