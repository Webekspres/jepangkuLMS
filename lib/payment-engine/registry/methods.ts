import type {
  CheckoutMethodId,
  PaymentMethodCategory,
  PaymentMethodMeta,
} from '@/lib/payment-engine/types';
import { prisma } from '@/lib/prisma';

/**
 * Canonical method catalog — UI metadata only.
 * Runtime enablement lives in PaymentMethodSetting (admin + 402 auto-disable).
 */
export const METHOD_CATALOG: PaymentMethodMeta[] = [
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

const CATALOG_BY_ID = new Map(METHOD_CATALOG.map((m) => [m.id, m]));

/** Local asset path for method icon (public/payment-icons). */
export function paymentMethodIconSrc(logoKey: string): string {
  return `/payment-icons/${logoKey}.svg`;
}

/** Catalog metadata (ignores admin enablement). */
export function getCatalogMethod(id: CheckoutMethodId): PaymentMethodMeta | undefined {
  return CATALOG_BY_ID.get(id);
}

export async function listCheckoutMethods(): Promise<PaymentMethodMeta[]> {
  const rows = await prisma.paymentMethodSetting.findMany({
    where: { enabled: true },
    select: { methodId: true },
  });
  const enabled = new Set(rows.map((r) => r.methodId));

  return METHOD_CATALOG.filter((m) => enabled.has(m.id) && !m.maintenance).sort(
    (a, b) => a.priority - b.priority,
  );
}

export function listCheckoutMethodGroups(
  methods: PaymentMethodMeta[],
): PaymentMethodGroup[] {
  return GROUP_ORDER.map((group) => ({
    id: group.id,
    label: group.label,
    methods: methods.filter((m) => group.categories.includes(m.category)),
  })).filter((g) => g.methods.length > 0);
}

/** Prefer catalog for display after charge; fallback to enabled list. */
export function getCheckoutMethod(id: CheckoutMethodId): PaymentMethodMeta | undefined {
  return getCatalogMethod(id);
}

export async function isCheckoutMethodAvailable(id: CheckoutMethodId): Promise<boolean> {
  const row = await prisma.paymentMethodSetting.findUnique({
    where: { methodId: id },
    select: { enabled: true },
  });
  if (!row?.enabled) return false;
  const meta = getCatalogMethod(id);
  return Boolean(meta && !meta.maintenance);
}

export async function disableCheckoutMethod(
  methodId: CheckoutMethodId,
  reason: string,
): Promise<void> {
  await prisma.paymentMethodSetting.upsert({
    where: { methodId },
    create: {
      methodId,
      enabled: false,
      disabledReason: reason,
    },
    update: {
      enabled: false,
      disabledReason: reason,
    },
  });
}

export function isChannelNotActivatedError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /channel is not activated|402/i.test(message);
}
