import { getCachedCourseWithLessons, getCachedCoursesWithDbIds } from '@/lib/cache/learning-cache';
import { mapDbCourseToDetail } from '@/features/learning/lib/map-marketing-course';
import type { CatalogCourse } from '@/features/learning/components/courses-data';
import type { CourseDetail } from '@/features/learning/components/course-detail-data';

export async function loadMarketingCatalog(): Promise<CatalogCourse[]> {
  const courses = await getCachedCoursesWithDbIds();
  return courses
    .filter((course) => course.isPublished)
    .map((course) => {
      const { dbId, lessonCount, isPublished, priceIdr, ...rest } = course;
      void dbId;
      void lessonCount;
      void isPublished;
      void priceIdr;
      return rest;
    });
}

export async function loadMarketingCourseDetail(slug: string): Promise<CourseDetail | null> {
  const course = await getCachedCourseWithLessons(slug);
  if (!course?.isPublished) return null;

  const { dbId, modules, lessons, outcomes, ...catalog } = course;
  void dbId;
  void lessons;

  return mapDbCourseToDetail({
    catalog: {
      ...catalog,
      priceIdr: catalog.priceIdr,
      lessons: catalog.lessonCount,
    },
    modules,
    outcomes,
  });
}

export async function loadPublishedCourseSlugs(): Promise<string[]> {
  const courses = await getCachedCoursesWithDbIds();
  return courses.filter((course) => course.isPublished).map((course) => course.slug);
}
