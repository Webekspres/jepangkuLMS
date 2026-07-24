import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/features/admin-cms/lib/require-admin-action';
import {
  TRYOUT_AUDIO_MAX_BYTES,
  resolveTryoutAudioMimeType,
  uploadPaketChokaiMasterAudio,
  uploadTryoutChokaiAudio,
} from '@/lib/media/tryout-audio';
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
    const questionSetId = String(formData.get('questionSetId') ?? '').trim();

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ ok: false, message: 'File audio wajib diunggah.' }, { status: 400 });
    }

    if (file.size > TRYOUT_AUDIO_MAX_BYTES) {
      return NextResponse.json(
        { ok: false, message: 'Ukuran file maksimal 15 MB.' },
        { status: 400 },
      );
    }

    const contentType = resolveTryoutAudioMimeType(file);
    if (!contentType) {
      return NextResponse.json(
        { ok: false, message: 'Format tidak didukung. Gunakan file .mp3 saja.' },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (questionSetId) {
      const set = await prisma.jlptQuestionSet.findUnique({
        where: { id: questionSetId },
        select: { id: true, code: true },
      });
      if (!set) {
        return NextResponse.json({ ok: false, message: 'Paket tidak ditemukan.' }, { status: 404 });
      }
      const uploaded = await uploadPaketChokaiMasterAudio({
        buffer,
        originalName: file.name,
        contentType,
        packageCode: set.code,
        questionSetId: set.id,
      });
      return NextResponse.json({
        ok: true,
        url: uploaded.url,
        objectKey: uploaded.objectKey,
      });
    }

    const uploaded = await uploadTryoutChokaiAudio(buffer, file.name, contentType);
    return NextResponse.json({
      ok: true,
      url: uploaded.url,
      objectKey: uploaded.objectKey,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload audio gagal.';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
