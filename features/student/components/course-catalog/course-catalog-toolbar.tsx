'use client';

import { CourseCatalogFilterBar } from '@/features/learning/components/course-catalog-filter-bar';
import type { CourseLevel, CourseTypeFilter } from '@/features/learning/components/courses-data';

type CourseCatalogToolbarProps = {
  activeLevel: CourseLevel;
  onLevelChange: (level: CourseLevel) => void;
  activeType: CourseTypeFilter;
  onTypeChange: (type: CourseTypeFilter) => void;
  resultCount?: number;
};

export function CourseCatalogToolbar({
  activeLevel,
  onLevelChange,
  activeType,
  onTypeChange,
  resultCount,
}: CourseCatalogToolbarProps) {
  return (
    <CourseCatalogFilterBar
      activeLevel={activeLevel}
      onLevelChange={onLevelChange}
      activeType={activeType}
      onTypeChange={onTypeChange}
      resultCount={resultCount}
      className="pt-2"
    />
  );
}
