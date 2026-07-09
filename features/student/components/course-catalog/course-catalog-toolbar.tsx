'use client';

import { Star } from 'lucide-react';
import {
  COURSE_CATEGORIES,
  COURSE_FEATURE_FILTERS,
  COURSE_LEVELS,
  LEVEL_ACCENT,
  type CourseCategory,
  type CourseFeatureFilter,
  type CourseLevel,
} from '@/features/learning/components/courses-data';
import { JLPT_ACCENT } from '@/features/marketing/components/landing-data';
import { cn } from '@/lib/utils';

const BADGE_BASE =
  'inline-flex shrink-0 cursor-pointer items-center rounded-full border px-4 py-1.5 text-sm font-semibold transition-all';
const BADGE_INACTIVE =
  'border-border bg-card/80 text-muted-foreground shadow-sm backdrop-blur-sm hover:bg-muted hover:text-foreground';
const BADGE_ACTIVE = 'border-transparent shadow-md';

type CourseCatalogToolbarProps = {
  activeLevel: CourseLevel;
  onLevelChange: (level: CourseLevel) => void;
  activeCategory?: CourseCategory;
  onCategoryChange?: (category: CourseCategory) => void;
  activeFeature?: CourseFeatureFilter;
  onFeatureChange?: (feature: CourseFeatureFilter) => void;
  showTopicFilters?: boolean;
  resultCount?: number;
};

export function CourseCatalogToolbar({
  activeLevel,
  onLevelChange,
  activeCategory = 'Semua',
  onCategoryChange,
  activeFeature = 'Semua',
  onFeatureChange,
  showTopicFilters = true,
  resultCount,
}: CourseCatalogToolbarProps) {
  return (
    <div className="flex flex-col items-center gap-4 pb-8 pt-2">
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

      {showTopicFilters && onCategoryChange && onFeatureChange ? (
        <div className="flex w-full flex-wrap justify-center gap-2">
          {COURSE_FEATURE_FILTERS.map((feature) => (
            <button
              key={feature}
              type="button"
              onClick={() => onFeatureChange(feature)}
              className={cn(
                BADGE_BASE,
                'gap-1',
                activeFeature === feature
                  ? cn(BADGE_ACTIVE, 'bg-brand-yellow text-foreground')
                  : BADGE_INACTIVE,
              )}
            >
              {feature === 'Unggulan' ? <Star className="size-3.5" /> : null}
              {feature}
            </button>
          ))}
          {COURSE_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => onCategoryChange(category)}
              className={cn(
                BADGE_BASE,
                activeCategory === category
                  ? cn(BADGE_ACTIVE, 'bg-primary text-primary-foreground')
                  : BADGE_INACTIVE,
              )}
            >
              {category}
            </button>
          ))}
        </div>
      ) : null}

      {resultCount != null && resultCount > 0 ? (
        <p className="w-full text-sm text-muted-foreground">{resultCount} kursus ditemukan</p>
      ) : null}
    </div>
  );
}
