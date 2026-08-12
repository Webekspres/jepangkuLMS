import { redirect } from 'next/navigation';
import { AdminPageShell } from '@/features/admin-cms/components/admin-page-shell';
import { AdminPaymentMethodSettingsCard } from '@/features/admin-cms/components/admin-payment-method-settings-card';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { getCheckoutMode } from '@/lib/midtrans/config';
import { loadAdminPaymentMethodSettings } from '@/lib/payment-engine/registry/payment-method-settings';

export default async function AdminMetodePembayaranPage() {
  const checkoutMode = getCheckoutMode();
  if (checkoutMode === 'snap') {
    redirect(ADMIN_ROUTES.pembayaran);
  }

  const paymentMethods = await loadAdminPaymentMethodSettings();

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
