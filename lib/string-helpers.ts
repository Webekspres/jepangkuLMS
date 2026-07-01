/**
 * URL-safe slug dari teks bebas.
 * - lowercase
 * - spasi → tanda hubung (-)
 * - buang semua karakter selain alfanumerik & tanda hubung
 * - rapikan tanda hubung beruntun + trim di awal/akhir
 *
 * Contoh: "Simulasi JLPT — Fase 1!" → "simulasi-jlpt-fase-1"
 */
export function generateSlug(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Varian untuk dipakai saat user mengetik di field slug secara langsung.
 * Sama dengan {@link generateSlug}, tetapi mempertahankan SATU tanda hubung
 * di akhir agar pengguna tetap bisa mengetik "kata-" lalu melanjutkan kata
 * berikutnya. Jalankan {@link generateSlug} saat blur untuk hasil final.
 */
export function sanitizeSlugWhileTyping(text: string): string {
  const endsWithSeparator = /[\s-]$/.test(text);
  const core = generateSlug(text);
  return endsWithSeparator && core.length > 0 ? `${core}-` : core;
}
