import { describe, expect, test } from 'bun:test';
import { shouldShowKanaFab } from './kana-fab-visibility';

describe('shouldShowKanaFab', () => {
  test('shows on dashboard hub pages', () => {
    expect(shouldShowKanaFab('/dashboard')).toBe(true);
    expect(shouldShowKanaFab('/dashboard/kursus')).toBe(true);
    expect(shouldShowKanaFab('/dashboard/kursus-saya')).toBe(true);
    expect(shouldShowKanaFab('/dashboard/live-class')).toBe(true);
    expect(shouldShowKanaFab('/dashboard/tryout')).toBe(true);
    expect(shouldShowKanaFab('/dashboard/tryout/riwayat')).toBe(true);
    expect(shouldShowKanaFab('/dashboard/leaderboard')).toBe(true);
    expect(shouldShowKanaFab('/dashboard/profil')).toBe(true);
    expect(shouldShowKanaFab('/dashboard/profil/edit')).toBe(true);
    expect(shouldShowKanaFab('/dashboard/achievements')).toBe(true);
  });

  test('shows on kana chart pages', () => {
    expect(shouldShowKanaFab('/dashboard/kana')).toBe(true);
    expect(shouldShowKanaFab('/dashboard/kana/hiragana')).toBe(true);
    expect(shouldShowKanaFab('/dashboard/kana/katakana')).toBe(true);
  });

  test('hides on detail / focus pages', () => {
    expect(shouldShowKanaFab('/dashboard/belajar/n5-grammar/kondisional')).toBe(false);
    expect(shouldShowKanaFab('/dashboard/kuis/lesson-slug')).toBe(false);
    expect(shouldShowKanaFab('/dashboard/kuis/lesson-slug/hasil')).toBe(false);
    expect(shouldShowKanaFab('/dashboard/kursus/n5-basic')).toBe(false);
    expect(shouldShowKanaFab('/dashboard/live-class/abc-123')).toBe(false);
    expect(shouldShowKanaFab('/dashboard/tryout/N5-SESSION')).toBe(false);
    expect(shouldShowKanaFab('/dashboard/tryout/hasil/attempt-1')).toBe(false);
  });
});
