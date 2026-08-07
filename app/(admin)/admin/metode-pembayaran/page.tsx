import { AdminPageShell } from '@/features/admin-cms/components/admin-page-shell';
import { AdminPaymentMethodSettingsCard } from '@/features/admin-cms/components/admin-payment-method-settings-card';
import { getCheckoutMode } from '@/lib/midtrans/config';
import { loadAdminPaymentMethodSettings } from '@/lib/payment-engine/registry/payment-method-settings';

export default async function AdminMetodePembayaranPage() {
  const [paymentMethods, checkoutMode] = await Promise.all([
    loadAdminPaymentMethodSettings(),
    Promise.resolve(getCheckoutMode()),
  ]);

  return (
    <AdminPageShell
      label="Pembayaran"
      title="Pengaturan pembayaran"
      subtitle="Kelola metode checkout Core API. Mode Snap memakai Snap Preferences di Midtrans MAP."
    >
      <AdminPaymentMethodSettingsCard methods={paymentMethods} checkoutMode={checkoutMode} />
    </AdminPageShell>
  );
}
