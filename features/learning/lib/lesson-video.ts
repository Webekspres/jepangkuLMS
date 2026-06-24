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
  url: string | null;
} {
  const trimmed = videoUrl?.trim();
  return { url: trimmed || null };
}

export function getYouTubeThumbnailUrl(
  videoId: string,
  quality: 'maxresdefault' | 'hqdefault' = 'hqdefault',
): string {
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}

/** Build Vidstack YouTube src with privacy-oriented embed params. */
export function toVidstackYouTubeSrc(
  videoId: string,
  options?: { origin?: string },
): `youtube/${string}` {
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    iv_load_policy: '3',
    disablekb: '1',
  });
  if (options?.origin) {
    params.set('origin', options.origin);
  }
  return `youtube/${videoId}?${params.toString()}` as `youtube/${string}`;
}
