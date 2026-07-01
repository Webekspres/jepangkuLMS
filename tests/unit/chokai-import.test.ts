import { describe, expect, test } from 'bun:test';
import {
    normalizeChokaiAnswerOptionKind,
    parseChokaiTimeToSeconds,
    chokaiClipDedupeKey,
    resolveChokaiOptionImageFiles,
} from '@/features/admin-cms/lib/chokai-excel-columns';
import { resolveTryoutAudioPlayKey } from '@/features/tryout/lib/chokai-audio';

describe('chokai-excel-columns', () => {
    test('normalizeChokaiAnswerOptionKind', () => {
        expect(normalizeChokaiAnswerOptionKind('Teks')).toBe('TEXT');
        expect(normalizeChokaiAnswerOptionKind('gambar')).toBe('IMAGE');
        expect(normalizeChokaiAnswerOptionKind('')).toBeNull();
    });

    test('parseChokaiTimeToSeconds', () => {
        expect(parseChokaiTimeToSeconds('1:30')).toBe(90);
        expect(parseChokaiTimeToSeconds('45')).toBe(45);
        expect(parseChokaiTimeToSeconds('bad')).toBeNull();
    });

    test('chokaiClipDedupeKey', () => {
        expect(chokaiClipDedupeKey('a', 0, 30)).toContain('a');
    });

    test('resolveChokaiOptionImageFiles', () => {
        const files = resolveChokaiOptionImageFiles(new Set(['a.png', 'b.PNG', 'readme.txt']));
        expect(files.map((f) => f.letter)).toEqual(['A', 'B']);
    });
});

describe('chokai-audio play key', () => {
    test('group vs single', () => {
        expect(resolveTryoutAudioPlayKey({ questionId: 'q1', audioGroupId: 'set-a' })).toBe(
            'group:set-a',
        );
        expect(resolveTryoutAudioPlayKey({ questionId: 'q1', audioGroupId: null })).toBe('single:q1');
    });
});
