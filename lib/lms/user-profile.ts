import { prisma } from '@/lib/prisma';
import { userAnchorCreateData } from '@/lib/auth/sync-user-anchor';
import { isGenericLmsDisplayName, resolvePublicDisplayName } from '@/lib/lms/display-name';
import {
    uploadToR2,
    deleteFromR2,
    extractR2KeyFromUrl,
    isR2Configured,
    normalizeR2PublicUrl,
} from '@/lib/r2';
import { BADGE_IMAGE_MAX_BYTES, BADGE_IMAGE_MIME_TYPES } from '@/lib/media/constants';

const DISPLAY_NAME_MIN = 2;
const DISPLAY_NAME_MAX = 32;
const DISPLAY_NAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} _.-]*$/u;
const BIO_MAX = 280;
const PHONE_MAX = 20;

export function normalizeLmsPhone(value: string): string {
    return value.replace(/[\s().-]/g, '').trim();
}

export function formatLmsPhoneForStorage(value: string): string {
    return normalizeLmsPhone(value);
}

export function validateLmsPhone(value: string): string | null {
    const normalized = normalizeLmsPhone(value);
    if (!normalized) return 'Nomor ponsel wajib diisi.';
    // E.164-ish: optional +, then 8–15 digits (bebas negara).
    if (!/^\+?[0-9]{8,15}$/.test(normalized)) {
        return 'Format nomor tidak valid. Contoh: 08123456789, +628123456789, atau +819012345678.';
    }
    if (normalized.length > PHONE_MAX) {
        return `Nomor ponsel maksimal ${PHONE_MAX} karakter.`;
    }
    return null;
}

export function validateLmsBio(value: string): string | null {
    const trimmed = value.trim();
    if (trimmed.length === 0) return null;
    if (trimmed.length > BIO_MAX) {
        return `Bio maksimal ${BIO_MAX} karakter.`;
    }
    return null;
}

export function validateLmsDisplayName(value: string): string | null {
    const trimmed = value.trim();
    if (trimmed.length < DISPLAY_NAME_MIN || trimmed.length > DISPLAY_NAME_MAX) {
        return `Nama tampilan harus ${DISPLAY_NAME_MIN}–${DISPLAY_NAME_MAX} karakter.`;
    }
    if (!DISPLAY_NAME_PATTERN.test(trimmed)) {
        return 'Nama hanya boleh huruf, angka, spasi, titik, strip, dan underscore.';
    }
    return null;
}

export type LmsUserProfile = {
    displayName: string | null;
    ssoDisplayName: string | null;
    displayNameSetupAt: Date | null;
    phone: string | null;
    phoneSetupAt: Date | null;
    placementPromptDismissedAt: Date | null;
    bio: string | null;
    avatarUrl: string | null;
    equippedBadgeId: string | null;
    role: 'LMS_STUDENT' | 'LMS_ADMIN';
};

export async function loadLmsUserProfile(userId: string): Promise<LmsUserProfile | null> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            displayName: true,
            ssoDisplayName: true,
            displayNameSetupAt: true,
            phone: true,
            phoneSetupAt: true,
            placementPromptDismissedAt: true,
            bio: true,
            avatarUrl: true,
            equippedBadgeId: true,
            role: true,
        },
    });
    if (!user) return null;
    return {
        displayName: user.displayName,
        ssoDisplayName: user.ssoDisplayName,
        displayNameSetupAt: user.displayNameSetupAt,
        phone: user.phone,
        phoneSetupAt: user.phoneSetupAt,
        placementPromptDismissedAt: user.placementPromptDismissedAt,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        equippedBadgeId: user.equippedBadgeId,
        role: user.role,
    };
}

/** Nama tampilan LMS — prioritas DB lokal, fallback SSO/Clerk. */
export async function resolveLmsDisplayName(
    userId: string,
    fallback?: string | null,
    email?: string | null,
): Promise<string> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { displayName: true, ssoDisplayName: true },
    });

    return resolvePublicDisplayName({
        displayName: user?.displayName,
        ssoDisplayName: user?.ssoDisplayName ?? fallback,
        email,
    });
}

