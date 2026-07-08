import { describe, expect, test } from 'bun:test';
import { ADMIN_CONTACT, ADMIN_WA_NUMBER, buildWhatsAppUrl } from '@/lib/admin-contact';

describe('admin-contact', () => {
  test('ADMIN_WA_NUMBER matches contact config', () => {
    expect(ADMIN_WA_NUMBER).toBe(ADMIN_CONTACT.waNumber);
  });

  test('waDisplay matches Indonesian format', () => {
    expect(ADMIN_CONTACT.waDisplay).toBe('0851-1055-1580');
    expect(ADMIN_CONTACT.waNumber).toBe('6285110551580');
  });

  test('buildWhatsAppUrl encodes message and uses wa.me', () => {
    const url = buildWhatsAppUrl('Halo JepangKu');
    expect(url).toStartWith(`https://wa.me/${ADMIN_CONTACT.waNumber}?text=`);
    expect(url).toContain(encodeURIComponent('Halo JepangKu'));
  });
});
