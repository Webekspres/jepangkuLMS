'use client';

import dynamic from 'next/dynamic';

export type LessonVideoPlayerProps = {
  videoUrl: string;
  title: string;
  isDemo?: boolean;
};

/**
 * Vidstack memakai Web Components + signals — harus client-only (bukan SSR).
 * Tanpa ini, React 19 / Next.js bisa throw: `this.$state[prop] is not a function`.
 */
const LessonVidstackPlayer = dynamic(
  () =>
    import('@/features/learning/components/lesson-vidstack-player').then(
      (mod) => mod.LessonVidstackPlayer,
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
  return <LessonVidstackPlayer {...props} />;
}
