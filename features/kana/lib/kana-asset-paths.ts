import type { KanaScript } from './kana-types';

const KANA_ASSET_BASE = '/assets/kana';
/** Shared character pronunciation clips (hiragana + katakana use the same romaji file). */
const KANA_CHARACTER_AUDIO_BASE = '/assets/kana-audio';

/** Romaji collisions + yoon J filenames in public/assets/kana-audio/. */
const KANA_AUDIO_FILE_BY_CHAR: Record<string, string> = {
  'ぢ': 'ji (di).mp3',
  'ヂ': 'ji (di).mp3',
  'づ': 'zu (du).mp3',
  'ヅ': 'zu (du).mp3',
  'じゃ': 'jya.mp3',
  'じゅ': 'jyu.mp3',
  'じょ': 'jyo.mp3',
  'ジャ': 'jya.mp3',
  'ジュ': 'jyu.mp3',
  'ジョ': 'jyo.mp3',
};

export function resolveKanaAudioFilename(romaji: string, char: string): string {
  return KANA_AUDIO_FILE_BY_CHAR[char] ?? `${romaji}.mp3`;
}

export function kanaAudioPath(_script: KanaScript, romaji: string, char: string): string {
  const filename = resolveKanaAudioFilename(romaji, char);
  return `${KANA_CHARACTER_AUDIO_BASE}/${encodeURIComponent(filename)}`;
}

export function kanaStrokeGifPath(script: KanaScript, romaji: string): string {
  return `${KANA_ASSET_BASE}/${script}/strokes/${romaji}.gif`;
}

export function kanaStrokeStepPath(script: KanaScript, romaji: string, step: number): string {
  return `${KANA_ASSET_BASE}/${script}/strokes/${romaji}-step-${step}.png`;
}

export function kanaVocabImagePath(script: KanaScript, romaji: string, index: number): string {
  return `${KANA_ASSET_BASE}/${script}/vocab/${romaji}/${String(index).padStart(2, '0')}-image.webp`;
}

export function kanaVocabAudioPath(script: KanaScript, romaji: string, index: number): string {
  return `${KANA_ASSET_BASE}/${script}/vocab/${romaji}/${String(index).padStart(2, '0')}-audio.mp3`;
}
