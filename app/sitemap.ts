import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'https://kursus.jepangku.com';

function url(path: string): string {
  return `${BASE_URL}${path}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Slug kursus yang sudah dipublikasikan
  const publishedCourses = await prisma.course.findMany({
    where: { isPublished: true },
    select: { slug: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  const courseEntries: MetadataRoute.Sitemap = publishedCourses.map((course) => ({
    url: url(`/kursus/${course.slug}`),
    lastModified: course.createdAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: url('/'),
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: url('/kursus'),
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: url('/tryout'),
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: url('/tentang'),
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: url('/cara-belajar'),
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: url('/hubungi'),
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: url('/syarat-ketentuan'),
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: url('/kebijakan-privasi'),
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ];

  return [...staticPages, ...courseEntries];
}
