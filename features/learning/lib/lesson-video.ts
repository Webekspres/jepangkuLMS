/** Video demo sementara — dipakai jika lesson belum punya `videoUrl` di DB. */
export const DEMO_LESSON_VIDEO_URL =
  'https://www.youtube.com/watch?v=jBCc-hmVZho';

export function extractYouTubeVideoId(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  const embedMatch = trimmed.match(/youtube\.com\/embed\/([^?&/]+)/);
  if (embedMatch) return embedMatch[1];

  const watchMatch = trimmed.match(/[?&]v=([^&]+)/);
  if (watchMatch) return watchMatch[1];

  const shortMatch = trimmed.match(/youtu\.be\/([^?&/]+)/);
  if (shortMatch) return shortMatch[1];

  return null;
}

export function resolveLessonVideoUrl(videoUrl: string | null | undefined): {
  url: string;
  isDemo: boolean;
} {
  const trimmed = videoUrl?.trim();
  if (trimmed) return { url: trimmed, isDemo: false };
  return { url: DEMO_LESSON_VIDEO_URL, isDemo: true };
}

export function getYouTubeThumbnailUrl(
  videoId: string,
  quality: 'maxresdefault' | 'hqdefault' = 'hqdefault',
): string {
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}

/** Format sumber resmi Vidstack untuk provider YouTube. */
export function toVidstackYouTubeSrc(videoId: string): `youtube/${string}` {
  return `youtube/${videoId}`;
}
