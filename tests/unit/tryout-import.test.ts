import { describe, expect, test } from 'bun:test';
import {
    normalizeTryoutSection,
    composeTryoutQuestionText,
    extractAudioUrlFromQuestionText,
    sortTryoutExamQuestions,
    assignTryoutExamNumbers,
    isTryoutSectionAccessible,
} from '@/features/admin-cms/lib/tryout-sections';
import { validateTryoutImportRecords } from '@/features/admin-cms/lib/import-tryout-tryout-rows';

describe('tryout sections', () => {
    test('normalizeTryoutSection maps aliases', () => {
        expect(normalizeTryoutSection('Moji-Goi')).toBe('MOJI_GOI');
        expect(normalizeTryoutSection('bunpou dokkai')).toBe('BUNPOU_DOKKAI');
        expect(normalizeTryoutSection('CHOKAI')).toBe('CHOKAI');
        expect(normalizeTryoutSection('invalid')).toBeNull();
    });

    test('audio marker roundtrip', () => {
        const text = composeTryoutQuestionText('Pertanyaan?', 'https://x.com/a.mp3');
        const parsed = extractAudioUrlFromQuestionText(text);
        expect(parsed.audioUrl).toBe('https://x.com/a.mp3');
        expect(parsed.body).toBe('Pertanyaan?');
    });

    test('sortTryoutExamQuestions orders by JLPT section then sortOrder', () => {
        const input = [
            { id: 'c', section: 'CHOKAI', sortOrder: 1 },
            { id: 'm2', section: 'MOJI_GOI', sortOrder: 2 },
            { id: 'b', section: 'BUNPOU_DOKKAI', sortOrder: 1 },
            { id: 'm1', section: 'MOJI_GOI', sortOrder: 1 },
        ];
        const sorted = assignTryoutExamNumbers(sortTryoutExamQuestions(input));
        expect(sorted.map((q) => q.id)).toEqual(['m1', 'm2', 'b', 'c']);
        expect(sorted.map((q) => q.examNumber)).toEqual([1, 2, 3, 4]);
    });

    test('isTryoutSectionAccessible gates later sections', () => {
        const questions = [
            { id: 'm1', section: 'MOJI_GOI' },
            { id: 'm2', section: 'MOJI_GOI' },
            { id: 'b1', section: 'BUNPOU_DOKKAI' },
        ];
        expect(isTryoutSectionAccessible('MOJI_GOI', questions, {})).toBe(true);
        expect(isTryoutSectionAccessible('BUNPOU_DOKKAI', questions, {})).toBe(false);
        expect(isTryoutSectionAccessible('BUNPOU_DOKKAI', questions, { m1: 'a', m2: 'b' })).toBe(
            true,
        );
    });
});

describe('tryout import parser', () => {
    test('validates flat section rows', () => {
        const records = [
            {
                section: 'MOJI_GOI',
                questiontext: 'Soal 1',
                explanation: 'Exp',
                options: 'A\nB\nC\nD',
                correctoptionindex: '2',
            },
        ];
        const { validRows, errors } = validateTryoutImportRecords(records);
        expect(errors).toHaveLength(0);
        expect(validRows).toHaveLength(1);
        expect(validRows[0]?.correctIndex).toBe(1);
    });

    test('reports invalid correct index', () => {
        const records = [
            { section: 'MOJI_GOI', questiontext: 'Q', options: 'A\nB', correctoptionindex: '9' },
        ];
        const { errors } = validateTryoutImportRecords(records);
        expect(errors.length).toBeGreaterThan(0);
    });
});
