import type { CheckoutMethodId, ProviderChargeInput } from '@/lib/payment-engine/types';

const DEFAULT_EXPIRY_MINUTES = 60;

export function buildMidtransChargePayload(input: ProviderChargeInput): Record<string, unknown> {
  const expiryMinutes = input.expiryMinutes ?? DEFAULT_EXPIRY_MINUTES;
  const base = {
    transaction_details: {
      order_id: input.externalOrderId,
      gross_amount: input.amountIdr,
    },
    item_details: [
      {
        id: input.item.id,
        price: input.item.priceIdr,
        quantity: input.item.quantity,
        name: input.item.name.slice(0, 50),
      },
    ],
    customer_details: {
      first_name: input.customer.firstName ?? 'Siswa JepangKu',
      email: input.customer.email,
      phone: input.customer.phone,
    },
    custom_expiry: {
      expiry_duration: expiryMinutes,
      unit: 'minute',
    },
  };

  return { ...base, ...paymentTypeBlock(input.methodId) };
}

function paymentTypeBlock(methodId: CheckoutMethodId): Record<string, unknown> {
  switch (methodId) {
    case 'qris':
      return { payment_type: 'qris', qris: { acquirer: 'gopay' } };
    case 'gopay':
      return {
        payment_type: 'gopay',
        gopay: { enable_callback: true, callback_url: process.env.NEXT_PUBLIC_APP_URL ?? undefined },
      };
    case 'shopeepay':
      return {
        payment_type: 'shopeepay',
        shopeepay: { callback_url: process.env.NEXT_PUBLIC_APP_URL ?? undefined },
      };
    case 'va_bca':
      return { payment_type: 'bank_transfer', bank_transfer: { bank: 'bca' } };
    case 'va_bni':
      return { payment_type: 'bank_transfer', bank_transfer: { bank: 'bni' } };
    case 'va_bri':
      return { payment_type: 'bank_transfer', bank_transfer: { bank: 'bri' } };
    case 'va_mandiri':
      return { payment_type: 'echannel', echannel: { bill_info1: 'Payment:', bill_info2: 'JepangKu LMS' } };
    case 'indomaret':
      return { payment_type: 'cstore', cstore: { store: 'indomaret', message: 'JepangKu LMS' } };
    case 'alfamart':
      return { payment_type: 'cstore', cstore: { store: 'alfamart', message: 'JepangKu LMS' } };
    default: {
      const _exhaustive: never = methodId;
      throw new Error(`Unsupported checkout method: ${_exhaustive}`);
    }
  }
}
