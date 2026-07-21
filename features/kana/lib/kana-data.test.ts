import { describe, expect, test } from 'bun:test';
import { getKanaChartData, VOWEL_HEADERS } from '@/features/kana/lib/kana-data';
import { kanaAudioPath } from '@/features/kana/lib/kana-asset-paths';

describe('kana-data', () => {
  test('hiragana gojuon has expected vowel headers', () => {
    expect(VOWEL_HEADERS).toEqual(['a', 'i', 'u', 'e', 'o']);
  });

  test('hiragana chart includes gojuon, dakuten, and yoon sections', () => {
    const chart = getKanaChartData('hiragana');
    expect(chart.sections.map((s) => s.id)).toEqual(['gojuon', 'dakuten', 'yoon']);
    expect(chart.characters.length).toBe(104);
  });

  test('katakana chart has 104 characters from Asset N5 sheet', () => {
    expect(getKanaChartData('katakana').characters.length).toBe(104);
  });

  test('stroke GIF URLs come from Excel Link GIF (mistval)', () => {
    const a = getKanaChartData('hiragana').characters.find((c) => c.char === 'あ');
    const A = getKanaChartData('katakana').characters.find((c) => c.char === 'ア');
    expect(a?.strokeGifSrc).toContain('3042.gif');
    expect(A?.strokeGifSrc).toContain('30a2.gif');
  });

  test('hiragana a vocab comes from sheet Contoh Kata', () => {
    const a = getKanaChartData('hiragana').characters.find((c) => c.romaji === 'a');
    expect(a?.vocabularies[0]?.word).toBe('あめ');
    expect(a?.vocabularies[0]?.meaning.toLowerCase()).toContain('hujan');
  });

  test('kana audio path follows convention', () => {
    expect(kanaAudioPath('hiragana', 'a')).toBe('/assets/kana/hiragana/audio/a.mp3');
  });

  test('gojuon grid rows have five columns', () => {
    const gojuon = getKanaChartData('katakana').sections[0];
    for (const row of gojuon.grid) {
      expect(row).toHaveLength(5);
    }
  });
});
