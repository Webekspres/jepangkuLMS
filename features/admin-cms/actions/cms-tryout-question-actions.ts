'use server';

import { revalidatePath } from 'next/cache';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { prisma } from '@/lib/prisma';
import { requireAdminAction } from '@/features/admin-cms/lib/require-admin-action';
import { LEGACY_TRYOUT_WRITE_DISABLED_MESSAGE } from '@/features/admin-cms/lib/tryout-phase2-guards';
import { type TryoutSectionValue } from '@/features/admin-cms/lib/tryout-sections';
import type { CmsActionResult } from '@/features/admin-cms/actions/cms-course-actions';

/**
 * Phase 2: all legacy session-owned Question mutations are disabled.
 * Bank + TryoutSessionItem composition is the only write path.
 */
function disabled(): CmsActionResult {
  return { ok: false, message: LEGACY_TRYOUT_WRITE_DISABLED_MESSAGE };
}

export async function createTryoutQuestionAction(
  _input: unknown,
): Promise<CmsActionResult & { id?: string }> {
  await requireAdminAction();
  return disabled();
}

export async function updateTryoutQuestionAction(
  _questionId: string,
  _input: unknown,
): Promise<CmsActionResult> {
  await requireAdminAction();
  return disabled();
}

export async function reorderTryoutQuestionsAction(
  _sessionId: string,
  _section: TryoutSectionValue,
  _orderedIds: string[],
): Promise<CmsActionResult> {
  await requireAdminAction();
  return disabled();
}

export async function normalizeTryoutQuestionSortOrdersAction(
  _sessionId: string,
): Promise<CmsActionResult> {
  await requireAdminAction();
  return disabled();
}

export async function deleteTryoutQuestionAction(
  _sessionId: string,
  _questionId: string,
): Promise<CmsActionResult> {
  await requireAdminAction();
  return disabled();
}

/** Kept for any leftover callers that only need revalidation after compose. */
export async function revalidateTryoutSessionPaths(sessionId: string) {
  revalidatePath(ADMIN_ROUTES.tryoutSessionCompose(sessionId));
  revalidatePath(ADMIN_ROUTES.tryoutSessions);
  revalidatePath(ADMIN_ROUTES.tryoutBank);
  revalidatePath('/dashboard/tryout');
  // Touch prisma so the module stays a valid server action file if tree-shaken oddly.
  void prisma;
}
