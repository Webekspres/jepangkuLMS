import { describe, expect, test } from 'bun:test';
import {
  getAllCourseSlugs,
  getCourseBySlug,
} from '@/features/learning/components/course-detail-data';
import { CATALOG_COURSES } from '@/features/learning/components/courses-data';

describe('course-detail-data', () => {
  test('getAllCourseSlugs returns every catalog slug', () => {
    const slugs = getAllCourseSlugs();
    expect(slugs).toHaveLength(CATALOG_COURSES.length);
    expect(slugs).toContain('jlpt-n5-kursus-lengkap');
  });

  test('getCourseBySlug merges catalog and detail extras', () => {
    const course = getCourseBySlug('jlpt-n5-kursus-lengkap');
    expect(course).toBeDefined();
    expect(course?.title).toContain('N5');
    expect(course?.fullDesc.length).toBeGreaterThan(20);
    expect(course?.syllabus.length).toBeGreaterThan(0);
  });

  test('getCourseBySlug returns undefined for unknown slug', () => {
    expect(getCourseBySlug('tidak-ada')).toBeUndefined();
  });
});
