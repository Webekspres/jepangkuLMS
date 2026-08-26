'use client';

import { Compass } from 'lucide-react';
import { StudentProgramHero } from '@/features/student/components/student-program-hero';

type PlacementHubHeroProps = {
  totalQuestions: number;
};

export function PlacementHubHero({ totalQuestions }: PlacementHubHeroProps) {
  return (
    <StudentProgramHero
      backgroundSrc="/assets/placement-test-cover.webp"
      badge={{ icon: Compass, label: 'Program · Tes Penempatan' }}
      title="Temukan jalur belajar"
      titleAccent="yang pas untukmu"
      subtitle={`Tes singkat ${totalQuestions} soal untuk rekomendasi jalur N5 atau N4.`}
      fullBleed
    />
  );
}
