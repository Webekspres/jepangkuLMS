'use client';

import dynamic from 'next/dynamic';

export type LessonVideoPlayerProps = {
  videoUrl: string;
  title: string;
  isDemo?: boolean;
  isActive?: boolean;
};

/** YouTube player via react-player — client-only (iframe, bukan SSR). */
const LessonYoutubePlayer = dynamic(
  () =>
    import('@/features/learning/components/lesson-youtube-player').then(
      (mod) => mod.LessonYoutubePlayer,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex aspect-video items-center justify-center rounded-2xl border border-border bg-black/90">
        <p className="text-sm text-muted-foreground">Memuat pemutar video…</p>
      </div>
    ),
  },
);

export function LessonVideoPlayer(props: LessonVideoPlayerProps) {
  return <LessonYoutubePlayer {...props} />;
}
