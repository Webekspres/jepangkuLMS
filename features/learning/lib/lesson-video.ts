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

/** Privacy-oriented YouTube watch URL (embeds via youtube-nocookie.com). */
export function getYouTubeWatchUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/watch?v=${encodeURIComponent(videoId)}`;
}
