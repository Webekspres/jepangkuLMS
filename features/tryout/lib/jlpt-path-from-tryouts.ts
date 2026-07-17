import type { LevelJLPT } from '@prisma/client';
import type {
  DashboardJlptPathData,
  JlptPathItem,
} from '@/features/student/components/dashboard-data';
import type { AnalyzedTryoutAttempt } from '@/features/tryout/lib/tryout-attempt-analysis';
import { getJlptLevelCefrConfig } from '@/features/tryout/lib/jlpt-cefr-reference';

export const JLPT_PATH_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;

export type JlptLevelAttemptSummary = {
  bestScaledScore: number;
  bestPassOverall: boolean;
  attemptCount: number;
  bestAttemptId: string | null;
  bestAttemptAt: Date | null;
};

export function summarizeTryoutAttempts(
  attempts: AnalyzedTryoutAttempt[],
): Map<LevelJLPT, JlptLevelAttemptSummary> {
  const summaries = new Map<LevelJLPT, JlptLevelAttemptSummary>();

  for (const attempt of attempts) {
    const current = summaries.get(attempt.level);
    const isBetter =
      !current ||
      attempt.scaledTotalScore > current.bestScaledScore ||
      (attempt.scaledTotalScore === current.bestScaledScore &&
        attempt.createdAt.getTime() > (current.bestAttemptAt?.getTime() ?? 0));

    summaries.set(attempt.level, {
      bestScaledScore: isBetter ? attempt.scaledTotalScore : current.bestScaledScore,
      bestPassOverall: isBetter ? attempt.jlptPassOverall : current.bestPassOverall,
      attemptCount: (current?.attemptCount ?? 0) + 1,
      bestAttemptId: isBetter ? attempt.attemptId : current.bestAttemptId,
      bestAttemptAt: isBetter ? attempt.createdAt : current.bestAttemptAt,
    });
  }

  return summaries;
}

export function buildJlptPathFromLevelSummaries(
  summaries: Map<LevelJLPT, JlptLevelAttemptSummary>,
  hasAttempts = summaries.size > 0,
): DashboardJlptPathData {
  const started = hasAttempts;
  if (!started) {
    return {
      started: false,
      path: JLPT_PATH_LEVELS.map((level) => ({ level, status: 'locked' })),
    };
  }

  const path: JlptPathItem[] = [];
  let foundActive = false;

  for (const level of JLPT_PATH_LEVELS) {
    const summary = summaries.get(level);

    if (!foundActive && summary?.bestPassOverall) {
      path.push({ level, status: 'done', progress: 100 });
      continue;
    }

    if (!foundActive) {
      const totalPassScore = getJlptLevelCefrConfig(level).totalPassScore;
      const progress = Math.min(
        99,
        Math.round(((summary?.bestScaledScore ?? 0) / totalPassScore) * 100),
      );
      path.push({ level, status: 'active', progress });
      foundActive = true;
      continue;
    }

    path.push({ level, status: 'locked', progress: 0 });
  }

  const activeItem = path.find((item) => item.status === 'active');
  if (!activeItem) return { started, path };

  const activeSummary = summaries.get(activeItem.level);
  return {
    started,
    path,
    activeQuest: {
      level: activeItem.level,
      bestScaledScore: activeSummary?.bestScaledScore ?? 0,
      totalPassScore: getJlptLevelCefrConfig(activeItem.level).totalPassScore,
      attemptCount: activeSummary?.attemptCount ?? 0,
      bestAttemptId: activeSummary?.bestAttemptId ?? null,
    },
  };
}
