import { describe, expect, test } from 'bun:test';
import {
  buildPaketChokaiMasterAudioKey,
  buildPaketChokaiMondaiImageKey,
  buildPaketChokaiRoot,
  sanitizePaketChokaiCode,
} from '@/lib/media/tryout-chokai-r2-paths';
import {
  isManagedTryoutChokaiObjectKey,
  normalizeTryoutChokaiObjectKey,
  trackReplacedTryoutChokaiKey,
} from '@/lib/media/tryout-chokai-r2-cleanup';

describe('tryout-chokai-r2-paths', () => {
  test('sanitizePaketChokaiCode strips unsafe chars', () => {
    expect(sanitizePaketChokaiCode('N5 PKG/A')).toBe('N5-PKG-A');
    expect(sanitizePaketChokaiCode('***')).toBe('paket');
  });

  test('buildPaketChokaiRoot uses code--setId', () => {
    expect(buildPaketChokaiRoot('N5-PKG-A', 'abc-123-uuid')).toBe(
      'tryouts/chokai/N5-PKG-A--abc-123-uuid',
    );
  });

  test('buildPaketChokaiMasterAudioKey nests under audio/', () => {
    const key = buildPaketChokaiMasterAudioKey('N5-PKG-A', 'set1', 'master tape.mp3');
    expect(key.startsWith('tryouts/chokai/N5-PKG-A--set1/audio/')).toBe(true);
    expect(key.endsWith('.mp3')).toBe(true);
    expect(key.includes('master-tape')).toBe(true);
  });

  test('buildPaketChokaiMondaiImageKey nests under mondai-N/images/', () => {
    const key = buildPaketChokaiMondaiImageKey('N5-PKG-A', 'set1', 2, 'stem.png');
    expect(key).toMatch(
      /^tryouts\/chokai\/N5-PKG-A--set1\/mondai-2\/images\/[a-f0-9-]+\.png$/,
    );
  });
});

describe('tryout-chokai-r2-cleanup', () => {
  test('normalizeTryoutChokaiObjectKey trims and rejects empty', () => {
    expect(normalizeTryoutChokaiObjectKey('  tryouts/chokai/x.mp3  ')).toBe(
      'tryouts/chokai/x.mp3',
    );
    expect(normalizeTryoutChokaiObjectKey(null)).toBeNull();
    expect(normalizeTryoutChokaiObjectKey('   ')).toBeNull();
  });

  test('isManagedTryoutChokaiObjectKey accepts tryouts/chokai and jlpt-bank', () => {
    expect(isManagedTryoutChokaiObjectKey('tryouts/chokai/N5--id/audio/a.mp3')).toBe(true);
    expect(isManagedTryoutChokaiObjectKey('jlpt-bank/N5/images/a/hash.png')).toBe(true);
    expect(isManagedTryoutChokaiObjectKey('avatars/u/1.png')).toBe(false);
    expect(isManagedTryoutChokaiObjectKey('portal/news/x.png')).toBe(false);
  });

  test('trackReplacedTryoutChokaiKey records managed keys when value changes', () => {
    const bucket: string[] = [];
    trackReplacedTryoutChokaiKey(
      bucket,
      'tryouts/chokai/N5--id/audio/old.mp3',
      'tryouts/chokai/N5--id/audio/new.mp3',
    );
    expect(bucket).toEqual(['tryouts/chokai/N5--id/audio/old.mp3']);

    trackReplacedTryoutChokaiKey(bucket, 'jlpt-bank/N5/stem-images/Q1/abc.png', null);
    expect(bucket).toEqual([
      'tryouts/chokai/N5--id/audio/old.mp3',
      'jlpt-bank/N5/stem-images/Q1/abc.png',
    ]);

    trackReplacedTryoutChokaiKey(bucket, 'avatars/x.png', null);
    expect(bucket).toHaveLength(2);
  });
});
