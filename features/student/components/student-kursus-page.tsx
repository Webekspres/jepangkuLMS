'use client';

import { useMemo, useState } from 'react';
import { EmptyState } from '@/components/ui/empty-state';
import {
  courseMatchesTypeFilter,
  type CatalogCourse,
  type CourseLevel,
  type CourseTypeFilter,
} from '@/features/learning/components/courses-data';
import type { StudentEnrollmentView } from '@/features/learning/lib/queries';
import {
  CourseCatalogCard,
  CourseCatalogHero,
  CourseCatalogToolbar,
} from '@/features/student/components/course-catalog';

export type StudentKursusPageProps = {
  courses: (CatalogCourse & { dbId: string; lessonCount: number; isPublished: boolean })[];
  enrollmentBySlug: Record<string, StudentEnrollmentView>;
};

export function StudentKursusPage({ courses, enrollmentBySlug }: StudentKursusPageProps) {
  const [activeLevel, setActiveLevel] = useState<CourseLevel>('Semua');
  const [activeType, setActiveType] = useState<CourseTypeFilter>('Semua');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return courses.filter((course) => {
      const levelMatch = activeLevel === 'Semua' || course.level === activeLevel;
      const typeMatch = courseMatchesTypeFilter(
        course.categoryType,
        activeType,
        course.tags,
      );
      const searchMatch =
        !query ||
        course.title.toLowerCase().includes(query) ||
        course.desc.toLowerCase().includes(query) ||
        course.tags.some((tag) => tag.toLowerCase().includes(query));
      return levelMatch && typeMatch && searchMatch;
    });
  }, [activeLevel, activeType, courses, search]);

  function getEnrollmentView(slug: string) {
    const enrollment = enrollmentBySlug[slug];
    if (!enrollment) return null;
    return {
      progress: enrollment.progress.percent,
      continueLessonSlug: enrollment.progress.continueLessonSlug,
      status: enrollment.progress.status,
    };
  }

  const hasActiveFilters = activeLevel !== 'Semua' || activeType !== 'Semua' || search.length > 0;

  return (
    <div className="pb-10">
      <CourseCatalogHero search={search} onSearchChange={setSearch} />

      <CourseCatalogToolbar
        activeLevel={activeLevel}
        onLevelChange={setActiveLevel}
        activeType={activeType}
        onTypeChange={setActiveType}
        resultCount={filtered.length}
      />

      {filtered.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course, index) => (
            <CourseCatalogCard
              key={course.slug}
              course={course}
              enrollment={getEnrollmentView(course.slug)}
              index={index}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          className="rounded-2xl border border-dashed border-border bg-card/50 py-16"
          title={search ? `Tidak ada kursus untuk "${search}"` : 'Tidak ada kursus ditemukan'}
          description="Coba ubah kata kunci atau filter untuk menemukan kursus lainnya."
          action={
            hasActiveFilters ? (
              <button
                type="button"
                className="text-sm font-semibold text-primary hover:underline underline-offset-4"
                onClick={() => {
                  setSearch('');
                  setActiveLevel('Semua');
                  setActiveType('Semua');
                }}
              >
                Reset filter
              </button>
            ) : null
          }
        />
      )}
    </div>
  );
}
