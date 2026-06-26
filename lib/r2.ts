import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { R2_OBJECT_CACHE_CONTROL } from '@/lib/media/constants';
import { getR2Config, isR2EnvConfigured } from '@/lib/r2-config';

const r2Config = getR2Config();

const s3Client = isR2EnvConfigured()
    ? new S3Client({
        region: 'auto',
        credentials: {
            accessKeyId: r2Config.accessKeyId,
            secretAccessKey: r2Config.secretAccessKey,
        },
        endpoint: `https://${r2Config.accountId}.r2.cloudflarestorage.com`,
    })
    : null;

export function isR2Configured(): boolean {
    return s3Client != null;
}

export async function uploadToR2(
    file: Buffer,
    fileName: string,
    contentType: string,
): Promise<string> {
    if (!s3Client) {
        throw new Error(
            'R2 belum dikonfigurasi. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY (atau R2_ACCESS_KEY_SECRET), R2_BUCKET (atau R2_BUCKET_NAME), dan R2_PUBLIC_URL di .env',
        );
    }

    const config = getR2Config();
    // Prepend 'lms/' to segment files within the shared bucket, avoiding root clutter
    const prefix = 'lms/';
    const key = fileName.startsWith(prefix) ? fileName : `${prefix}${fileName}`;

    try {
        await s3Client.send(
            new PutObjectCommand({
                Bucket: config.bucket,
                Key: key,
                Body: file,
                ContentType: contentType,
                CacheControl: R2_OBJECT_CACHE_CONTROL,
            }),
        );
    } catch (error) {
        const name = error instanceof Error ? error.name : '';
        if (name === 'AccessDenied') {
            throw new Error(
                'R2 Access Denied: token tidak punya izin tulis ke bucket ini. Periksa R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, dan R2_BUCKET — pastikan API token R2 punya permission Object Read & Write (atau Admin Read & Write) untuk bucket yang sama.',
            );
        }
        throw error;
    }

    const publicUrl = config.publicUrl.replace(/\/$/, '');
    if (!publicUrl) {
        throw new Error('R2_PUBLIC_URL wajib di-set agar URL asset bisa diakses publik.');
    }
    return `${publicUrl}/${key}`;
}

export async function deleteFromR2(fileName: string): Promise<void> {
    if (!s3Client) return;

    const config = getR2Config();
    const prefix = 'lms/';
    const key = fileName.startsWith(prefix) ? fileName : `${prefix}${fileName}`;

    await s3Client.send(
        new DeleteObjectCommand({
            Bucket: config.bucket,
            Key: key,
        }),
    );
}

/** Rewrite legacy pub-*.r2.dev host to current R2_PUBLIC_URL (DB may still store old bucket URL). */
export function normalizeR2PublicUrl(url: string | null | undefined): string | null {
    if (!url?.trim()) return null;
    const trimmed = url.trim();
    const publicUrl = getR2Config().publicUrl.replace(/\/$/, '');
    if (!publicUrl) return trimmed;

    try {
        const parsed = new URL(trimmed);
        if (!parsed.hostname.endsWith('.r2.dev')) return trimmed;
        const currentHost = new URL(publicUrl).hostname;
        if (parsed.hostname === currentHost) return trimmed;
        return `${publicUrl}${parsed.pathname}${parsed.search}`;
    } catch {
        return trimmed;
    }
}

export function extractR2KeyFromUrl(imageUrl: string | null | undefined): string | null {
    const normalized = normalizeR2PublicUrl(imageUrl);
    if (!normalized) return null;

    const config = getR2Config();
    const publicUrl = config.publicUrl.replace(/\/$/, '');
    let key: string | null = null;

    if (publicUrl && normalized.startsWith(publicUrl)) {
        key = normalized.slice(publicUrl.length + 1);
    } else {
        try {
            const parsed = new URL(normalized);
            if (parsed.hostname.endsWith('.r2.dev')) {
                key = parsed.pathname.replace(/^\//, '');
            }
        } catch {
            return null;
        }
    }

    if (!key) return null;

    // Strip 'lms/' prefix if present to keep compatibility with downstream checks (e.g. key.startsWith('avatars/'))
    const prefix = 'lms/';
    if (key.startsWith(prefix)) {
        key = key.slice(prefix.length);
    }
    return key;
}
