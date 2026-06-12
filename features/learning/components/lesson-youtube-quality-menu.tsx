'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { isYouTubeProvider, Menu, useMediaProvider, useMediaState } from '@vidstack/react';
import {
  DefaultMenuButton,
  DefaultMenuRadioGroup,
  defaultLayoutIcons,
} from '@vidstack/react/player/layouts/default';
import {
  buildYouTubeQualityOptions,
  parseYouTubeInfoDelivery,
  requestYouTubeQualityInfo,
  setYouTubePlaybackQuality,
  sortYouTubeQualities,
} from '@/features/learning/lib/youtube-playback-quality';

type YouTubeQualityContextValue = {
  iframe: HTMLIFrameElement | null;
  availableLevels: string[];
  selectedQuality: string;
  setSelectedQuality: (quality: string) => void;
};

const EMPTY_QUALITY_CONTEXT: YouTubeQualityContextValue = {
  iframe: null,
  availableLevels: [],
  selectedQuality: 'auto',
  setSelectedQuality: () => undefined,
};

const YouTubeQualityContext = createContext<YouTubeQualityContextValue | null>(null);

function getYouTubeIframe(provider: unknown): HTMLIFrameElement | null {
  if (!provider || !isYouTubeProvider(provider)) return null;
  const iframe = (provider as { iframe?: HTMLIFrameElement }).iframe;
  return iframe ?? null;
}

function YouTubeQualityTracker({
  iframe,
  started,
  children,
}: {
  iframe: HTMLIFrameElement;
  started: boolean;
  children: ReactNode;
}) {
  const [availableLevels, setAvailableLevels] = useState<string[]>([]);
  const [selectedQuality, setSelectedQuality] = useState('auto');

  useEffect(() => {
    let active = true;

    const onMessage = (event: MessageEvent) => {
      if (!active || event.source !== iframe.contentWindow) return;

      const info = parseYouTubeInfoDelivery(event.data);
      if (!info?.availableQualityLevels?.length) return;

      setAvailableLevels(sortYouTubeQualities(info.availableQualityLevels));
    };

    window.addEventListener('message', onMessage);

    const syncQualities = () => {
      if (active) requestYouTubeQualityInfo(iframe);
    };
    syncQualities();

    const intervalId = window.setInterval(syncQualities, 3000);

    return () => {
      active = false;
      window.removeEventListener('message', onMessage);
      window.clearInterval(intervalId);
    };
  }, [iframe]);

  useEffect(() => {
    if (started) {
      requestYouTubeQualityInfo(iframe);
    }
  }, [started, iframe]);

  const value = useMemo(
    () => ({
      iframe,
      availableLevels,
      selectedQuality,
      setSelectedQuality,
    }),
    [iframe, availableLevels, selectedQuality],
  );

  return (
    <YouTubeQualityContext.Provider value={value}>{children}</YouTubeQualityContext.Provider>
  );
}

export function LessonYouTubeQualityProvider({ children }: { children: ReactNode }) {
  const provider = useMediaProvider();
  const started = useMediaState('started');
  const iframe = useMemo(() => getYouTubeIframe(provider), [provider]);

  if (!iframe) {
    return (
      <YouTubeQualityContext.Provider value={EMPTY_QUALITY_CONTEXT}>
        {children}
      </YouTubeQualityContext.Provider>
    );
  }

  return (
    <YouTubeQualityTracker key={iframe.src} iframe={iframe} started={started}>
      {children}
    </YouTubeQualityTracker>
  );
}

export function LessonYouTubeQualityMenu() {
  const context = useContext(YouTubeQualityContext);
  const options = useMemo(
    () => buildYouTubeQualityOptions(context?.availableLevels ?? []),
    [context?.availableLevels],
  );

  if (!context?.iframe || options.length <= 1) return null;

  const { iframe, selectedQuality, setSelectedQuality } = context;

  return (
    <Menu.Root className="vds-quality-menu vds-menu">
      <DefaultMenuButton label="Kualitas" Icon={defaultLayoutIcons.Menu.QualityUp} />
      <Menu.Items className="vds-menu-items">
        <DefaultMenuRadioGroup
          value={selectedQuality}
          options={options}
          onChange={(quality) => {
            setSelectedQuality(quality);
            setYouTubePlaybackQuality(iframe, quality);
          }}
        />
      </Menu.Items>
    </Menu.Root>
  );
}
