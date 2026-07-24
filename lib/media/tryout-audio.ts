import { randomUUID } from 'crypto';
import { isR2Configured, uploadToR2 } from '@/lib/r2';
import { buildPaketChokaiMasterAudioKey } from '@/lib/media/tryout-chokai-r2-paths';

export const TRYOUT_AUDIO_MAX_BYTES = 15 * 1024 * 1024;
export const TRYOUT_AUDIO_ALLOWED_TYPES = new Set(['audio/mpeg', 'audio/mp3']);

const AUDIO_GROUP_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/;

export function sanitizeTryoutAudioGroupId(raw: string): string | null {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    if (!AUDIO_GROUP_ID_PATTERN.test(trimmed)) return null;
    return trimmed;
}

/** @deprecated Prefer buildPaketChokaiMasterAudioKey for paket CMS uploads. */
export function buildTryoutChokaiObjectKey(originalName: string): string {
    const base = originalName
        .replace(/\.[^.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48);
    const suffix = base || 'audio';
    return `tryouts/chokai/${randomUUID()}-${suffix}.mp3`;
}

export function buildTryoutChokaiMasterKey(sessionCode: string, audioId: string): string {
    const safeSession = sessionCode.replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 32);
    const safeId = audioId.replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 48);
    return `tryouts/chokai/masters/${safeSession}/${safeId}.mp3`;
}

export function buildTryoutChokaiClipKey(
    sessionCode: string,
    audioId: string,
    startSec: number,
    endSec: number,
): string {
    const safeSession = sessionCode.replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 32);
    const safeId = audioId.replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 40);
    const start = Math.round(startSec * 1000);
    const end = Math.round(endSec * 1000);
    return `tryouts/chokai/clips/${safeSession}/${safeId}-${start}-${end}.mp3`;
}

export function resolveTryoutAudioMimeType(file: File | { type: string; name: string }): string | null {
    const type = file.type.trim().toLowerCase();
    if (TRYOUT_AUDIO_ALLOWED_TYPES.has(type)) return 'audio/mpeg';
    if (file.name.toLowerCase().endsWith('.mp3')) return 'audio/mpeg';
    return null;
}

export async function uploadTryoutChokaiAudio(
    buffer: Buffer,
    originalName: string,
    contentType: string,
): Promise<{ url: string; objectKey: string }> {
    if (!isR2Configured()) {
        throw new Error(
            'R2 belum dikonfigurasi. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, dan R2_PUBLIC_URL di .env',
        );
    }

    const objectKey = buildTryoutChokaiObjectKey(originalName);
    const url = await uploadToR2(buffer, objectKey, contentType);
    return { url, objectKey };
}

export async function uploadPaketChokaiMasterAudio(input: {
    buffer: Buffer;
    originalName: string;
    contentType: string;
    packageCode: string;
    questionSetId: string;
}): Promise<{ url: string; objectKey: string }> {
    if (!isR2Configured()) {
        throw new Error(
            'R2 belum dikonfigurasi. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, dan R2_PUBLIC_URL di .env',
        );
    }

    const objectKey = buildPaketChokaiMasterAudioKey(
        input.packageCode,
        input.questionSetId,
        input.originalName,
    );
    const url = await uploadToR2(input.buffer, objectKey, input.contentType);
    return { url, objectKey };
}
