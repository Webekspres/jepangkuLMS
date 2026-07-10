import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdminAccess } from '@/features/admin-cms/lib/require-admin-action';
import {
  importJlptBankZip,
  previewJlptBankZip,
} from '@/features/admin-cms/lib/import-jlpt-bank-zip';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { prisma } from '@/lib/prisma';

async function readZipBuffer(request: Request): Promise<
  | { ok: true; buffer: Buffer }
  | { ok: false; response: NextResponse }
> {
  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, message: 'File ZIP wajib diunggah.' }, { status: 400 }),
    };
  }
  if (!file.name.toLowerCase().endsWith('.zip')) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, message: 'Format harus .zip' }, { status: 400 }),
    };
  }
  if (file.size > 50 * 1024 * 1024) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, message: 'ZIP maksimal 50 MB.' }, { status: 400 }),
    };
  }
  return { ok: true, buffer: Buffer.from(await file.arrayBuffer()) };
}

export async function POST(request: Request) {
  try {
    await requireAdminAccess();
  } catch {
    return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 });
  }

  try {
    const url = new URL(request.url);
    const dryRun = url.searchParams.get('dryRun') === '1';
    const parsed = await readZipBuffer(request);
    if (!parsed.ok) return parsed.response;

    if (dryRun) {
      const preview = await previewJlptBankZip(prisma, parsed.buffer);
      return NextResponse.json(
        { ok: preview.ok, preview },
        { status: preview.ok ? 200 : 400 },
      );
    }

    const result = await importJlptBankZip(prisma, parsed.buffer);

    if (result.ok) {
      revalidatePath(ADMIN_ROUTES.tryoutPaket);
      revalidatePath(ADMIN_ROUTES.tryoutSessions);
      if (result.packageId) {
        revalidatePath(ADMIN_ROUTES.tryoutPaketDetail(result.packageId));
      }
    }

    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Import gagal.';
    return NextResponse.json({ ok: false, message, errors: [message] }, { status: 500 });
  }
}
