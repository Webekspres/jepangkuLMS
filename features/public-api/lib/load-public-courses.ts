import { unstable_cache } from 'next/cache';
import {
  COURSE_TREE_INCLUDE,
  countLessonsInModules,
  mapCourseModulesFromPrisma,
} from '@/features/learning/lib/course-tree';
import type {
  PublicCourseDetail,
  PublicCourseSummary,
} from '@/features/public-api/lib/public-course-types';
import { LEARNING_CACHE_TAGS } from '@/lib/cache/learning-cache';
import { prisma } from '@/lib/prisma';

function getPublicAppBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '');
  return base || 'https://kursus.jepangku.com';
}

function buildCourseUrl(slug: string): string {
  return `${getPublicAppBaseUrl()}/kursus/${slug}`;
}

function toPublicSummary(
  course: {
    slug: string;
    title: string;
    description: string | null;
    level: PublicCourseSummary['level'];
    priceIdr: number;
    modules: ReturnType<typeof mapCourseModulesFromPrisma>;
  },
): PublicCourseSummary {
  const lessonCount = countLessonsInModules(course.modules);
  return {
    slug: course.slug,
    title: course.title,
    description: course.description,
    level: course.level,
    priceIdr: course.priceIdr,
    lessonCount,
    moduleCount: course.modules.length,
    url: buildCourseUrl(course.slug),
  };
}

const listPublishedCourses = unstable_cache(
  async (): Promise<PublicCourseSummary[]> => {
    const rows = await prisma.course.findMany({
      where: { isPublished: true },
      orderBy: [{ level: 'asc' }, { createdAt: 'desc' }],
      include: COURSE_TREE_INCLUDE,
    });

    return rows.map((row) => {
      const modules = mapCourseModulesFromPrisma(row.modules);
      return toPublicSummary({
        slug: row.slug,
        title: row.title,
        description: row.description,
        level: row.level,
        priceIdr: row.priceIdr,
        modules,
      });
    });
  },
  ['partner-public-courses-list-v1'],
  { revalidate: 300, tags: [LEARNING_CACHE_TAGS.coursesCatalog] },
);

export async function getPartnerPublicCourses(): Promise<PublicCourseSummary[]> {
  return listPublishedCourses();
}

export async function getPartnerPublicCourseBySlug(
  slug: string,
): Promise<PublicCourseDetail | null> {
  const course = await prisma.course.findFirst({
    where: { slug, isPublished: true },
    include: COURSE_TREE_INCLUDE,
  });

  if (!course) return null;

  const modules = mapCourseModulesFromPrisma(course.modules);

  return {
    ...toPublicSummary({
      slug: course.slug,
      title: course.title,
      description: course.description,
      level: course.level,
      priceIdr: course.priceIdr,
      modules,
    }),
    modules: modules.map((mod) => ({
      slug: mod.slug,
      title: mod.title,
      description: mod.description ?? null,
      order: mod.order,
      lessons: mod.lessons.map((lesson) => ({
        slug: lesson.slug,
        title: lesson.title,
        order: lesson.order,
        hasQuiz: lesson.hasQuiz ?? false,
      })),
    })),
  };
}
