'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClipboardCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { dismissPlacementPromptAction } from '@/features/placement/actions/placement-actions';
import { useStudentCoreData } from '@/features/student/components/student-core-data-context';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';
import { STUDENT_CORE_DATA_REFRESH_EVENT } from '@/features/student/lib/student-core-data-events';
import { toast } from 'sonner';

function isPlacementFocusPath(pathname: string) {
  return (
    pathname === STUDENT_ROUTES.placementExam ||
    /^\/dashboard\/tes-penempatan\/hasil\/[^/]+$/.test(pathname)
  );
}

/**
 * Dialog opsional setelah onboarding nama/ponsel — ajak ikut tes penempatan.
 * Boleh ditutup; dismiss tersimpan di DB.
 */
export function PlacementPromptGate() {
  const core = useStudentCoreData();
  const pathname = usePathname();
  const [dismissedLocally, setDismissedLocally] = useState(false);
  const [isPending, startTransition] = useTransition();

  const profileReady = !core.needsDisplayNameSetup && !core.needsPhoneSetup;
  const open =
    !dismissedLocally &&
    core.status === 'ready' &&
    Boolean(core.userId) &&
    profileReady &&
    core.needsPlacementPrompt &&
    !isPlacementFocusPath(pathname);

  function dismiss() {
    startTransition(async () => {
      const result = await dismissPlacementPromptAction();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setDismissedLocally(true);
      window.dispatchEvent(new Event(STUDENT_CORE_DATA_REFRESH_EVENT));
    });
  }

  if (!open) return null;

  return (
    <Dialog
      open
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isPending) dismiss();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="size-5 text-primary" />
            Tes penempatan
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2 text-left text-sm text-muted-foreground">
              <p>
                Baru bergabung? Ikuti tes penempatan singkat supaya kami bisa menyarankan jalur
                belajar yang cocok (N5–N4).
              </p>
              <p>Opsional, tanpa timer. Kamu bisa mulai sekarang atau nanti dari menu Tes Penempatan.</p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={dismiss}
            className="w-full sm:w-auto"
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Nanti saja
          </Button>
          <Button asChild className="w-full sm:w-auto" disabled={isPending}>
            <Link href={STUDENT_ROUTES.placement} onClick={dismiss}>
              Mulai tes
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
