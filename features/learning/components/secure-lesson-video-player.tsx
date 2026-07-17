'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';
import { trackAnalyticsEvent } from '@/lib/analytics/events';

export type SecureLessonVideoPlayerProps = {
  lessonId: string;
  title: string;
  isActive?: boolean;
};

type VideoPayload = {
  videoId: string;
  title: string;
};

const LessonYoutubePlayer = dynamic(
  () =>
    import('@/features/learning/components/lesson-youtube-player').then(
      (mod) => mod.LessonYoutubePlayer,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex aspect-video max-h-[min(70vh,720px)] items-center justify-center rounded-2xl border border-border bg-black/90">
        <p className="text-sm text-muted-foreground">Memuat pemutar video…</p>
      </div>
    ),
  },
);

export function SecureLessonVideoPlayer({
  lessonId,
  title,
  isActive = true,
}: SecureLessonVideoPlayerProps) {
  const [payload, setPayload] = useState<VideoPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function loadVideo() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/learning/lesson-video?lessonId=${encodeURIComponent(lessonId)}`,
          { cache: 'no-store', signal: controller.signal },
        );
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? `HTTP ${response.status}`);
        }
        const data = (await response.json()) as VideoPayload;
        if (!cancelled) {
          setPayload(data);
          trackAnalyticsEvent('lesson_video_unlocked', {
            lesson_id: lessonId,
          });
        }
      } catch (err) {
        if (cancelled || (err instanceof DOMException && err.name === 'AbortError')) return;
        setPayload(null);
        setError(err instanceof Error ? err.message : 'Gagal memuat video');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadVideo();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [lessonId]);

  if (loading) {
    return (
      <div className="flex aspect-video max-h-[min(70vh,720px)] items-center justify-center rounded-2xl border border-border bg-muted/30">
        <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
        <span className="sr-only">Memuat video terproteksi…</span>
      </div>
    );
  }

  if (error || !payload) {
    return (
      <div className="flex aspect-video max-h-[min(70vh,720px)] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-muted/20 px-6 text-center">
        <ShieldAlert className="size-8 text-muted-foreground" aria-hidden />
        <p className="text-sm font-medium text-foreground">Video tidak tersedia</p>
        <p className="text-xs text-muted-foreground">
          {error === 'not_enrolled'
            ? 'Akses video hanya untuk siswa dengan enrollment aktif.'
            : 'Periksa enrollment kamu atau hubungi admin jika masalah berlanjut.'}
        </p>
      </div>
    );
  }

  return (
    <LessonYoutubePlayer
      videoId={payload.videoId}
      title={title || payload.title}
      isActive={isActive}
      secured
      lessonId={lessonId}
    />
  );
}
