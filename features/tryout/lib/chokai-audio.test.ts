import { describe, expect, test } from 'bun:test';
import {
  resolveSeekWindow,
  resolveTryoutAudioPlayKey,
} from '@/features/tryout/lib/chokai-audio';

describe('resolveTryoutAudioPlayKey', () => {
  test('prefers stimulus id', () => {
    expect(
      resolveTryoutAudioPlayKey({
        questionId: 'q1',
        stimulusId: 'stim-1',
        audioGroupId: 'legacy',
      }),
    ).toBe('stimulus:stim-1');
  });

  test('falls back to group then single', () => {
    expect(resolveTryoutAudioPlayKey({ questionId: 'q1', audioGroupId: 'g1' })).toBe('group:g1');
    expect(resolveTryoutAudioPlayKey({ questionId: 'q1' })).toBe('single:q1');
  });
});

describe('resolveSeekWindow', () => {
  test('converts ms to seconds and clamps end to duration', () => {
    expect(resolveSeekWindow({ startMs: 1500, endMs: 90000 }, 60)).toEqual({
      startSec: 1.5,
      endSec: 60,
    });
  });

  test('null end uses duration when known', () => {
    expect(resolveSeekWindow({ startMs: 0, endMs: null }, 45)).toEqual({
      startSec: 0,
      endSec: 45,
    });
  });

  test('invalid end <= start clears end', () => {
    expect(resolveSeekWindow({ startMs: 5000, endMs: 4000 }, 60)).toEqual({
      startSec: 5,
      endSec: null,
    });
  });
});
