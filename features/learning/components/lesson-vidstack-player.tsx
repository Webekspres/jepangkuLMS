'use client';

import '@/lib/vidstack/suppress-provider-destroyed-rejection';

import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';
import './lesson-vidstack-theme.css';

import { useEffect, useRef } from 'react';
import {
  isYouTubeProvider,
  MediaPlayer,
  MediaProvider,
  Poster,
  type MediaPlayerInstance,
  type MediaProviderAdapter,
} from '@vidstack/react';
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
  type DefaultLayoutTranslations,
} from '@vidstack/react/player/layouts/default';
import {
  LessonYouTubeQualityMenu,
  LessonYouTubeQualityProvider,
} from '@/features/learning/components/lesson-youtube-quality-menu';
import {
  isIgnorableMediaError,
  safeMediaPromise,
} from '@/lib/vidstack/safe-media-operation';
import { trackAnalyticsEvent } from '@/lib/analytics/events';
import { cn } from '@/lib/utils';
import {
  extractYouTubeVideoId,
  getYouTubeThumbnailUrl,
  toVidstackYouTubeSrc,
} from '@/features/learning/lib/lesson-video';

export type LessonVidstackPlayerProps = {
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

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

const ID_LAYOUT_TRANSLATIONS: Partial<DefaultLayoutTranslations> = {
  Play: 'Putar',
  Pause: 'Jeda',
  Mute: 'Bisukan',
  Unmute: 'Nyalakan suara',
  'Enter Fullscreen': 'Layar penuh',
  'Exit Fullscreen': 'Keluar layar penuh',
  Settings: 'Pengaturan',
  Speed: 'Kecepatan',
  Quality: 'Kualitas',
  Auto: 'Otomatis',
  Captions: 'Subtitle',
  Off: 'Mati',
  Default: 'Default',
  'Seek Forward': 'Maju {seconds}s',
  'Seek Backward': 'Mundur {seconds}s',
};

function onProviderChange(provider: MediaProviderAdapter | null) {
  if (!provider) return;
  if (isYouTubeProvider(provider)) {
    provider.cookies = false;
  }
}

function onPlayFail(error: Error) {
  if (isIgnorableMediaError(error)) return;
  console.error('Video playback failed:', error);
}

function blockProtectedShortcuts(event: KeyboardEvent) {
  const key = event.key.toLowerCase();
  if ((event.ctrlKey || event.metaKey) && (key === 's' || key === 'p' || key === 'u')) {
    event.preventDefault();
  }
}

export function LessonVidstackPlayer({
  videoUrl,
  videoId: videoIdProp,
  title,
  isDemo = false,
  isActive = true,
  secured = false,
  lessonId,
}: LessonVidstackPlayerProps) {
  const playerRef = useRef<MediaPlayerInstance>(null);
  const resolvedVideoId =
    videoIdProp ?? (videoUrl ? extractYouTubeVideoId(videoUrl) : null);

  useEffect(() => {
    const player = playerRef.current;
    return () => {
      if (!player) return;
      safeMediaPromise(player.pause());
    };
  }, []);

  useEffect(() => {
    if (isActive) return;
    safeMediaPromise(playerRef.current?.pause());
  }, [isActive]);

  useEffect(() => {
    if (!secured) return;
    const player = playerRef.current;
    if (!player) return;

    const disablePiP = () => {
      const video = player.el?.querySelector('video');
      if (video) {
        try {
          video.disablePictureInPicture = true;
          video.setAttribute('controlsList', 'nodownload noplaybackrate');
        } catch {
          // ignore
        }
      }
    };

    disablePiP();
    const observer = new MutationObserver(disablePiP);
    if (player.el) {
      observer.observe(player.el, { childList: true, subtree: true });
    }
    return () => observer.disconnect();
  }, [secured, resolvedVideoId]);

  useEffect(() => {
    if (!lessonId) return;
    const player = playerRef.current;
    if (!player) return;
    return player.subscribe(({ paused }) => {
      if (!paused) {
        trackAnalyticsEvent('lesson_video_play', { lesson_id: lessonId });
      }
    });
  }, [lessonId, resolvedVideoId]);

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

  if (!resolvedVideoId) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-2xl border border-border bg-muted/30 px-6 text-center text-sm text-muted-foreground">
        URL video tidak valid — periksa link YouTube di CMS.
      </div>
    );
  }

  const appOrigin =
    typeof window !== 'undefined' ? window.location.origin : undefined;
  const src = toVidstackYouTubeSrc(resolvedVideoId, { origin: appOrigin });
  const poster = getYouTubeThumbnailUrl(resolvedVideoId, 'maxresdefault');

  return (
    <div className="space-y-2 sm:space-y-3">
      <div
        className={cn(
          'jepangku-vidstack-player rounded-2xl border border-border shadow-md',
          secured && 'jepangku-vidstack-player--secured',
        )}
        onContextMenu={secured ? (event) => event.preventDefault() : undefined}
      >
        <MediaPlayer
          // Force a full unmount/remount on video change instead of an in-place
          // provider swap — an in-place `src` swap leaves the old YouTube provider's
          // in-flight promises unresolved, which it then rejects with
          // "provider destroyed" (vidstack/player#1459, #1597).
          key={resolvedVideoId}
          ref={playerRef}
          title={title}
          src={src}
          playsInline
          load="visible"
          logLevel="error"
          fullscreenOrientation="none"
          onProviderChange={onProviderChange}
          onPlayFail={onPlayFail}
        >
          <LessonYouTubeQualityProvider>
            <MediaProvider />
            <DefaultVideoLayout
              icons={defaultLayoutIcons}
              colorScheme="dark"
              playbackRates={PLAYBACK_RATES}
              translations={ID_LAYOUT_TRANSLATIONS}
              noModal
              noGestures
              slots={{
                settingsMenuItemsStart: <LessonYouTubeQualityMenu />,
              }}
            />
            <Poster className="vds-poster" src={poster} alt="" />
          </LessonYouTubeQualityProvider>
        </MediaPlayer>
      </div>

      {secured ? (
        <p className="text-center text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
          Video dilindungi — hanya untuk siswa terdaftar. Jangan bagikan rekaman layar.
        </p>
      ) : null}

      {isDemo && (
        <p className="text-center text-[11px] leading-relaxed text-muted-foreground sm:text-xs md:text-sm">
          Menampilkan video contoh dari YouTube — materi final akan diganti tim kurikulum.
        </p>
      )}
    </div>
  );
}
