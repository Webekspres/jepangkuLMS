'use client';

import { useEffect, useMemo, useRef } from 'react';
import ReactPlayer from 'react-player';
import { trackAnalyticsEvent } from '@/lib/analytics/events';
import { cn } from '@/lib/utils';
import {
  extractYouTubeVideoId,
  getYouTubeWatchUrl,
} from '@/features/learning/lib/lesson-video';

export type LessonYoutubePlayerProps = {
  title: string;
  isDemo?: boolean;
  /** Pause saat tab bukan video — player tetap mounted (hidden). */
  isActive?: boolean;
  /** Direct YouTube id (preferred for secured playback). */
  videoId?: string;
  /** Legacy URL — avoid in student workspace; use API + videoId instead. */
  videoUrl?: string;
  secured?: boolean;
  lessonId?: string;
};

function blockProtectedShortcuts(event: KeyboardEvent) {
  const key = event.key.toLowerCase();
  if ((event.ctrlKey || event.metaKey) && (key === 's' || key === 'p' || key === 'u')) {
    event.preventDefault();
  }
}

/** youtube-video-element omits clipboard-write on the iframe allow list. */
function patchYoutubeIframeClipboard(root: ParentNode | null) {
  if (!root) return;
  for (const host of root.querySelectorAll('youtube-video')) {
    const iframe = host.shadowRoot?.querySelector('iframe');
    if (!iframe) continue;
    const current = iframe.getAttribute('allow') ?? '';
    if (current.includes('clipboard-write')) continue;
    iframe.setAttribute('allow', current ? `${current}; clipboard-write` : 'clipboard-write');
  }
}

function safePause(player: HTMLVideoElement | null) {
  if (!player) return;
  try {
    const result = player.pause();
    if (result && typeof (result as Promise<void>).catch === 'function') {
      void (result as Promise<void>).catch(() => undefined);
    }
  } catch {
    // Player may not be ready yet (CSP/load race).
  }
}

export function LessonYoutubePlayer({
  videoUrl,
  videoId: videoIdProp,
  title,
  isDemo = false,
  isActive = true,
  secured = false,
  lessonId,
}: LessonYoutubePlayerProps) {
  const playerRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const resolvedVideoId =
    videoIdProp ?? (videoUrl ? extractYouTubeVideoId(videoUrl) : null);

  const appOrigin =
    typeof window !== 'undefined' ? window.location.origin : undefined;

  const src = useMemo(
    () => (resolvedVideoId ? getYouTubeWatchUrl(resolvedVideoId) : null),
    [resolvedVideoId],
  );

  const config = useMemo(
    () => ({
      youtube: {
        rel: 0 as const,
        disablekb: 1 as const,
        iv_load_policy: 3 as const,
        ...(appOrigin ? { origin: appOrigin } : {}),
      },
    }),
    [appOrigin],
  );

  useEffect(() => {
    const player = playerRef.current;
    return () => {
      safePause(player);
    };
  }, []);

  useEffect(() => {
    if (isActive) return;
    safePause(playerRef.current);
  }, [isActive]);

  useEffect(() => {
    if (!secured) return;
    const onContextMenu = (event: MouseEvent) => event.preventDefault();
    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('keydown', blockProtectedShortcuts);
    return () => {
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('keydown', blockProtectedShortcuts);
    };
  }, [secured]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !resolvedVideoId) return;

    const patch = () => patchYoutubeIframeClipboard(container);
    patch();

    const observer = new MutationObserver(patch);
    observer.observe(container, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [resolvedVideoId]);

  const handlePlay = () => {
    if (!lessonId) return;
    trackAnalyticsEvent('lesson_video_play', { lesson_id: lessonId });
  };

  if (!resolvedVideoId || !src) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-2xl border border-border bg-muted/30 px-6 text-center text-sm text-muted-foreground">
        URL video tidak valid — periksa link YouTube di CMS.
      </div>
    );
  }

  return (
    <div className="space-y-2 sm:space-y-3">
      <div
        className={cn(
          'overflow-hidden rounded-2xl border border-border bg-black shadow-md',
          secured && 'select-none',
        )}
        onContextMenu={secured ? (event) => event.preventDefault() : undefined}
      >
        <div
          ref={containerRef}
          className="relative aspect-video max-h-[min(70vh,720px)] w-full"
        >
          <ReactPlayer
            key={resolvedVideoId}
            ref={playerRef}
            src={src}
            title={title}
            controls
            playsInline
            pip={false}
            width="100%"
            height="100%"
            style={{ position: 'absolute', inset: 0 }}
            config={config}
            onPlay={handlePlay}
            onError={() => {
              // YouTube iframe errors surface as DOM Events — avoid unhandled rejections in dev overlay.
            }}
          />
        </div>
      </div>

      {secured ? (
        <p className="text-center text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
          Video dilindungi — hanya untuk siswa terdaftar. Jangan bagikan rekaman layar.
        </p>
      ) : null}

      {isDemo ? (
        <p className="text-center text-[11px] leading-relaxed text-muted-foreground sm:text-xs md:text-sm">
          Menampilkan video contoh dari YouTube — materi final akan diganti tim kurikulum.
        </p>
      ) : null}
    </div>
  );
}
