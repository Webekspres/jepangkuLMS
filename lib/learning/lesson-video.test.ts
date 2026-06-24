import { describe, expect, test } from 'bun:test';
import { extractYouTubeVideoId } from '@/features/learning/lib/lesson-video';

describe('extractYouTubeVideoId', () => {
  test('parses watch URL', () => {
    expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
      'dQw4w9WgXcQ',
    );
  });

  test('parses youtu.be URL', () => {
    expect(extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });
});

describe('toVidstackYouTubeSrc privacy params', () => {
  test('includes modestbranding and disablekb', async () => {
    const { toVidstackYouTubeSrc } = await import('@/features/learning/lib/lesson-video');
    const src = toVidstackYouTubeSrc('abc123', { origin: 'https://kursus.jepangku.com' });
    expect(src).toContain('youtube/abc123?');
    expect(src).toContain('modestbranding=1');
    expect(src).toContain('disablekb=1');
    expect(src).toContain('origin=https%3A%2F%2Fkursus.jepangku.com');
  });
});
