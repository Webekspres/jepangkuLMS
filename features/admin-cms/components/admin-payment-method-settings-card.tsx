'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { setPaymentMethodEnabled } from '@/features/admin-cms/actions/payment-method-settings-actions';
import type { AdminPaymentMethodRow } from '@/lib/payment-engine/registry/payment-method-settings';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type AdminPaymentMethodSettingsCardProps = {
  methods: AdminPaymentMethodRow[];
};

export function AdminPaymentMethodSettingsCard({
  methods,
}: AdminPaymentMethodSettingsCardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const toggle = (methodId: string, enabled: boolean) => {
    startTransition(async () => {
      const result = await setPaymentMethodEnabled({ methodId, enabled });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(enabled ? 'Metode diaktifkan di checkout' : 'Metode dinonaktifkan');
      router.refresh();
    });
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Metode pembayaran checkout</CardTitle>
        <CardDescription>
          Nyalakan hanya channel yang sudah aktif di Midtrans MAP untuk Core API. Metode yang
          ditolak Midtrans (402) otomatis dimatikan.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {methods.map((method) => (
          <div
            key={method.methodId}
            className="flex items-start justify-between gap-3 rounded-lg border border-border px-3 py-2.5"
          >
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">{method.displayName}</p>
                <Badge variant="secondary" className="text-[10px] uppercase">
                  {method.category}
                </Badge>
              </div>
              {method.description ? (
                <p className="text-xs text-muted-foreground">{method.description}</p>
              ) : null}
              {method.disabledReason && !method.enabled ? (
                <p className="text-xs text-amber-800">{method.disabledReason}</p>
              ) : null}
            </div>
            <Button
              type="button"
              size="sm"
              variant={method.enabled ? 'default' : 'outline'}
              disabled={pending}
              onClick={() => toggle(method.methodId, !method.enabled)}
            >
              {method.enabled ? 'On' : 'Off'}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
