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
    expect(chart.characters.length).toBeGreaterThan(80);
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
