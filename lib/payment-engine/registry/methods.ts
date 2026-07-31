import type { CheckoutMethodId, PaymentMethodMeta } from '@/lib/payment-engine/types';

/**
 * Canonical method catalog. UI maps this metadata → cards; never hardcode methods in JSX.
 * Enable/disable via env `PAYMENT_METHODS_ENABLED` (comma-separated ids). Empty/unset = all enabled entries.
 */
const METHOD_CATALOG: PaymentMethodMeta[] = [
  {
    id: 'qris',
    displayName: 'QRIS',
    logoKey: 'qris',
    category: 'qris',
    enabled: true,
    maintenance: false,
    supportedPlatforms: 'all',
    priority: 10,
    recommended: true,
    instructionKind: 'qris',
  },
  {
    id: 'gopay',
    displayName: 'GoPay',
    logoKey: 'gopay',
    category: 'ewallet',
    enabled: true,
    maintenance: false,
    supportedPlatforms: 'all',
    priority: 20,
    recommended: false,
    instructionKind: 'ewallet',
  },
  {
    id: 'shopeepay',
    displayName: 'ShopeePay',
    logoKey: 'shopeepay',
    category: 'ewallet',
    enabled: true,
    maintenance: false,
    supportedPlatforms: 'all',
    priority: 30,
    recommended: false,
    instructionKind: 'ewallet',
  },
  {
    id: 'va_bca',
    displayName: 'BCA Virtual Account',
    logoKey: 'bca',
    category: 'va',
    enabled: true,
    maintenance: false,
    supportedPlatforms: 'all',
    priority: 40,
    recommended: false,
    instructionKind: 'va',
  },
  {
    id: 'va_bni',
    displayName: 'BNI Virtual Account',
    logoKey: 'bni',
    category: 'va',
    enabled: true,
    maintenance: false,
    supportedPlatforms: 'all',
    priority: 50,
    recommended: false,
    instructionKind: 'va',
  },
  {
    id: 'va_bri',
    displayName: 'BRI Virtual Account',
    logoKey: 'bri',
    category: 'va',
    enabled: true,
    maintenance: false,
    supportedPlatforms: 'all',
    priority: 60,
    recommended: false,
    instructionKind: 'va',
  },
  {
    id: 'va_mandiri',
    displayName: 'Mandiri Virtual Account',
    logoKey: 'mandiri',
    category: 'va',
    enabled: true,
    maintenance: false,
    supportedPlatforms: 'all',
    priority: 70,
    recommended: false,
    instructionKind: 'va',
  },
  {
    id: 'indomaret',
    displayName: 'Indomaret',
    logoKey: 'indomaret',
    category: 'cstore',
    enabled: true,
    maintenance: false,
    supportedPlatforms: 'all',
    priority: 80,
    recommended: false,
    instructionKind: 'cstore',
  },
  {
    id: 'alfamart',
    displayName: 'Alfamart',
    logoKey: 'alfamart',
    category: 'cstore',
    enabled: true,
    maintenance: false,
    supportedPlatforms: 'all',
    priority: 90,
    recommended: false,
    instructionKind: 'cstore',
  },
];

function parseEnabledAllowlist(): Set<CheckoutMethodId> | null {
  const raw = process.env.PAYMENT_METHODS_ENABLED?.trim();
  if (!raw) return null;
  const ids = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean) as CheckoutMethodId[];
  return new Set(ids);
}

/** Methods available for checkout UI (enabled, not in maintenance unless still listed). */
export function listCheckoutMethods(): PaymentMethodMeta[] {
  const allow = parseEnabledAllowlist();
  return METHOD_CATALOG.filter((m) => {
    if (!m.enabled) return false;
    if (allow && !allow.has(m.id)) return false;
    return true;
  }).sort((a, b) => a.priority - b.priority);
}

export function getCheckoutMethod(id: CheckoutMethodId): PaymentMethodMeta | undefined {
  return listCheckoutMethods().find((m) => m.id === id) ?? METHOD_CATALOG.find((m) => m.id === id);
}

export function isCheckoutMethodAvailable(id: CheckoutMethodId): boolean {
  const m = listCheckoutMethods().find((entry) => entry.id === id);
  return Boolean(m && m.enabled && !m.maintenance);
}
