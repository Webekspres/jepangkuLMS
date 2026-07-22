import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'bun:test';
import { getKanaChartData } from '@/features/kana/lib/kana-data';
import {
  kanaAudioPath,
  resolveKanaAudioFilename,
} from '@/features/kana/lib/kana-asset-paths';
import { KANA_MANIFEST } from '@/features/kana/lib/kana-manifest.generated';

const AUDIO_DIR = join(import.meta.dir, '../../../public/assets/kana-audio');

function audioFileExists(audioSrc: string): boolean {
  const encoded = audioSrc.replace('/assets/kana-audio/', '');
  const filename = decodeURIComponent(encoded);
  return existsSync(join(AUDIO_DIR, filename));
}

describe('kana-audio', () => {
  test('resolveKanaAudioFilename handles ji/zu collisions and yoon J', () => {
    expect(resolveKanaAudioFilename('ji', 'じ')).toBe('ji.mp3');
    expect(resolveKanaAudioFilename('ji', 'ぢ')).toBe('ji (di).mp3');
    expect(resolveKanaAudioFilename('ji', 'ジ')).toBe('ji.mp3');
    expect(resolveKanaAudioFilename('ji', 'ヂ')).toBe('ji (di).mp3');
    expect(resolveKanaAudioFilename('zu', 'ず')).toBe('zu.mp3');
    expect(resolveKanaAudioFilename('zu', 'づ')).toBe('zu (du).mp3');
    expect(resolveKanaAudioFilename('ja', 'じゃ')).toBe('jya.mp3');
    expect(resolveKanaAudioFilename('ju', 'じゅ')).toBe('jyu.mp3');
    expect(resolveKanaAudioFilename('jo', 'じょ')).toBe('jyo.mp3');
  });

  test('kanaAudioPath encodes filenames with spaces', () => {
    expect(kanaAudioPath('hiragana', 'ji', 'ぢ')).toBe(
      '/assets/kana-audio/ji%20(di).mp3',
    );
    expect(kanaAudioPath('hiragana', 'zu', 'づ')).toBe(
      '/assets/kana-audio/zu%20(du).mp3',
    );
  });

  test('hiragana and katakana share the same audio file per romaji', () => {
    expect(kanaAudioPath('hiragana', 'a', 'あ')).toBe(kanaAudioPath('katakana', 'a', 'ア'));
    expect(kanaAudioPath('hiragana', 'ka', 'か')).toBe(kanaAudioPath('katakana', 'ka', 'カ'));
  });

  test('every manifest entry resolves to an existing mp3 on disk', () => {
    const missing: string[] = [];
    for (const entry of KANA_MANIFEST) {
      const src = kanaAudioPath(entry.script, entry.romaji, entry.char);
      if (!audioFileExists(src)) {
        missing.push(`${entry.script}:${entry.char} (${entry.romaji}) -> ${src}`);
      }
    }
    expect(missing).toEqual([]);
  });

  test('chart characters have unique ids and wired audioSrc', () => {
    const hiragana = getKanaChartData('hiragana');
    const katakana = getKanaChartData('katakana');

    for (const chart of [hiragana, katakana]) {
      const ids = chart.characters.map((c) => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    }

    const jiZ = hiragana.characters.find((c) => c.char === 'じ');
    const jiD = hiragana.characters.find((c) => c.char === 'ぢ');
    expect(jiZ?.audioSrc).toContain('ji.mp3');
    expect(jiD?.audioSrc).toContain('ji%20(di).mp3');
    expect(jiZ?.audioSrc).not.toBe(jiD?.audioSrc);

    const JiZ = katakana.characters.find((c) => c.char === 'ジ');
    const JiD = katakana.characters.find((c) => c.char === 'ヂ');
    expect(JiZ?.audioSrc).toContain('ji.mp3');
    expect(JiD?.audioSrc).toContain('ji%20(di).mp3');
  });
});
