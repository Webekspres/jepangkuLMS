import { describe, expect, test } from 'bun:test';
import {
  buildJlptCefrAnalysis,
  buildJlptOfficialSectionRows,
  resolveIndicatedCefr,
  scaleToJlptTotalScore,
  sectionGroupMinToPass,
} from '@/features/tryout/lib/jlpt-cefr-reference';

describe('jlpt-cefr-reference', () => {
  test('scaleToJlptTotalScore projects percent to 180', () => {
    expect(scaleToJlptTotalScore(9, 10)).toBe(162);
    expect(scaleToJlptTotalScore(0, 10)).toBe(0);
  });

  test('resolveIndicatedCefr maps N5 scores', () => {
    expect(resolveIndicatedCefr('N5', 79).cefr).toBeNull();
    expect(resolveIndicatedCefr('N5', 80).cefr).toBe('A1');
    expect(resolveIndicatedCefr('N5', 150).cefr).toBe('A1');
  });

  test('resolveIndicatedCefr maps N3 dual bands', () => {
    expect(resolveIndicatedCefr('N3', 94).cefr).toBeNull();
    expect(resolveIndicatedCefr('N3', 100).cefr).toBe('A2');
    expect(resolveIndicatedCefr('N3', 110).cefr).toBe('B1');
  });

  test('resolveIndicatedCefr maps N1 B2 and C1', () => {
    expect(resolveIndicatedCefr('N1', 120).cefr).toBe('B2');
    expect(resolveIndicatedCefr('N1', 150).cefr).toBe('C1');
  });

  test('sectionGroupMinToPass uses JLPT ratio', () => {
    expect(sectionGroupMinToPass(10, 19, 60)).toBe(4);
    expect(sectionGroupMinToPass(25, 38, 120)).toBe(8);
  });

  test('buildJlptOfficialSectionRows merges N5 language+reading', () => {
    const rows = buildJlptOfficialSectionRows('N5', [
      { section: 'MOJI_GOI', correct: 5, total: 10 },
      { section: 'BUNPOU_DOKKAI', correct: 3, total: 10 },
      { section: 'CHOKAI', correct: 4, total: 10 },
    ]);
    expect(rows).toHaveLength(2);
    expect(rows[0]?.label).toContain('Pengetahuan Bahasa');
    expect(rows[0]?.correct).toBe(8);
    expect(rows[0]?.total).toBe(20);
    expect(rows[1]?.label).toContain('Mendengarkan');
  });

  test('buildJlptCefrAnalysis requires total and sectional pass', () => {
    const analysis = buildJlptCefrAnalysis({
      level: 'N5',
      correct: 8,
      total: 10,
      sectionBreakdown: [
        { section: 'MOJI_GOI', correct: 4, total: 4 },
        { section: 'BUNPOU_DOKKAI', correct: 4, total: 4 },
        { section: 'CHOKAI', correct: 0, total: 2 },
      ],
    });
    expect(analysis.scaledTotalScore).toBe(144);
    expect(analysis.meetsJlptTotalPass).toBe(true);
    expect(analysis.meetsAllSectionalPass).toBe(false);
    expect(analysis.jlptPassOverall).toBe(false);
    expect(analysis.indicatedCefr).toBe('A1');
  });
});
