'use client';

import Image from 'next/image';
import {
  listCheckoutMethodGroups,
  paymentMethodIconSrc,
} from '@/lib/payment-engine/registry/methods';
import type { CheckoutMethodId, PaymentMethodMeta } from '@/lib/payment-engine/types';
import { cn } from '@/lib/utils';

type PaymentMethodSelectorProps = {
  methods: PaymentMethodMeta[];
  value: CheckoutMethodId | null;
  onChange: (id: CheckoutMethodId) => void;
  disabled?: boolean;
};

export function PaymentMethodSelector({
  methods,
  value,
  onChange,
  disabled,
}: PaymentMethodSelectorProps) {
  const groups = listCheckoutMethodGroups(methods);

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.id}>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {group.label}
          </h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {group.methods.map((method) => {
              const selected = value === method.id;
              const methodDisabled = disabled || method.maintenance;
              return (
                <li key={method.id}>
                  <button
                    type="button"
                    disabled={methodDisabled}
                    onClick={() => onChange(method.id)}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors',
                      selected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border bg-card hover:border-primary/40',
                      methodDisabled && 'cursor-not-allowed opacity-50',
                    )}
                  >
                    <span className="relative mt-0.5 size-10 shrink-0 overflow-hidden rounded-lg border border-border bg-background">
                      <Image
                        src={paymentMethodIconSrc(method.logoKey)}
                        alt=""
                        width={40}
                        height={40}
                        className="size-10 object-cover"
                        unoptimized
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex w-full items-center justify-between gap-2">
                        <span className="font-semibold text-foreground">{method.displayName}</span>
                        {method.recommended ? (
                          <span className="shrink-0 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                            Rekomendasi
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {method.maintenance
                          ? (method.maintenanceMessage ?? 'Sedang maintenance')
                          : (method.description ?? '')}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
