import { requireAdminAccess } from '@/features/admin-cms/lib/require-admin-action';
import { buildJlptBankTemplateZip } from '@/features/admin-cms/lib/import-jlpt-bank-zip';

export async function GET() {
  try {
    await requireAdminAccess();
  } catch {
    return new Response('Forbidden', { status: 403 });
  }

  const buffer = await buildJlptBankTemplateZip();
  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="jlpt-bank-template.zip"',
    },
  });
}
