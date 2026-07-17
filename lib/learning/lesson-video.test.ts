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

describe('getYouTubeWatchUrl', () => {
  test('builds standard watch URL', async () => {
    const { getYouTubeWatchUrl } = await import('@/features/learning/lib/lesson-video');
    expect(getYouTubeWatchUrl('abc123')).toBe(
      'https://www.youtube-nocookie.com/watch?v=abc123',
    );
  });
});
