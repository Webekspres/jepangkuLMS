import type { KanaScript } from './kana-types';

const KANA_ASSET_BASE = '/assets/kana';

export function kanaAudioPath(script: KanaScript, romaji: string): string {
  return `${KANA_ASSET_BASE}/${script}/audio/${romaji}.mp3`;
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
