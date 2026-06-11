'use client';

import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';
import './lesson-vidstack-theme.css';

import {
  isYouTubeProvider,
  MediaPlayer,
  MediaProvider,
  Poster,
  type MediaProviderAdapter,
} from '@vidstack/react';
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
  type DefaultLayoutTranslations,
} from '@vidstack/react/player/layouts/default';
import {
  extractYouTubeVideoId,
  getYouTubeThumbnailUrl,
  toVidstackYouTubeSrc,
} from '@/features/learning/lib/lesson-video';

export type LessonVidstackPlayerProps = {
  videoUrl: string;
  title: string;
  isDemo?: boolean;
};

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

const ID_LAYOUT_TRANSLATIONS: DefaultLayoutTranslations = {
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
  if (provider && isYouTubeProvider(provider)) {
    provider.cookies = false;
  }
}

export function LessonVidstackPlayer({
  videoUrl,
  title,
  isDemo = false,
}: LessonVidstackPlayerProps) {
  const videoId = extractYouTubeVideoId(videoUrl);

  if (!videoId) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-2xl border border-border bg-muted/30 px-6 text-center text-sm text-muted-foreground">
        URL video tidak valid — periksa link YouTube di CMS.
      </div>
    );
  }

  const src = toVidstackYouTubeSrc(videoId);
  const poster = getYouTubeThumbnailUrl(videoId, 'maxresdefault');

  return (
    <div className="space-y-3">
      <div className="jepangku-vidstack-player overflow-hidden rounded-2xl border border-border shadow-md">
        <MediaPlayer
          key={src}
          title={title}
          src={src}
          playsInline
          load="visible"
          fullscreenOrientation="none"
          onProviderChange={onProviderChange}
        >
          <MediaProvider />
          <DefaultVideoLayout
            icons={defaultLayoutIcons}
            colorScheme="dark"
            playbackRates={PLAYBACK_RATES}
            translations={ID_LAYOUT_TRANSLATIONS}
          />
          <Poster className="vds-poster" src={poster} alt="" />
        </MediaPlayer>
      </div>

      {isDemo && (
        <p className="text-center text-xs text-muted-foreground">
          Menampilkan video contoh dari YouTube — materi final akan diganti tim kurikulum.
        </p>
      )}
    </div>
  );
}
