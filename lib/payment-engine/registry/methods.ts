import type {
  CheckoutMethodId,
  PaymentMethodCategory,
  PaymentMethodMeta,
} from '@/lib/payment-engine/types';

/**
 * Canonical method catalog. UI maps this metadata → cards; never hardcode methods in JSX.
 * Enable/disable via env `PAYMENT_METHODS_ENABLED` (comma-separated ids). Empty/unset = all enabled entries.
 */
const METHOD_CATALOG: PaymentMethodMeta[] = [
  {
    id: 'qris',
    displayName: 'QRIS',
    description: 'Scan QR dari semua e-wallet & mobile banking',
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
    description: 'Bayar lewat aplikasi Gojek / GoPay',
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
    description: 'Bayar lewat aplikasi Shopee',
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
    description: 'Transfer VA BCA (ATM / m-banking)',
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
    description: 'Transfer VA BNI (ATM / m-banking)',
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
    description: 'Transfer VA BRI (ATM / m-banking)',
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
    description: 'Transfer VA Mandiri (ATM / Livin)',
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
    description: 'Bayar tunai di kasir Indomaret',
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
    description: 'Bayar tunai di kasir Alfamart / Alfamidi',
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

export type PaymentMethodGroupId = 'ewallet' | 'va' | 'retail';

export type PaymentMethodGroup = {
  id: PaymentMethodGroupId;
  label: string;
  methods: PaymentMethodMeta[];
};

const GROUP_ORDER: { id: PaymentMethodGroupId; label: string; categories: PaymentMethodCategory[] }[] =
  [
    { id: 'ewallet', label: 'E-Wallet', categories: ['qris', 'ewallet'] },
    { id: 'va', label: 'Virtual Account', categories: ['va'] },
    { id: 'retail', label: 'Retail', categories: ['cstore'] },
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

/** Local asset path for method icon (public/payment-icons). */
export function paymentMethodIconSrc(logoKey: string): string {
  return `/payment-icons/${logoKey}.svg`;
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

export function listCheckoutMethodGroups(
  methods: PaymentMethodMeta[] = listCheckoutMethods(),
): PaymentMethodGroup[] {
  return GROUP_ORDER.map((group) => ({
    id: group.id,
    label: group.label,
    methods: methods.filter((m) => group.categories.includes(m.category)),
  })).filter((g) => g.methods.length > 0);
}

export function getCheckoutMethod(id: CheckoutMethodId): PaymentMethodMeta | undefined {
  return listCheckoutMethods().find((m) => m.id === id) ?? METHOD_CATALOG.find((m) => m.id === id);
}

export function isCheckoutMethodAvailable(id: CheckoutMethodId): boolean {
  const m = listCheckoutMethods().find((entry) => entry.id === id);
  return Boolean(m && m.enabled && !m.maintenance);
}
