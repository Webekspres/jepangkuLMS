'use client';

import { CourseCatalogHeroSection } from '@/features/learning/components/course-catalog-hero-section';

type CourseCatalogHeroProps = {
  search: string;
  onSearchChange: (value: string) => void;
  badgeLabel?: string;
  subtitle?: string;
  className?: string;
};

export function CourseCatalogHero(props: CourseCatalogHeroProps) {
  return <CourseCatalogHeroSection {...props} fullBleed />;
}
