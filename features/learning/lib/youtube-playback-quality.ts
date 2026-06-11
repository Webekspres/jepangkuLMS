export type YouTubePlaybackQualityId =
  | 'auto'
  | 'tiny'
  | 'small'
  | 'medium'
  | 'large'
  | 'hd720'
  | 'hd1080'
  | 'highres'
  | 'max'
  | 'unknown';

const QUALITY_RANK: Record<string, number> = {
  highres: 7,
  max: 7,
  hd1080: 6,
  hd720: 5,
  large: 4,
  medium: 3,
  small: 2,
  tiny: 1,
  unknown: 0,
};

const QUALITY_LABELS: Record<string, string> = {
  auto: 'Otomatis',
  highres: '1440p+',
  max: 'Maksimum',
  hd1080: '1080p',
  hd720: '720p',
  large: '480p',
  medium: '360p',
  small: '240p',
  tiny: '144p',
  unknown: 'Tidak diketahui',
};

export function getYouTubeQualityLabel(quality: string) {
  return QUALITY_LABELS[quality] ?? quality.toUpperCase();
}

const RESERVED_QUALITY_IDS = new Set(['auto', 'unknown']);

export function sortYouTubeQualities(qualities: string[]) {
  const unique = [...new Set(qualities.filter((q) => q && !RESERVED_QUALITY_IDS.has(q)))];
  return unique.sort((a, b) => (QUALITY_RANK[b] ?? 0) - (QUALITY_RANK[a] ?? 0));
}

export function buildYouTubeQualityOptions(available: string[]) {
  const sorted = sortYouTubeQualities(available);
  const seen = new Set<string>(['auto']);

  return [
    { label: QUALITY_LABELS.auto, value: 'auto' },
    ...sorted
      .filter((quality) => {
        if (seen.has(quality)) return false;
        seen.add(quality);
        return true;
      })
      .map((quality) => ({
        label: getYouTubeQualityLabel(quality),
        value: quality,
      })),
  ];
}

type YouTubeIframeCommand = {
  event: 'command';
  func: string;
  args?: unknown[];
};

export function postYouTubeIframeCommand(
  iframe: HTMLIFrameElement,
  func: string,
  args: unknown[] = [],
) {
  const payload: YouTubeIframeCommand = { event: 'command', func, args };
  iframe.contentWindow?.postMessage(JSON.stringify(payload), '*');
}

export function requestYouTubeQualityInfo(iframe: HTMLIFrameElement) {
  postYouTubeIframeCommand(iframe, 'getAvailableQualityLevels');
  postYouTubeIframeCommand(iframe, 'getPlaybackQuality');
}

export function setYouTubePlaybackQuality(iframe: HTMLIFrameElement, quality: string) {
  postYouTubeIframeCommand(iframe, 'setPlaybackQuality', [quality]);
}

type YouTubeInfoDelivery = {
  event?: string;
  info?: {
    availableQualityLevels?: string[];
    playbackQuality?: string;
  };
};

export function parseYouTubeInfoDelivery(data: unknown): YouTubeInfoDelivery['info'] | null {
  if (!data) return null;

  let parsed: unknown = data;
  if (typeof data === 'string') {
    try {
      parsed = JSON.parse(data);
    } catch {
      return null;
    }
  }

  if (!parsed || typeof parsed !== 'object') return null;
  const message = parsed as YouTubeInfoDelivery;
  if (message.event !== 'infoDelivery' || !message.info) return null;
  return message.info;
}
