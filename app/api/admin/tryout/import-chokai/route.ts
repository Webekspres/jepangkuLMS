import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/features/admin-cms/lib/require-admin-action';
import { LEGACY_TRYOUT_IMPORT_DISABLED_MESSAGE } from '@/features/admin-cms/lib/tryout-phase2-guards';
import { ADMIN_ROUTES } from '@/lib/auth/constants';

/** @deprecated Phase 2 — use /api/admin/tryout/bank-import */
export async function POST() {
  try {
    await requireAdminAccess();
  } catch {
    return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json(
    {
      ok: false,
      message: LEGACY_TRYOUT_IMPORT_DISABLED_MESSAGE,
      imported: 0,
      redirectTo: ADMIN_ROUTES.tryoutBank,
    },
    { status: 410 },
  );
}
