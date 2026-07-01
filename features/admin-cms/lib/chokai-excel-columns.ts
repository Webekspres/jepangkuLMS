export type ChokaiAnswerOptionKind = 'TEXT' | 'IMAGE';

export function normalizeChokaiAnswerOptionKind(raw: string): ChokaiAnswerOptionKind | null {
    const key = raw.trim().toLowerCase();
    if (key === 'teks' || key === 'text') return 'TEXT';
    if (key === 'gambar' || key === 'image') return 'IMAGE';
    return null;
}

/** Parse MM:SS, M:SS, or plain seconds → seconds. */
export function parseChokaiTimeToSeconds(raw: string): number | null {
    const trimmed = raw.trim();
    if (!trimmed) return null;

    if (/^\d+(\.\d+)?$/.test(trimmed)) {
        const n = Number(trimmed);
        return Number.isFinite(n) && n >= 0 ? n : null;
    }

    const parts = trimmed.split(':').map((p) => p.trim());
    if (parts.length === 2) {
        const m = Number(parts[0]);
        const s = Number(parts[1]);
        if (Number.isInteger(m) && Number.isFinite(s) && m >= 0 && s >= 0) {
            return m * 60 + s;
        }
        return null;
    }
    if (parts.length === 3) {
        const h = Number(parts[0]);
        const m = Number(parts[1]);
        const s = Number(parts[2]);
        if ([h, m, s].every((n) => Number.isFinite(n) && n >= 0)) {
            return h * 3600 + m * 60 + s;
        }
    }
    return null;
}

export function formatChokaiTimeSeconds(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

export function chokaiClipDedupeKey(audioId: string, startSec: number, endSec: number): string {
    return `${audioId}::${startSec.toFixed(3)}::${endSec.toFixed(3)}`;
}

const OPTION_LETTERS = ['a', 'b', 'c', 'd'] as const;

export function resolveChokaiOptionImageFiles(
    filesInFolder: Set<string>,
): { letter: string; filename: string }[] {
    const lowerMap = new Map<string, string>();
    for (const f of filesInFolder) {
        lowerMap.set(f.toLowerCase(), f);
    }
    const found: { letter: string; filename: string }[] = [];
    for (const letter of OPTION_LETTERS) {
        for (const ext of ['png', 'jpg', 'jpeg', 'webp']) {
            const candidate = `${letter}.${ext}`;
            const actual = lowerMap.get(candidate);
            if (actual) {
                found.push({ letter: letter.toUpperCase(), filename: actual });
                break;
            }
        }
    }
    return found;
}

export const CHOKAI_DEFAULT_IMAGE_QUESTION_HINT =
    '音声を聞いて、正しいものを一つ選びなさい。';
