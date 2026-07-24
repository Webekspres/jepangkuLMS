import Link from 'next/link';
import { ArrowRight, ClipboardCheck, Compass, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlacementHubHero } from '@/features/placement/components/placement-hub-hero';
import { PLACEMENT_PAPER, PLACEMENT_SECTION_META } from '@/features/placement/data/placement-paper';
import { resolvePlacementLevel } from '@/features/placement/data/placement-score-bands';
import type { PlacementSectionCode } from '@/features/placement/data/types';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';
import type { LevelJLPT } from '@prisma/client';

type LatestAttempt = {
  id: string;
  score: number;
  recommendedLevel: LevelJLPT;
  correctCount: number;
  totalQuestions: number;
  completedAt: Date;
} | null;

type PlacementHubPageProps = {
  latestAttempt: LatestAttempt;
};

const SECTION_ORDER: PlacementSectionCode[] = ['MOJI_GOI', 'BUNPOU_DOKKAI', 'CHOKAI'];

/** Label ramah siswa — tanpa kanji di hub. */
const SECTION_LABEL_ID: Record<PlacementSectionCode, string> = {
  MOJI_GOI: 'Huruf & kosakata',
  BUNPOU_DOKKAI: 'Tata bahasa & bacaan',
  CHOKAI: 'Mendengar',
};

export function PlacementHubPage({ latestAttempt }: PlacementHubPageProps) {
  const activeSections = SECTION_ORDER.map((section) => ({
    section,
    count: PLACEMENT_PAPER.questions.filter((q) => q.section === section).length,
    meta: PLACEMENT_SECTION_META[section],
    labelId: SECTION_LABEL_ID[section],
  })).filter((s) => s.count > 0);

  const totalQuestions = PLACEMENT_PAPER.questions.length;
  const displayLevel = latestAttempt
    ? resolvePlacementLevel(latestAttempt.score).level
    : null;

  return (
    <div className="mx-auto max-w-5xl space-y-4 pb-8 sm:space-y-5">
      <PlacementHubHero totalQuestions={totalQuestions} />

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { label: 'Total soal', value: `${totalQuestions}` },
          { label: 'Level paper', value: 'N5–N4' },
          { label: 'Mode', value: 'Tanpa timer' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-card p-3 text-center sm:p-4"
          >
            <p className="text-lg font-extrabold text-primary sm:text-2xl">{stat.value}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground sm:text-xs">{stat.label}</p>
          </div>
        ))}
      </div>

      {latestAttempt ? (
        <div className="rounded-2xl border border-border bg-card px-4 py-4 shadow-sm sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex min-w-0 flex-wrap items-center gap-2.5 sm:gap-4">
              <p className="inline-flex items-center gap-1.5 rounded-full border border-brand-yellow/25 bg-brand-yellow/10 px-2.5 py-1 text-[10px] font-bold tracking-wide text-brand-navy uppercase">
                <Compass className="size-3 text-brand-yellow" />
                Selesai
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-extrabold leading-none text-brand-navy sm:text-4xl">
                  {displayLevel}
                </p>
                <p className="text-xs text-muted-foreground">jalur disarankan</p>
              </div>
              <div className="hidden h-8 w-px bg-border sm:block" />
              <p className="w-full text-sm text-muted-foreground sm:w-auto">
                <span className="font-semibold text-foreground">{latestAttempt.score}%</span>
                {' · '}
                {latestAttempt.correctCount}/{latestAttempt.totalQuestions} benar
                {' · '}
                {latestAttempt.completedAt.toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row">
              <Button asChild size="sm" className="w-full gap-1.5 sm:w-auto">
                <Link href={STUDENT_ROUTES.placementResult(latestAttempt.id)}>
                  Lihat hasil
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
                <Link href={STUDENT_ROUTES.placementExam}>
                  <RotateCcw className="size-3.5" />
                  Ulangi
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card px-4 py-4 shadow-sm sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ClipboardCheck className="size-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Belum ada hasil</p>
                <p className="text-xs text-muted-foreground">
                  Kerjakan sekali untuk rekomendasi jalur N5 atau N4.
                </p>
              </div>
            </div>
            <Button asChild size="sm" className="w-full gap-1.5 sm:w-auto">
              <Link href={STUDENT_ROUTES.placementExam}>
                Mulai tes
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {activeSections.map(({ section, count, meta, labelId }) => (
          <div
            key={section}
            className="rounded-2xl border border-border bg-card px-3.5 py-3 shadow-sm sm:px-4 sm:py-3.5"
          >
            <div className="mb-1 flex items-center gap-2">
              <span className={`size-2 rounded-full ${meta.colorClass}`} />
              <p className="text-sm font-bold text-foreground">{meta.short}</p>
            </div>
            <p className="text-2xl font-extrabold tabular-nums text-brand-navy">{count}</p>
            <p className="text-xs text-muted-foreground">{labelId}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
