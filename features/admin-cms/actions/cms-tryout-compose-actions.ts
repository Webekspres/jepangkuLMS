'use server';

/**
 * @deprecated Session compose retired — use Paket Soal actions instead.
 * Writes to TryoutSessionItem are frozen.
 */
import type { TryoutSectionCode } from '@prisma/client';
import type { CmsActionResult } from '@/features/admin-cms/actions/cms-course-actions';
import { requireAdminAction } from '@/features/admin-cms/lib/require-admin-action';

const RETIRED =
  'Komposisi per sesi sudah diganti Paket Soal. Kelola di /admin/tryout/paket.';

export async function addQuestionToSessionAction(_input: {
  sessionId: string;
  questionId: string;
}): Promise<CmsActionResult> {
  await requireAdminAction();
  return { ok: false, message: RETIRED };
}

export async function addStimulusToSessionAction(_input: {
  sessionId: string;
  stimulusId: string;
}): Promise<CmsActionResult> {
  await requireAdminAction();
  return { ok: false, message: RETIRED };
}

export async function removeSessionItemAction(_itemId: string): Promise<CmsActionResult> {
  await requireAdminAction();
  return { ok: false, message: RETIRED };
}

export async function reorderSessionItemsAction(_input: {
  sessionId: string;
  section: TryoutSectionCode;
  orderedItemIds: string[];
}): Promise<CmsActionResult> {
  await requireAdminAction();
  return { ok: false, message: RETIRED };
}
