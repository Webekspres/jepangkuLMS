'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Sparkles, Swords } from 'lucide-react';
import { cn } from '@/lib/utils';

const FLAVOR_LINES = [
  'Menghitung skor pertarungan…',
  'Memeriksa jawaban MOJI GOI…',
  'Menganalisa tata bahasa…',
  'Menyimpan progress belajar…',
  'Menyiapkan laporan hasil…',
] as const;

export function TryoutSubmitLoading() {
  const [lineIndex, setLineIndex] = useState(0);
  const [progress, setProgress] = useState(8);

  useEffect(() => {
    const lineTimer = window.setInterval(() => {
      setLineIndex((i) => (i + 1) % FLAVOR_LINES.length);
    }, 2200);
    return () => window.clearInterval(lineTimer);
  }, []);

  useEffect(() => {
    const progressTimer = window.setInterval(() => {
      setProgress((p) => {
        if (p >= 92) return p;
        return p + Math.random() * 12 + 4;
      });
    }, 450);
    return () => window.clearInterval(progressTimer);
  }, []);

  return (
    <div className="flex min-h-[55vh] items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
          <div className="h-1 bg-linear-to-r from-brand-red via-brand-orange to-brand-yellow" />

          <div className="pointer-events-none absolute -right-12 -top-12 size-36 rounded-full bg-brand-red/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 size-28 rounded-full bg-brand-yellow/15 blur-3xl" />

          <div className="relative px-6 py-8 sm:px-8 sm:py-10">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-5">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 rounded-2xl border border-dashed border-primary/25"
                />
                <div className="relative flex size-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/5">
                  <Swords className="size-7 text-primary" />
                </div>
                <motion.div
                  className="absolute -right-1 -top-1"
                  animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                >
                  <Sparkles className="size-4 text-brand-yellow" />
                </motion.div>
              </div>

              <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Quest selesai
              </p>
              <h2 className="mt-1 text-xl font-bold text-foreground">Menyimpan Hasil Ujian</h2>
              <p className="mt-1 text-xs text-muted-foreground">Simulasi JLPT · mode belajar</p>

              <div className="mt-7 w-full">
                <div className="mb-2 flex items-center justify-between text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="size-3 animate-spin text-primary" />
                    EXP Progress
                  </span>
                  <span className="tabular-nums text-foreground">
                    {Math.min(100, Math.round(progress))}%
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className={cn(
                      'relative h-full rounded-full bg-linear-to-r from-brand-red via-brand-orange to-brand-yellow',
                    )}
                    animate={{ width: `${Math.min(100, progress)}%` }}
                    transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-white/20"
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
                    />
                  </motion.div>
                </div>
              </div>

              <div className="mt-5 flex min-h-10 items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={lineIndex}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm text-muted-foreground"
                  >
                    {FLAVOR_LINES[lineIndex]}
                  </motion.p>
                </AnimatePresence>
              </div>

              <p className="mt-4 rounded-xl border border-border bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
                Mohon tunggu — jangan tutup halaman ini.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
