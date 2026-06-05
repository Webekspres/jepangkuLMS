'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'motion/react';

const SPLASH_DURATION_MS = 1000;
const LOGO_CLASS = 'h-20 w-auto object-contain sm:h-24';

type AppSplashProps = {
  children: React.ReactNode;
};

/** Logo abu-abu di bawah, warna penuh di-reveal kiri→kanan seiring progress. */
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

export function AppSplash({ children }: AppSplashProps) {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const displayPercent = Math.round(progress);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = reducedMotion ? 350 : SPLASH_DURATION_MS;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const next = Math.min(100, (elapsed / duration) * 100);
      setProgress(next);

      if (next < 100) {
        raf = requestAnimationFrame(tick);
      } else {
        window.setTimeout(() => setVisible(false), reducedMotion ? 0 : 400);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

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
              {/* <p className="text-lg tracking-wide text-muted-foreground sm:text-xl">Halo</p> */}

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
