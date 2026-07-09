'use client';

import {
  COURSE_LEVELS,
  COURSE_TYPE_FILTERS,
  LEVEL_ACCENT,
  type CourseLevel,
  type CourseTypeFilter,
} from '@/features/learning/components/courses-data';
import { JLPT_ACCENT } from '@/features/marketing/components/landing-data';
import { cn } from '@/lib/utils';

const BADGE_BASE =
  'inline-flex shrink-0 cursor-pointer items-center rounded-full border px-4 py-1.5 text-sm font-semibold transition-all';
const BADGE_INACTIVE =
  'border-border bg-card/80 text-muted-foreground shadow-sm backdrop-blur-sm hover:bg-muted hover:text-foreground';
const BADGE_ACTIVE = 'border-transparent shadow-md';

type CourseCatalogFilterBarProps = {
  activeLevel: CourseLevel;
  onLevelChange: (level: CourseLevel) => void;
  activeType: CourseTypeFilter;
  onTypeChange: (type: CourseTypeFilter) => void;
  resultCount?: number;
  className?: string;
};

export function CourseCatalogFilterBar({
  activeLevel,
  onLevelChange,
  activeType,
  onTypeChange,
  resultCount,
  className,
}: CourseCatalogFilterBarProps) {
  return (
    <div className={cn('flex flex-col items-center gap-4 pb-8 pt-6', className)}>
      <div
        className="flex w-full flex-wrap justify-center gap-2"
        role="tablist"
        aria-label="Filter level JLPT"
      >
        {COURSE_LEVELS.map((level) => {
          const accent = level === 'Semua' ? null : JLPT_ACCENT[LEVEL_ACCENT[level]];
          const isActive = activeLevel === level;

          return (
            <button
              key={level}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onLevelChange(level)}
              className={cn(
                BADGE_BASE,
                isActive
                  ? level === 'Semua'
                    ? cn(BADGE_ACTIVE, 'bg-secondary text-secondary-foreground')
                    : cn(BADGE_ACTIVE, accent?.badge, 'text-white')
                  : BADGE_INACTIVE,
              )}
            >
              {level}
            </button>
          );
        })}
      </div>

      <div
        className="flex w-full flex-wrap justify-center gap-2"
        role="tablist"
        aria-label="Filter tipe kursus"
      >
        {COURSE_TYPE_FILTERS.map((type) => {
          const isActive = activeType === type;

          return (
            <button
              key={type}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onTypeChange(type)}
              className={cn(
                BADGE_BASE,
                isActive
                  ? type === 'Semua'
                    ? cn(BADGE_ACTIVE, 'bg-primary text-primary-foreground')
                    : type === 'Kursus Gratis'
                      ? cn(BADGE_ACTIVE, 'bg-emerald-600 text-white')
                      : type === 'Kursus Tambahan'
                        ? cn(BADGE_ACTIVE, 'bg-brand-yellow text-foreground')
                        : cn(BADGE_ACTIVE, 'bg-secondary text-secondary-foreground')
                  : BADGE_INACTIVE,
              )}
            >
              {type}
            </button>
          );
        })}
      </div>

      {resultCount != null && resultCount > 0 ? (
        <p className="w-full text-sm text-muted-foreground">{resultCount} kursus ditemukan</p>
      ) : null}
    </div>
  );
}
