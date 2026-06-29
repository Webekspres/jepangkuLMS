import { prisma } from '@/lib/prisma';
import { mapLmsBadgeRarityToDisplay } from '@/lib/lms/badge-rarity';
import { resolveMediaUrl } from '@/lib/media/image-src';
import type { StudentAchievementBadge } from '@/features/student/lib/core-badge-mapper';
import type { LmsBadgeUnlockRule } from '@prisma/client';

const UNLOCK_RULE_LABELS: Record<LmsBadgeUnlockRule, string> = {
    MANUAL: 'Diberikan admin',
    FIRST_LESSON: 'Selesaikan pelajaran pertama',
    FIRST_QUIZ: 'Selesaikan kuis pertama',
    TRYOUT_PASS: 'Lulus tryout JLPT',
    QUIZ_SCORE_THRESHOLD: 'Skor kuis minimum',
    CATEGORY_COMPLETE: 'Selesaikan kategori materi',
    TRYOUT_SCORE_THRESHOLD: 'Skor tryout minimum',
    SPECIFIC_COURSE_COMPLETE: 'Selesaikan kursus spesifik',
};

function formatBadgeDate(date: Date): string {
    try {
        return new Intl.DateTimeFormat('id-ID', { month: 'short', year: 'numeric' }).format(date);
    } catch {
        return date.toISOString();
    }
}

function requirementLabel(
    rule: LmsBadgeUnlockRule,
    unlockValue: number | null,
    requirementText: string | null,
    targetLevel?: string | null,
    targetCategory?: string | null,
    targetCourseTitle?: string | null,
): string {
    if (requirementText?.trim()) return requirementText.trim();
    if (rule === 'TRYOUT_PASS' || rule === 'TRYOUT_SCORE_THRESHOLD') {
        const levelStr = targetLevel ? ` ${targetLevel}` : '';
        return `Lulus simulasi JLPT${levelStr} (skor ≥ ${unlockValue ?? 60}%)`;
    }
    if (rule === 'QUIZ_SCORE_THRESHOLD') {
        const levelStr = targetLevel ? ` ${targetLevel}` : '';
        return `Skor kuis${levelStr} ≥ ${unlockValue ?? 60}%`;
    }
    if (rule === 'CATEGORY_COMPLETE') {
        const levelStr = targetLevel ? ` ${targetLevel}` : '';
        const catStr = targetCategory ? ` ${targetCategory}` : '';
        return `Selesaikan seluruh materi${catStr}${levelStr}`;
    }
    if (rule === 'SPECIFIC_COURSE_COMPLETE') {
        return `Selesaikan kursus: ${targetCourseTitle ?? 'Kursus Terpilih'}`;
    }
    return UNLOCK_RULE_LABELS[rule];
}

/** Katalog badge LMS + status unlock user. */
export async function loadLmsBadgesForUser(
    userId: string,
    equippedBadgeId?: string | null,
): Promise<StudentAchievementBadge[]> {
    const [catalog, unlocked, user] = await Promise.all([
        prisma.lmsBadge.findMany({
            orderBy: { sortOrder: 'asc' },
            include: { targetCourse: { select: { title: true } } },
        }),
        prisma.userBadge.findMany({
            where: { userId },
            include: { badge: true },
        }),
        prisma.user.findUnique({
            where: { id: userId },
            select: { equippedBadgeId: true },
        }),
    ]);

    const activeEquippedId = equippedBadgeId ?? user?.equippedBadgeId ?? null;

    if (catalog.length === 0) return [];

    const unlockedByBadgeId = new Map(unlocked.map((row) => [row.badgeId, row]));

    return catalog.map((badge) => {
        const userBadge = unlockedByBadgeId.get(badge.id);
        return {
            id: badge.id,
            code: badge.code,
            name: badge.title,
            desc: badge.description ?? '',
            imageUrl: resolveMediaUrl(badge.imageUrl) ?? '',
            icon: '🏅',
            xp: badge.xpBonus,
            unlocked: Boolean(userBadge),
            date: userBadge ? formatBadgeDate(userBadge.unlockedAt) : null,
            rarity: mapLmsBadgeRarityToDisplay(badge.rarity),
            badgeType: 'LMS',
            requirementText: requirementLabel(
                badge.unlockRule,
                badge.unlockValue,
                badge.requirementText,
                badge.targetLevel,
                badge.targetCategory,
                badge.targetCourse?.title,
            ),
            isEquipped: activeEquippedId === badge.id,
        };
    });
}

export async function equipLmsBadge(userId: string, badgeId: string): Promise<boolean> {
    const owned = await prisma.userBadge.findUnique({
        where: { userId_badgeId: { userId, badgeId } },
    });
    if (!owned) return false;

    await prisma.user.update({
        where: { id: userId },
        data: { equippedBadgeId: badgeId },
    });
    return true;
}

export async function clearEquippedBadge(userId: string): Promise<void> {
    await prisma.user.update({
        where: { id: userId },
        data: { equippedBadgeId: null },
    });
}
