'use client';

import { useMemo, useState } from 'react';
import { EmptyState } from '@/components/ui/empty-state';
import {
  type CatalogCourse,
  type CourseCategory,
  type CourseFeatureFilter,
  type CourseLevel,
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
  const [activeCategory, setActiveCategory] = useState<CourseCategory>('Semua');
  const [activeFeature, setActiveFeature] = useState<CourseFeatureFilter>('Semua');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return courses.filter((course) => {
      const levelMatch = activeLevel === 'Semua' || course.level === activeLevel;
      const categoryMatch =
        activeCategory === 'Semua' || course.tags.includes(activeCategory);
      const featureMatch =
        activeFeature === 'Semua' || (activeFeature === 'Unggulan' && course.featured);
      const searchMatch =
        !query ||
        course.title.toLowerCase().includes(query) ||
        course.desc.toLowerCase().includes(query) ||
        course.tags.some((tag) => tag.toLowerCase().includes(query));
      return levelMatch && categoryMatch && featureMatch && searchMatch;
    });
  }, [activeCategory, activeFeature, activeLevel, courses, search]);

  function getEnrollmentView(slug: string) {
    const enrollment = enrollmentBySlug[slug];
    if (!enrollment) return null;
    return {
      progress: enrollment.progress.percent,
      continueLessonSlug: enrollment.progress.continueLessonSlug,
      status: enrollment.progress.status,
    };
  }

  return (
    <div className="pb-10">
      <CourseCatalogHero search={search} onSearchChange={setSearch} />

      <CourseCatalogToolbar
        activeLevel={activeLevel}
        onLevelChange={setActiveLevel}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        activeFeature={activeFeature}
        onFeatureChange={setActiveFeature}
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
            search ? (
              <button
                type="button"
                className="text-sm font-semibold text-primary hover:underline underline-offset-4"
                onClick={() => setSearch('')}
              >
                Hapus pencarian
              </button>
            ) : activeLevel !== 'Semua' || activeCategory !== 'Semua' || activeFeature !== 'Semua' ? (
              <button
                type="button"
                className="text-sm font-semibold text-primary hover:underline underline-offset-4"
                onClick={() => {
                  setActiveLevel('Semua');
                  setActiveCategory('Semua');
                  setActiveFeature('Semua');
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
