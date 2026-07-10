import { describe, expect, test } from 'bun:test';
import {
  isManagedJlptBankObjectKey,
  normalizeJlptBankObjectKey,
  trackReplacedJlptBankKey,
} from '@/lib/media/jlpt-bank-r2-cleanup';

describe('jlpt-bank-r2-cleanup', () => {
  test('normalizeJlptBankObjectKey trims and rejects empty', () => {
    expect(normalizeJlptBankObjectKey('  jlpt-bank/N5/audio/x.mp3  ')).toBe(
      'jlpt-bank/N5/audio/x.mp3',
    );
    expect(normalizeJlptBankObjectKey(null)).toBeNull();
    expect(normalizeJlptBankObjectKey('   ')).toBeNull();
  });

  test('isManagedJlptBankObjectKey only accepts jlpt-bank prefix', () => {
    expect(isManagedJlptBankObjectKey('jlpt-bank/N5/images/a/hash.png')).toBe(true);
    expect(isManagedJlptBankObjectKey('tryouts/chokai/x.mp3')).toBe(false);
    expect(isManagedJlptBankObjectKey('avatars/u/1.png')).toBe(false);
  });

  test('trackReplacedJlptBankKey records managed keys when value changes', () => {
    const bucket: string[] = [];
    trackReplacedJlptBankKey(
      bucket,
      'jlpt-bank/N5/stem-images/Q1/abc.png',
      'jlpt-bank/N5/stem-images/Q1/def.png',
    );
    expect(bucket).toEqual(['jlpt-bank/N5/stem-images/Q1/abc.png']);

    trackReplacedJlptBankKey(bucket, 'jlpt-bank/N5/stem-images/Q1/def.png', null);
    expect(bucket).toEqual([
      'jlpt-bank/N5/stem-images/Q1/abc.png',
      'jlpt-bank/N5/stem-images/Q1/def.png',
    ]);

    trackReplacedJlptBankKey(bucket, 'tryouts/chokai/x.mp3', null);
    expect(bucket).toHaveLength(2);
  });
});
