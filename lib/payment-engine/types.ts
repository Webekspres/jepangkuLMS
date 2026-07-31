/**
 * Payment engine domain types — provider-agnostic.
 * See docs/PAYMENT_MODEL.md § Payment engine architecture.
 */

export type PaymentProviderId = 'midtrans'; // | 'xendit' | 'stripe' later

export type CheckoutProductType = 'COURSE' | 'LIVE_CLASS' | 'TRYOUT';

export type CheckoutMethodId =
  | 'qris'
  | 'gopay'
  | 'shopeepay'
  | 'va_bca'
  | 'va_bni'
  | 'va_bri'
  | 'va_mandiri'
  | 'indomaret'
  | 'alfamart';

export type PaymentMethodCategory = 'qris' | 'ewallet' | 'va' | 'cstore';

export type InstructionKind = 'qris' | 'va' | 'ewallet' | 'cstore';

export type SupportedPlatform = 'web_desktop' | 'web_mobile' | 'all';

/** In-memory checkout quote — not a DB PaymentIntent (see PAYMENT_MODEL.md). */
export type CheckoutContext = {
  product: {
    type: CheckoutProductType;
    id: string;
    slug: string;
    title: string;
    imageUrl?: string | null;
  };
  buyer: {
    userId: string;
    email?: string | null;
    name?: string | null;
    phone?: string | null;
  };
  pricing: {
    currency: 'IDR';
    listPriceIdr: number;
    discountIdr: number;
    feesIdr: number;
    totalIdr: number;
  };
  providerId: PaymentProviderId;
  methodId?: CheckoutMethodId;
};

export type PaymentMethodMeta = {
  id: CheckoutMethodId;
  displayName: string;
  description?: string;
  logoKey: string;
  category: PaymentMethodCategory;
  enabled: boolean;
  maintenance: boolean;
  maintenanceMessage?: string;
  supportedPlatforms: SupportedPlatform;
  priority: number;
  recommended: boolean;
  instructionKind: InstructionKind;
};

/** Normalized instructions stored on Payment (and rendered by Payment Detail). */
export type PaymentInstructions =
  | {
      kind: 'qris';
      qrUrl: string;
      amountIdr: number;
      expiresAt?: string | null;
    }
  | {
      kind: 'va';
      bank: string;
      vaNumber: string;
      amountIdr: number;
      expiresAt?: string | null;
    }
  | {
      kind: 'ewallet';
      deepLink?: string | null;
      qrUrl?: string | null;
      amountIdr: number;
      expiresAt?: string | null;
    }
  | {
      kind: 'cstore';
      store: string;
      paymentCode: string;
      amountIdr: number;
      expiresAt?: string | null;
    };

export type ProviderChargeInput = {
  externalOrderId: string;
  amountIdr: number;
  methodId: CheckoutMethodId;
  item: { id: string; name: string; quantity: number; priceIdr: number };
  customer: { firstName?: string; email?: string; phone?: string };
  expiryMinutes?: number;
};

export type ProviderChargeResult = {
  externalOrderId: string;
  externalTransactionId?: string | null;
  providerPaymentType?: string | null;
  status: 'PENDING' | 'PAID' | 'FAILED';
  expiresAt?: Date | null;
  instructions: PaymentInstructions;
  raw: unknown;
};

export type ProviderStatusResult = {
  externalOrderId: string;
  externalTransactionId?: string | null;
  providerPaymentType?: string | null;
  /** Mapped toward Prisma PaymentStatus string values. */
  status: 'PENDING' | 'CHALLENGE' | 'PAID' | 'DENIED' | 'EXPIRED' | 'CANCELED' | 'FAILED';
  fraudStatus?: string | null;
  statusCode?: string | null;
  transactionStatus?: string | null;
  raw: unknown;
};

export type ProviderWebhookEvent = {
  externalOrderId: string;
  /** Opaque payload for Status API re-fetch / audit. */
  notification: unknown;
};
