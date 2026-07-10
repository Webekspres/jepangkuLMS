/**
 * Timestamp seek playback for Choukai masters (Phase 1).
 * Prefer CBR MP3 for accurate seeks on mobile Safari.
 */
export type StimulusAudioRange = {
  audioUrl: string;
  startMs: number;
  endMs: number | null;
};

export function resolveTryoutAudioPlayKey(input: {
  questionId: string;
  stimulusId?: string | null;
  /** @deprecated legacy */
  audioGroupId?: string | null;
}): string {
  if (input.stimulusId) return `stimulus:${input.stimulusId}`;
  if (input.audioGroupId) return `group:${input.audioGroupId}`;
  return `single:${input.questionId}`;
}

/** Clamp start into [0, duration); treat missing end as play-to-end. */
export function resolveSeekWindow(
  range: Pick<StimulusAudioRange, 'startMs' | 'endMs'>,
  durationSec: number | null | undefined,
): { startSec: number; endSec: number | null } {
  const startSec = Math.max(0, (range.startMs ?? 0) / 1000);
  let endSec = range.endMs != null ? range.endMs / 1000 : null;
  if (durationSec != null && Number.isFinite(durationSec) && durationSec > 0) {
    if (endSec == null) endSec = durationSec;
    endSec = Math.min(endSec, durationSec);
  }
  if (endSec != null && endSec <= startSec) {
    endSec = null;
  }
  return { startSec, endSec };
}

/**
 * Attach seek + stop-at-end behaviour to an HTMLAudioElement.
 * Returns a cleanup function that removes listeners.
 */
export function bindTimestampSeekPlayback(
  audio: HTMLAudioElement,
  range: Pick<StimulusAudioRange, 'startMs' | 'endMs'>,
  onEndedRange: () => void,
): () => void {
  let cleaned = false;
  const onLoaded = () => {
    const { startSec } = resolveSeekWindow(range, audio.duration);
    try {
      audio.currentTime = startSec;
    } catch {
      /* ignore seek errors until play */
    }
  };

  const onTimeUpdate = () => {
    const { endSec } = resolveSeekWindow(range, audio.duration);
    if (endSec == null) return;
    if (audio.currentTime >= endSec - 0.05) {
      audio.pause();
      onEndedRange();
    }
  };

  const onPlay = () => {
    const { startSec, endSec } = resolveSeekWindow(range, audio.duration);
    if (audio.currentTime < startSec || (endSec != null && audio.currentTime >= endSec)) {
      try {
        audio.currentTime = startSec;
      } catch {
        /* ignore */
      }
    }
  };

  audio.addEventListener('loadedmetadata', onLoaded);
  audio.addEventListener('timeupdate', onTimeUpdate);
  audio.addEventListener('play', onPlay);

  return () => {
    if (cleaned) return;
    cleaned = true;
    audio.removeEventListener('loadedmetadata', onLoaded);
    audio.removeEventListener('timeupdate', onTimeUpdate);
    audio.removeEventListener('play', onPlay);
  };
}
