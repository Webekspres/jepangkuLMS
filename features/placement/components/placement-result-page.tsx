import { PlacementResultShell } from '@/features/placement/components/placement-focus-shell';
import { PlacementResultReveal } from '@/features/placement/components/placement-result-reveal';
import type { LevelJLPT } from '@prisma/client';

type PlacementResultPageProps = {
  attemptId: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  recommendedLevel: LevelJLPT;
  blurb: string;
  paperTitle: string;
  completedAt: Date;
};

export function PlacementResultPage({
  attemptId,
  score,
  correctCount,
  totalQuestions,
  recommendedLevel,
  blurb,
  paperTitle,
  completedAt,
}: PlacementResultPageProps) {
  return (
    <PlacementResultShell>
      <PlacementResultReveal
        attemptId={attemptId}
        score={score}
        correctCount={correctCount}
        totalQuestions={totalQuestions}
        recommendedLevel={recommendedLevel}
        blurb={blurb}
        paperTitle={paperTitle}
        completedAt={completedAt}
      />
    </PlacementResultShell>
  );
}
