'use server';

import { requireAuthUserWithAnchor } from '@/lib/auth/require-auth-user';
import { prisma } from '@/lib/prisma';
import { PLACEMENT_PAPER } from '@/features/placement/data/placement-paper';
import {
  EMPTY_PLACEMENT_PROGRESS_STATE,
  parsePlacementProgressJson,
  sanitizePlacementProgressState,
  type PlacementExamProgressState,
} from '@/features/placement/lib/placement-exam-progress';

export type {
  PlacementChokaiView,
  PlacementExamPhase,
  PlacementExamProgressState,
} from '@/features/placement/lib/placement-exam-progress';

export type PlacementExamProgressView = {
  id: string;
  paperId: string;
  paperVersion: number;
  state: PlacementExamProgressState;
  answeredCount: number;
  updatedAt: Date;
};

function toView(row: {
  id: string;
  paperId: string;
  paperVersion: number;
  progressJson: string;
  updatedAt: Date;
}): PlacementExamProgressView {
  const state = parsePlacementProgressJson(row.progressJson);
  return {
    id: row.id,
    paperId: row.paperId,
    paperVersion: row.paperVersion,
    state,
    answeredCount: Object.keys(state.answers).length,
    updatedAt: row.updatedAt,
  };
}

export async function getOrCreatePlacementExamProgress(): Promise<PlacementExamProgressView> {
  const userId = await requireAuthUserWithAnchor();
  const paperId = PLACEMENT_PAPER.id;
  const paperVersion = PLACEMENT_PAPER.version;

  const existing = await prisma.placementExamProgress.findUnique({
    where: { userId_paperId: { userId, paperId } },
  });

  if (existing) {
    if (existing.paperVersion !== paperVersion) {
      const reset = await prisma.placementExamProgress.update({
        where: { id: existing.id },
        data: {
          paperVersion,
          progressJson: JSON.stringify(EMPTY_PLACEMENT_PROGRESS_STATE),
        },
      });
      return toView(reset);
    }
    return toView(existing);
  }

  const created = await prisma.placementExamProgress.create({
    data: {
      userId,
      paperId,
      paperVersion,
      progressJson: JSON.stringify(EMPTY_PLACEMENT_PROGRESS_STATE),
    },
  });

  return toView(created);
}

export async function savePlacementExamProgressState(
  progressId: string,
  state: PlacementExamProgressState,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const userId = await requireAuthUserWithAnchor();

  const row = await prisma.placementExamProgress.findFirst({
    where: { id: progressId, userId },
  });
  if (!row) return { ok: false, message: 'Progress tidak ditemukan.' };

  await prisma.placementExamProgress.update({
    where: { id: progressId },
    data: { progressJson: JSON.stringify(sanitizePlacementProgressState(state)) },
  });

  return { ok: true };
}

export async function loadPlacementExamProgress(): Promise<PlacementExamProgressView | null> {
  const userId = await requireAuthUserWithAnchor();

  const row = await prisma.placementExamProgress.findUnique({
    where: {
      userId_paperId: { userId, paperId: PLACEMENT_PAPER.id },
    },
  });

  if (!row) return null;
  if (row.paperVersion !== PLACEMENT_PAPER.version) return null;

  const view = toView(row);
  const hasMeaningfulProgress =
    view.answeredCount > 0 ||
    view.state.phase === 'section-exam' ||
    view.state.sectionIndex > 0 ||
    view.state.questionIndex > 0 ||
    view.state.flagged.length > 0;

  if (!hasMeaningfulProgress) return null;

  return view;
}

export async function clearPlacementExamProgress(): Promise<void> {
  const userId = await requireAuthUserWithAnchor();
  await prisma.placementExamProgress.deleteMany({
    where: { userId, paperId: PLACEMENT_PAPER.id },
  });
}
