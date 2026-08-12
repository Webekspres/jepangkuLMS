import { describe, expect, test } from 'bun:test';
import {
  PAYMENT_METHODS_NAV_ITEM_ID,
  resolveAdminNavGroups,
} from '@/features/admin-cms/admin-nav-config';

describe('resolveAdminNavGroups', () => {
  test('keeps Pembayaran menu in core checkout mode', () => {
    const groups = resolveAdminNavGroups({ checkoutMode: 'core' });
    const ids = groups.flatMap((group) => group.items.map((item) => item.id));
    expect(ids).toContain(PAYMENT_METHODS_NAV_ITEM_ID);
  });

  test('hides Pembayaran menu in snap checkout mode', () => {
    const groups = resolveAdminNavGroups({ checkoutMode: 'snap' });
    const ids = groups.flatMap((group) => group.items.map((item) => item.id));
    expect(ids).not.toContain(PAYMENT_METHODS_NAV_ITEM_ID);
  });
});
