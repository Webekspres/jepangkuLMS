import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/features/admin-cms/lib/require-admin-action';
import {
  JLPT_BANK_IMAGE_MAX_BYTES,
  resolveJlptBankImageMime,
  uploadJlptBankAsset,
} from '@/lib/media/jlpt-bank-assets';
import {
  TRYOUT_IMAGE_MAX_BYTES,
  uploadPaketChokaiMondaiImage,
} from '@/lib/media/tryout-chokai-image';
import { prisma } from '@/lib/prisma';

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
    const questionSetId = String(formData.get('questionSetId') ?? '').trim();
    const mondaiOrderRaw = String(formData.get('mondaiOrder') ?? '1').trim();
    const mondaiOrder = Math.max(1, Number.parseInt(mondaiOrderRaw, 10) || 1);

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ ok: false, message: 'File gambar wajib diunggah.' }, { status: 400 });
    }

    const contentType = resolveJlptBankImageMime({ type: file.type, name: file.name });
    if (!contentType) {
      return NextResponse.json(
        { ok: false, message: 'Format tidak didukung. Gunakan PNG, JPG, atau WebP.' },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (questionSetId) {
      if (file.size > TRYOUT_IMAGE_MAX_BYTES) {
        return NextResponse.json({ ok: false, message: 'Ukuran gambar maksimal 5 MB.' }, { status: 400 });
      }
      const set = await prisma.jlptQuestionSet.findUnique({
        where: { id: questionSetId },
        select: { id: true, code: true },
      });
      if (!set) {
        return NextResponse.json({ ok: false, message: 'Paket tidak ditemukan.' }, { status: 404 });
      }
      const uploaded = await uploadPaketChokaiMondaiImage({
        buffer,
        filename: file.name,
        packageCode: set.code,
        questionSetId: set.id,
        mondaiOrder,
      });
      return NextResponse.json({
        ok: true,
        url: uploaded.url,
        objectKey: uploaded.objectKey,
      });
    }

    if (file.size > JLPT_BANK_IMAGE_MAX_BYTES) {
      return NextResponse.json({ ok: false, message: 'Ukuran gambar maksimal 5 MB.' }, { status: 400 });
    }

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
