'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Megaphone, Sparkles, Star, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getRevealMessage } from '@/features/tryout/lib/tryout-result-insights';
import { cn } from '@/lib/utils';

type TryoutResultRevealModalProps = {
  displayName: string;
  level: string;
  correct: number;
  total: number;
  score: number;
  pass: boolean;
};

export function TryoutResultRevealModal({
  displayName,
  level,
  correct,
  total,
  score,
  pass,
}: TryoutResultRevealModalProps) {
  const [open, setOpen] = useState(true);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-100 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.button
            type="button"
            aria-label="Tutup"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="tryout-reveal-title"
            className="relative w-full max-w-sm pt-8"
            initial={{ opacity: 0, scale: 0.72, y: 48 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 24 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
          >
            <motion.div
              className="pointer-events-none absolute -left-6 -top-4 text-primary/80"
              initial={{ opacity: 0, x: 20, rotate: -12 }}
              animate={{ opacity: 1, x: 0, rotate: -8 }}
              transition={{ delay: 0.15, type: 'spring' }}
            >
              <Megaphone className="size-10 drop-shadow-sm" />
            </motion.div>
            <motion.div
              className="pointer-events-none absolute -right-6 -top-4 text-primary/80"
              initial={{ opacity: 0, x: -20, rotate: 12 }}
              animate={{ opacity: 1, x: 0, rotate: 8 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              <Megaphone className="size-10 scale-x-[-1] drop-shadow-sm" />
            </motion.div>

            <motion.div
              className="absolute top-8 left-1/2 z-10 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-card bg-primary shadow-lg"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }}
            >
              {pass ? (
                <Trophy className="size-8 text-primary-foreground" />
              ) : (
                <Star className="size-8 fill-brand-yellow text-brand-yellow" />
              )}
            </motion.div>

            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
              <div className="h-1.5 bg-linear-to-r from-brand-red via-brand-orange to-brand-yellow" />

              <div className="px-6 pt-8 pb-6 text-center">
                <motion.p
                  className="text-lg font-bold text-primary"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  {displayName}
                </motion.p>

                <motion.p
                  id="tryout-reveal-title"
                  className={cn(
                    'mt-1 text-sm font-semibold',
                    pass ? 'text-emerald-600' : 'text-muted-foreground',
                  )}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.32 }}
                >
                  {pass ? 'Lulus Simulasi' : 'Belum Lulus Simulasi'}
                </motion.p>
                <p className="text-xs text-muted-foreground">JLPT {level}</p>

                <motion.div
                  className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border-2 border-primary/25 bg-primary/5 px-5 py-2"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, type: 'spring' }}
                >
                  <Sparkles className="size-4 text-brand-yellow" />
                  <span className="text-2xl font-extrabold tabular-nums text-primary">
                    {correct}/{total}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">({score}%)</span>
                </motion.div>

                <motion.p
                  className="mt-4 text-sm leading-relaxed text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {getRevealMessage(pass, score)}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.58 }}
                  className="mt-6"
                >
                  <Button className="w-full font-semibold" size="lg" onClick={() => setOpen(false)}>
                    Lihat Analisa Lengkap
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
