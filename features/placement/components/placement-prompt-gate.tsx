'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';
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

const springSoft = { type: 'spring' as const, stiffness: 320, damping: 24 };
const springBounce = { type: 'spring' as const, stiffness: 260, damping: 16 };

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
      <DialogContent className="gap-5 overflow-hidden text-center sm:max-w-md">
        <div className="flex flex-col items-center gap-2">
          <motion.div
            className="mx-auto w-full max-w-72 sm:max-w-80"
            initial={{ opacity: 0, scale: 0.72, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ ...springBounce, delay: 0.05 }}
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{
                duration: 2.8,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.55,
              }}
            >
              <Image
                src="/assets/CTA-placement.webp"
                alt="Maskot tes penempatan"
                width={640}
                height={640}
                className="mx-auto h-auto w-full object-contain"
                priority
              />
            </motion.div>
          </motion.div>

          <DialogHeader className="items-center gap-1.5 text-center sm:text-center">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springSoft, delay: 0.18 }}
            >
              <DialogTitle className="text-xl font-bold sm:text-2xl">Tes penempatan</DialogTitle>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springSoft, delay: 0.28 }}
            >
              <DialogDescription className="text-center text-sm text-muted-foreground">
                Ikuti tes singkat untuk mengetahui
                <br />
                rekomendasi jalur belajar N5–N4.
              </DialogDescription>
            </motion.div>
          </DialogHeader>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springSoft, delay: 0.38 }}
        >
          <DialogFooter className="w-full flex-row gap-2 sm:justify-center">
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={isPending}
              onClick={dismiss}
              className="min-w-0 flex-1"
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Nanti saja
            </Button>
            <Button asChild size="lg" className="min-w-0 flex-1" disabled={isPending}>
              <Link href={STUDENT_ROUTES.placement} onClick={dismiss}>
                Mulai tes
              </Link>
            </Button>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
