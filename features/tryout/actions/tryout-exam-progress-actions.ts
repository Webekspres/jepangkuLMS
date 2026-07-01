'use server';

import { requireAuthUserWithAnchor } from '@/lib/auth/require-auth-user';
import { prisma } from '@/lib/prisma';

export type TryoutExamProgressState = {
    answers: Record<string, string>;
    playedAudioKeys: string[];
};

function parseProgressJson(raw: string): TryoutExamProgressState {
    try {
        const parsed = JSON.parse(raw) as Partial<TryoutExamProgressState>;
        return {
            answers: parsed.answers && typeof parsed.answers === 'object' ? parsed.answers : {},
            playedAudioKeys: Array.isArray(parsed.playedAudioKeys)
                ? parsed.playedAudioKeys.filter((k) => typeof k === 'string')
                : [],
        };
    } catch {
        return { answers: {}, playedAudioKeys: [] };
    }
}

export async function getOrCreateTryoutExamProgress(
    sessionId: string,
): Promise<{ id: string; state: TryoutExamProgressState }> {
    const userId = await requireAuthUserWithAnchor();

    const existing = await prisma.tryoutExamProgress.findUnique({
        where: {
            userId_tryoutSessionId: { userId, tryoutSessionId: sessionId },
        },
    });

    if (existing) {
        return { id: existing.id, state: parseProgressJson(existing.answersJson) };
    }

    const created = await prisma.tryoutExamProgress.create({
        data: {
            userId,
            tryoutSessionId: sessionId,
            answersJson: JSON.stringify({ answers: {}, playedAudioKeys: [] } satisfies TryoutExamProgressState),
        },
    });

    return { id: created.id, state: { answers: {}, playedAudioKeys: [] } };
}

export async function saveTryoutExamProgressState(
    progressId: string,
    state: TryoutExamProgressState,
): Promise<{ ok: true } | { ok: false; message: string }> {
    const userId = await requireAuthUserWithAnchor();

    const row = await prisma.tryoutExamProgress.findFirst({
        where: { id: progressId, userId },
    });
    if (!row) return { ok: false, message: 'Progress tidak ditemukan.' };

    await prisma.tryoutExamProgress.update({
        where: { id: progressId },
        data: { answersJson: JSON.stringify(state) },
    });

    return { ok: true };
}

export async function markTryoutAudioPlayed(
    progressId: string,
    playKey: string,
): Promise<{ ok: true; playedAudioKeys: string[] } | { ok: false; message: string }> {
    const userId = await requireAuthUserWithAnchor();

    const row = await prisma.tryoutExamProgress.findFirst({
        where: { id: progressId, userId },
    });
    if (!row) return { ok: false, message: 'Progress tidak ditemukan.' };

    const state = parseProgressJson(row.answersJson);
    if (!state.playedAudioKeys.includes(playKey)) {
        state.playedAudioKeys.push(playKey);
        await prisma.tryoutExamProgress.update({
            where: { id: progressId },
            data: { answersJson: JSON.stringify(state) },
        });
    }

    return { ok: true, playedAudioKeys: state.playedAudioKeys };
}

export async function loadTryoutExamProgressForSession(
    sessionId: string,
): Promise<{ id: string; state: TryoutExamProgressState } | null> {
    const userId = await requireAuthUserWithAnchor();

    const row = await prisma.tryoutExamProgress.findUnique({
        where: {
            userId_tryoutSessionId: { userId, tryoutSessionId: sessionId },
        },
    });

    if (!row) return null;
    return { id: row.id, state: parseProgressJson(row.answersJson) };
}

export async function clearTryoutExamProgress(sessionId: string): Promise<void> {
    const userId = await requireAuthUserWithAnchor();
    await prisma.tryoutExamProgress.deleteMany({
        where: { userId, tryoutSessionId: sessionId },
    });
}
