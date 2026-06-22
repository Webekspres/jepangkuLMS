import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/features/admin-cms/lib/require-admin-action';
import { TRYOUT_IMPORT_TEMPLATE_CSV } from '@/features/admin-cms/lib/import-tryout-questions';

export async function GET(request: Request) {
  try {
    await requireAdminAccess();
  } catch {
    return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') ?? 'csv';

  if (format === 'xlsx') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const XLSX = require('xlsx') as typeof import('xlsx');
    const rows = TRYOUT_IMPORT_TEMPLATE_CSV.split('\n').map((line) =>
      line.split(',').map((cell) => cell.replace(/^"|"$/g, '')),
    );
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'TryoutImport');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="tryout-import-template.xlsx"',
      },
    });
  }

  return new NextResponse(TRYOUT_IMPORT_TEMPLATE_CSV, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="tryout-import-template.csv"',
    },
  });
}
