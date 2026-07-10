import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/features/admin-cms/lib/require-admin-action';
import {
  JLPT_BANK_IMAGE_MAX_BYTES,
  resolveJlptBankImageMime,
  uploadJlptBankAsset,
} from '@/lib/media/jlpt-bank-assets';

export async function POST(request: Request) {
  try {
    await requireAdminAccess();
  } catch {
    return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const level = String(formData.get('level') ?? 'N5').trim() || 'N5';
    const code = String(formData.get('code') ?? 'stimulus').trim() || 'stimulus';

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ ok: false, message: 'File gambar wajib diunggah.' }, { status: 400 });
    }
    if (file.size > JLPT_BANK_IMAGE_MAX_BYTES) {
      return NextResponse.json({ ok: false, message: 'Ukuran gambar maksimal 5 MB.' }, { status: 400 });
    }

    const contentType = resolveJlptBankImageMime({ type: file.type, name: file.name });
    if (!contentType) {
      return NextResponse.json(
        { ok: false, message: 'Format tidak didukung. Gunakan PNG, JPG, atau WebP.' },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadJlptBankAsset({
      buffer,
      level,
      kind: 'image',
      code,
      originalFilename: file.name,
      contentType,
    });

    return NextResponse.json({
      ok: true,
      url: uploaded.publicUrl,
      objectKey: uploaded.objectKey,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload gambar gagal.';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
