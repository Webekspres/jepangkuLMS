'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { isCoreIntegrationEnabled } from '@/lib/core/integration-config';
import { STUDENT_CORE_DATA_READY_EVENT } from '@/features/student/lib/student-core-data-events';

const MIN_SPLASH_MS = 700;
const MAX_BOOTSTRAP_WAIT_MS = 15_000;
const PROGRESS_HOLD = 88;
const LOGO_CLASS = 'h-20 w-auto object-contain sm:h-24';

type AppSplashProps = {
  children: React.ReactNode;
};

function ProgressRevealLogo({ progress }: { progress: number }) {
  const revealClip = `inset(0 ${100 - progress}% 0 0)`;

  return (
    <div className="relative w-fit">
      <Image
        src="/brand/logo.png"
        alt=""
        width={280}
        height={80}
        className={`${LOGO_CLASS} grayscale opacity-40`}
        priority
        aria-hidden
      />
      <div className="absolute inset-0" style={{ clipPath: revealClip }}>
        <Image
          src="/brand/logo.png"
          alt="JepangKu"
          width={280}
          height={80}
          className={LOGO_CLASS}
          priority
        />
      </div>
    </div>
  );
}

function useDashboardBootstrapGate() {
  const { isLoaded, isSignedIn } = useAuth();
  const pathname = usePathname();

  const needsGate =
    isCoreIntegrationEnabled() &&
    isLoaded &&
    isSignedIn &&
    (pathname?.startsWith('/dashboard') ?? false);

  const [gateOpen, setGateOpen] = useState(!needsGate);

  useEffect(() => {
    if (!needsGate) {
      setGateOpen(true);
      return;
    }

    setGateOpen(false);

    const onReady = () => setGateOpen(true);
    window.addEventListener(STUDENT_CORE_DATA_READY_EVENT, onReady);
    const timeout = window.setTimeout(() => setGateOpen(true), MAX_BOOTSTRAP_WAIT_MS);

    return () => {
      window.removeEventListener(STUDENT_CORE_DATA_READY_EVENT, onReady);
      window.clearTimeout(timeout);
    };
  }, [needsGate, pathname, isLoaded, isSignedIn]);

  return gateOpen;
}

export function AppSplash({ children }: AppSplashProps) {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const gateOpen = useDashboardBootstrapGate();
  const displayPercent = Math.round(progress);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tickMs = reducedMotion ? 50 : 35;
    const step = reducedMotion ? 8 : gateOpen ? 6 : 2.5;

    const interval = window.setInterval(() => {
      setProgress((current) => {
        if (!gateOpen) {
          return Math.min(PROGRESS_HOLD, current + step);
        }
        return Math.min(100, current + step);
      });
    }, tickMs);

    return () => window.clearInterval(interval);
  }, [gateOpen]);

  useEffect(() => {
    if (progress < 100 || !gateOpen) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const delay = reducedMotion ? 0 : MIN_SPLASH_MS / 3;
    const timer = window.setTimeout(() => setVisible(false), delay);
    return () => window.clearTimeout(timer);
  }, [progress, gateOpen]);

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            key="jepangku-splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="fixed inset-0 z-9999 flex items-center justify-center bg-background"
            aria-live="polite"
            aria-busy="true"
            role="progressbar"
            aria-valuenow={displayPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Memuat JepangKu, ${displayPercent} persen`}
          >
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col items-center gap-8 sm:gap-10"
            >
              <div className="flex flex-col items-center gap-6 sm:gap-8">
                <ProgressRevealLogo progress={progress} />
                <span className="font-mono text-sm tabular-nums tracking-widest text-muted-foreground sm:text-base">
                  {displayPercent}%
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </>
  );
}
