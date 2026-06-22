import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/features/admin-cms/lib/require-admin-action';
import {
  TRYOUT_AUDIO_MAX_BYTES,
  resolveTryoutAudioMimeType,
  uploadTryoutChokaiAudio,
} from '@/lib/media/tryout-audio';

export async function POST(request: Request) {
  try {
    await requireAdminAccess();
  } catch {
    return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

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
    const url = await uploadTryoutChokaiAudio(buffer, file.name, contentType);

    return NextResponse.json({ ok: true, url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload audio gagal.';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
