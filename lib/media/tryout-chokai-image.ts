import { randomUUID } from 'crypto';
import { isR2Configured, uploadToR2 } from '@/lib/r2';
import { buildPaketChokaiMondaiImageKey } from '@/lib/media/tryout-chokai-r2-paths';

export const TRYOUT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_EXT = new Set(['png', 'jpg', 'jpeg', 'webp']);

const MIME_BY_EXT: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
};

export function resolveTryoutImageMimeType(filename: string): string | null {
    const ext = filename.split('.').pop()?.toLowerCase() ?? '';
    return MIME_BY_EXT[ext] ?? null;
}

export function isAllowedTryoutImageName(filename: string): boolean {
    const ext = filename.split('.').pop()?.toLowerCase() ?? '';
    return ALLOWED_EXT.has(ext);
}

/** @deprecated Prefer buildPaketChokaiMondaiImageKey for paket CMS uploads. */
export function buildTryoutChokaiImageKey(folderSlug: string, filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() ?? 'png';
    const safe = folderSlug.replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 32);
    return `tryouts/chokai/images/${safe}-${randomUUID()}.${ext}`;
}

export async function uploadTryoutChokaiImage(
    buffer: Buffer,
    folderSlug: string,
    filename: string,
): Promise<string> {
    if (!isR2Configured()) {
        throw new Error(
            'R2 belum dikonfigurasi. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, dan R2_PUBLIC_URL di .env',
        );
    }
    const contentType = resolveTryoutImageMimeType(filename);
    if (!contentType) throw new Error(`Format gambar tidak didukung: ${filename}`);
    if (buffer.length > TRYOUT_IMAGE_MAX_BYTES) {
        throw new Error(`Gambar ${filename} melebihi 5 MB.`);
    }
    const objectKey = buildTryoutChokaiImageKey(folderSlug, filename);
    return uploadToR2(buffer, objectKey, contentType);
}

export async function uploadPaketChokaiMondaiImage(input: {
    buffer: Buffer;
    filename: string;
    packageCode: string;
    questionSetId: string;
    mondaiOrder: number;
}): Promise<{ url: string; objectKey: string }> {
    if (!isR2Configured()) {
        throw new Error(
            'R2 belum dikonfigurasi. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, dan R2_PUBLIC_URL di .env',
        );
    }
    const contentType = resolveTryoutImageMimeType(input.filename);
    if (!contentType) throw new Error(`Format gambar tidak didukung: ${input.filename}`);
    if (input.buffer.length > TRYOUT_IMAGE_MAX_BYTES) {
        throw new Error(`Gambar ${input.filename} melebihi 5 MB.`);
    }
    const objectKey = buildPaketChokaiMondaiImageKey(
        input.packageCode,
        input.questionSetId,
        input.mondaiOrder,
        input.filename,
    );
    const url = await uploadToR2(input.buffer, objectKey, contentType);
    return { url, objectKey };
}