/** Avatar LMS — prioritas DB lokal, fallback Clerk. */
export async function resolveLmsAvatarUrl(
    userId: string,
    clerkFallback?: string | null,
): Promise<string | null> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { avatarUrl: true },
    });
    const local = user?.avatarUrl?.trim();
    if (local) return normalizeR2PublicUrl(local) ?? local;
    return clerkFallback?.trim() || null;
}

export type ResolvedLmsProfilePresentation = {
    displayName: string;
    avatarUrl: string | null;
};

/** Display name + avatar for nav shells — LMS local first, Clerk fallback. */
export async function loadResolvedLmsProfilePresentation(
    userId: string,
    clerkFallback?: { displayName?: string | null; imageUrl?: string | null },
): Promise<ResolvedLmsProfilePresentation> {
    const clerkName = clerkFallback?.displayName?.trim() || null;
    const displayName =
        (await resolveLmsDisplayName(userId, clerkName)) ?? clerkName ?? 'Pengguna';
    const avatarUrl = await resolveLmsAvatarUrl(userId, clerkFallback?.imageUrl ?? null);

    return { displayName, avatarUrl };
}

export async function updateLmsDisplayName(userId: string, displayName: string): Promise<void> {
    const error = validateLmsDisplayName(displayName);
    if (error) throw new Error(error);

    const trimmed = displayName.trim();
    const storedDisplayName = isGenericLmsDisplayName(trimmed) ? null : trimmed;

    await prisma.user.upsert({
        where: { id: userId },
        create: userAnchorCreateData(userId, {
            displayName: storedDisplayName ?? undefined,
            displayNameSetupAt: new Date(),
        }),
        update: {
            displayName: storedDisplayName,
            displayNameSetupAt: new Date(),
        },
    });
}

export async function completeLmsDisplayNameSetup(
    userId: string,
    displayName: string,
): Promise<void> {
    await updateLmsDisplayName(userId, displayName);
}

export async function updateLmsAvatarFromUpload(
    userId: string,
    file: Buffer,
    mimeType: string,
): Promise<string> {
    if (!isR2Configured()) {
        throw new Error(
            'R2 belum dikonfigurasi. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL di .env.',
        );
    }
    if (file.length > BADGE_IMAGE_MAX_BYTES) {
        throw new Error('Ukuran foto maksimal 2 MB.');
    }
    if (!BADGE_IMAGE_MIME_TYPES.includes(mimeType as (typeof BADGE_IMAGE_MIME_TYPES)[number])) {
        throw new Error('Format foto harus PNG, JPEG, atau WebP.');
    }

    const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
    const key = `avatars/${userId}/${Date.now()}.${ext}`;

    const existing = await prisma.user.findUnique({
        where: { id: userId },
        select: { avatarUrl: true },
    });
    const oldKey = extractR2KeyFromUrl(existing?.avatarUrl);
    if (oldKey?.startsWith('avatars/')) {
        await deleteFromR2(oldKey).catch(() => undefined);
    }

    const avatarUrl = await uploadToR2(file, key, mimeType);

    await prisma.user.upsert({
        where: { id: userId },
        create: userAnchorCreateData(userId, { avatarUrl }),
        update: { avatarUrl },
    });

    return avatarUrl;
}

export async function updateLmsBio(userId: string, bio: string): Promise<void> {
    const error = validateLmsBio(bio);
    if (error) throw new Error(error);

    const trimmed = bio.trim();
    await prisma.user.upsert({
        where: { id: userId },
        create: userAnchorCreateData(userId, { bio: trimmed || null }),
        update: { bio: trimmed || null },
    });
}

export async function updateLmsPhone(userId: string, phone: string): Promise<void> {
    const error = validateLmsPhone(phone);
    if (error) throw new Error(error);

    const stored = formatLmsPhoneForStorage(phone);
    await prisma.user.upsert({
        where: { id: userId },
        create: userAnchorCreateData(userId, { phone: stored, phoneSetupAt: new Date() }),
        update: {
            phone: stored,
            phoneSetupAt: new Date(),
        },
    });
}

export async function completeLmsPhoneSetup(userId: string, phone: string): Promise<void> {
    await updateLmsPhone(userId, phone);
}

export async function updateUserLmsRole(
    userId: string,
    role: 'LMS_STUDENT' | 'LMS_ADMIN',
): Promise<void> {
    await prisma.user.update({
        where: { id: userId },
        data: { role },
    });
}
