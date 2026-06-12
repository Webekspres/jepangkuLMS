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

const YouTubeQualityContext = createContext<YouTubeQualityContextValue | null>(null);

function getYouTubeIframe(provider: unknown): HTMLIFrameElement | null {
  if (!provider || !isYouTubeProvider(provider)) return null;
  const iframe = (provider as { iframe?: HTMLIFrameElement }).iframe;
  return iframe ?? null;
}

export function LessonYouTubeQualityProvider({ children }: { children: ReactNode }) {
  const provider = useMediaProvider();
  const started = useMediaState('started');
  const [availableLevels, setAvailableLevels] = useState<string[]>([]);
  const [selectedQuality, setSelectedQuality] = useState('auto');
  const [trackedIframe, setTrackedIframe] = useState<HTMLIFrameElement | null>(null);

  const iframe = useMemo(() => getYouTubeIframe(provider), [provider]);

  if (iframe !== trackedIframe) {
    setTrackedIframe(iframe);
    if (!iframe) {
      setAvailableLevels([]);
      setSelectedQuality('auto');
    }
  }

  useEffect(() => {
    if (!iframe) return;

    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframe.contentWindow) return;

      const info = parseYouTubeInfoDelivery(event.data);
      if (!info?.availableQualityLevels?.length) return;

      setAvailableLevels(sortYouTubeQualities(info.availableQualityLevels));
    };

    window.addEventListener('message', onMessage);

    const syncQualities = () => requestYouTubeQualityInfo(iframe);
    syncQualities();

    const intervalId = window.setInterval(syncQualities, 3000);

    return () => {
      window.removeEventListener('message', onMessage);
      window.clearInterval(intervalId);
    };
  }, [iframe]);

  useEffect(() => {
    if (started && iframe) {
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

  return <YouTubeQualityContext.Provider value={value}>{children}</YouTubeQualityContext.Provider>;
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
