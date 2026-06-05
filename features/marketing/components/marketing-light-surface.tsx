import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  LANDING_HERO_COLOR_BAND_GRADIENT,
  LANDING_HERO_COLOR_BAND_GRID_STYLE,
  LANDING_HERO_GRID_STYLE,
} from './landing-data';

type MarketingLightSurfaceProps = {
  children: ReactNode;
  /** Wrapper luar (section / footer) */
  className?: string;
  /** Area konten di atas lapisan dekoratif */
  contentClassName?: string;
  /** Pita pastel di bagian bawah — gaya hero */
  gradientBand?: boolean;
  /** Kurva bawah seperti hero landing */
  roundedBottom?: boolean;
  /** Kartu tertutup dengan border (CTA, footer) */
  contained?: boolean;
  /** Pita gradien di atas (footer) */
  gradientTop?: boolean;
};

export function MarketingLightSurface({
  children,
  className,
  contentClassName,
  gradientBand = true,
  roundedBottom = false,
  contained = false,
  gradientTop = false,
}: MarketingLightSurfaceProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-background',
        roundedBottom && 'rounded-b-[3rem] sm:rounded-b-[4rem] lg:rounded-b-[5rem]',
        contained &&
          'rounded-3xl border border-border/70 shadow-[0_20px_60px_-24px_rgba(15,23,42,0.18)] sm:rounded-[2.5rem]',
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={LANDING_HERO_GRID_STYLE}
      />

      {gradientTop && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[min(28%,160px)] overflow-hidden">
          <div
            className="absolute inset-0"
            style={{ backgroundImage: LANDING_HERO_COLOR_BAND_GRADIENT }}
          />
          <div
            className="absolute inset-0 opacity-45"
            style={LANDING_HERO_COLOR_BAND_GRID_STYLE}
          />
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent via-60% to-background/95" />
        </div>
      )}

      {gradientBand && (
        <div
          className={cn(
            'pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden',
            contained
              ? 'h-[min(55%,220px)] sm:h-[min(50%,240px)]'
              : 'h-[min(32%,230px)] sm:h-[min(34%,250px)]',
            (roundedBottom || contained) && 'rounded-b-[inherit]',
          )}
        >
          <div
            className="absolute inset-0"
            style={{ backgroundImage: LANDING_HERO_COLOR_BAND_GRADIENT }}
          />
          <div
            className="absolute inset-0 opacity-50"
            style={LANDING_HERO_COLOR_BAND_GRID_STYLE}
          />
          <div className="absolute inset-x-0 top-0 h-px bg-white/70" />
          <div className="absolute inset-0 bg-linear-to-t from-transparent via-transparent via-65% to-background/92" />
        </div>
      )}

      <div className={cn('relative', contentClassName)}>{children}</div>
    </div>
  );
}
