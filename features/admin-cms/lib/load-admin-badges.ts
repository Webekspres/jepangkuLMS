import type { LmsBadgeRarity, LmsBadgeUnlockSource } from '@prisma/client';
import { resolvePublicDisplayName } from '@/lib/lms/display-name';
import { prisma } from '@/lib/prisma';
import { resolveMediaUrl } from '@/lib/media/image-src';

export type AdminBadgeRow = {
    id: string;
    code: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    sortOrder: number;
    rarity: LmsBadgeRarity;
    unlockCount: number;
    createdAt: Date;
};

export async function loadAdminBadges(): Promise<AdminBadgeRow[]> {
    const rows = await prisma.lmsBadge.findMany({
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        include: { _count: { select: { userBadges: true } } },
    });

    return rows.map((row) => ({
        id: row.id,
        code: row.code,
        title: row.title,
        description: row.description,
        imageUrl: resolveMediaUrl(row.imageUrl),
        sortOrder: row.sortOrder,
        rarity: row.rarity ?? 'COMMON',
        unlockCount: row._count.userBadges,
        createdAt: row.createdAt,
    }));
}

export async function loadAdminBadgeById(id: string) {
    return prisma.lmsBadge.findUnique({ where: { id } });
}

export type AdminBadgeUnlockRow = {
    id: string;
    userId: string;
    studentName: string;
    studentEmail: string | null;
    badgeId: string;
    badgeTitle: string;
    badgeCode: string;
    badgeImageUrl: string | null;
    rarity: LmsBadgeRarity;
    source: LmsBadgeUnlockSource;
    unlockedAt: Date;
};

export async function loadAdminBadgeUnlockHistory(): Promise<AdminBadgeUnlockRow[]> {
    const rows = await prisma.userBadge.findMany({
        orderBy: { unlockedAt: 'desc' },
        select: {
            id: true,
            userId: true,
            badgeId: true,
            source: true,
            unlockedAt: true,
            user: {
                select: { displayName: true, ssoDisplayName: true, ssoEmail: true },
            },
            badge: {
                select: { title: true, code: true, imageUrl: true, rarity: true },
            },
        },
    });

    return rows.map((row) => ({
        id: row.id,
        userId: row.userId,
        studentName: resolvePublicDisplayName({
            displayName: row.user.displayName,
            ssoDisplayName: row.user.ssoDisplayName,
        }),
        studentEmail: row.user.ssoEmail,
        badgeId: row.badgeId,
        badgeTitle: row.badge.title,
        badgeCode: row.badge.code,
        badgeImageUrl: resolveMediaUrl(row.badge.imageUrl),
        rarity: row.badge.rarity ?? 'COMMON',
        source: row.source,
        unlockedAt: row.unlockedAt,
    }));
}
