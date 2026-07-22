import { describe, expect, test } from 'bun:test';
import { getKanaChartData, VOWEL_HEADERS } from '@/features/kana/lib/kana-data';
import { kanaAudioPath } from '@/features/kana/lib/kana-asset-paths';
import {
  isKanaVocabFallbackImage,
  KANA_VOCAB_IMAGE_BY_KEY,
  resolveKanaVocabImageSrc,
} from '@/features/kana/lib/kana-vocab-images';

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

  test('vocab images use curated Unsplash URLs matching meaning', () => {
    const ame = getKanaChartData('hiragana').characters.find((c) => c.romaji === 'a');
    const aisu = getKanaChartData('katakana').characters.find((c) => c.romaji === 'a');
    expect(ame?.vocabularies[0]?.imageSrc).toContain('images.unsplash.com');
    expect(aisu?.vocabularies[0]?.imageSrc).toContain('images.unsplash.com');
    expect(ame?.vocabularies[0]?.imageSrc).not.toContain('/assets/kana/');
    expect(ame?.vocabularies[0]?.imageSrc).not.toBe(aisu?.vocabularies[0]?.imageSrc);
  });

  test('hiragana to (jam) uses clock image not Japan fallback', () => {
    const to = getKanaChartData('hiragana').characters.find((c) => c.romaji === 'to');
    expect(to?.vocabularies[0]?.meaning.toLowerCase()).toBe('jam');
    expect(to?.vocabularies[0]?.imageSrc).toContain('photo-1501139083538');
    expect(isKanaVocabFallbackImage(to?.vocabularies[0]?.imageSrc ?? '')).toBe(false);
  });

  test('no curated vocab key resolves to Japan fallback Fuji image', () => {
    const fallbackHits = Object.entries(KANA_VOCAB_IMAGE_BY_KEY).filter(([, src]) =>
      isKanaVocabFallbackImage(src),
    );
    expect(fallbackHits).toEqual([]);
  });

  test('resolveKanaVocabImageSrc prefers exact key over fallback', () => {
    const src = resolveKanaVocabImageSrc({
      script: 'hiragana',
      romaji: 'to',
      reading: 'tokei',
      meaning: 'jam',
      word: 'とけい',
    });
    expect(src).toContain('photo-1501139083538');
  });

  test('kana character audio uses shared public/assets/kana-audio files', () => {
    expect(kanaAudioPath('hiragana', 'a', 'あ')).toBe('/assets/kana-audio/a.mp3');
    expect(kanaAudioPath('katakana', 'a', 'ア')).toBe('/assets/kana-audio/a.mp3');
    expect(kanaAudioPath('hiragana', 'ka', 'か')).toBe('/assets/kana-audio/ka.mp3');
  });

  test('gojuon grid rows have five columns', () => {
    const gojuon = getKanaChartData('katakana').sections[0];
    for (const row of gojuon.grid) {
      expect(row).toHaveLength(5);
    }
  });
});
