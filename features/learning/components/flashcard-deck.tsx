'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  RotateCcw,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { shuffleArray } from '@/lib/shuffle';
import { cn } from '@/lib/utils';

export type FlashcardItem = {
  front: string;
  sub?: string | null;
  back: string;
  example?: string | null;
  badge?: string;
  accentColor?: string;
  trackColorClass?: string;
};

type FlashcardDeckProps = {
  items: FlashcardItem[];
  /** Acak urutan kartu saat deck dimuat / di-reset */
  shuffle?: boolean;
  trackLabel?: string;
  trackColorClass?: string;
  accentColor?: string;
};

const NAVY_GRADIENT = 'linear-gradient(135deg, #0d1b3e 0%, #1a2d5a 100%)';

function FlashcardDeckInner({
  items,
  shuffle = true,
  trackLabel = 'Flashcard',
  accentColor = '#ec1d24',
  deckKey,
  onReshuffle,
}: FlashcardDeckProps & { deckKey: string; onReshuffle: () => void }) {
  const [deck] = useState<FlashcardItem[]>(() =>
    shuffle ? shuffleArray(items) : [...items],
  );
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<number>>(new Set());
  const [unknown, setUnknown] = useState<Set<number>>(new Set());
  void deckKey;

  if (deck.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Belum ada materi flashcard untuk pelajaran ini.
      </p>
    );
  }

  const card = deck[index];
  const cardBadge = card.badge ?? trackLabel;
  const cardAccent = card.accentColor ?? accentColor;
  const progress = deck.length > 0 ? (known.size + unknown.size) / deck.length : 0;

  function goTo(next: number) {
    setIndex(next);
    setFlipped(false);
  }

  function handleKnown(wasKnown: boolean) {
    if (wasKnown) {
      setKnown((prev) => new Set(prev).add(index));
    } else {
      setUnknown((prev) => new Set(prev).add(index));
    }
    setFlipped(false);
    window.setTimeout(() => {
      if (index < deck.length - 1) goTo(index + 1);
    }, 200);
  }

  function resetDeck() {
    onReshuffle();
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center">
      <div className="mb-6 w-full">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {index + 1} / {deck.length} kartu
          </span>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1 text-emerald-600">
              <CheckCircle2 className="size-3.5" />
              {known.size}
            </span>
            <span className="flex items-center gap-1 text-primary">
              <X className="size-3.5" />
              {unknown.size}
            </span>
          </div>
        </div>
        <div className="flex h-2 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full bg-emerald-500"
            animate={{ width: `${(known.size / deck.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
          <motion.div
            className="h-full bg-primary"
            animate={{ width: `${(unknown.size / deck.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <div
        className="mb-6 w-full cursor-pointer"
        style={{ perspective: '1200px' }}
        onClick={() => setFlipped((f) => !f)}
      >
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          style={{ transformStyle: 'preserve-3d', position: 'relative', minHeight: '220px' }}
        >
          {/* Front — navy gradient ala Figma */}
          <div
            className="absolute inset-0 flex min-h-56 flex-col items-center justify-center rounded-2xl p-8 shadow-xl"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              background: NAVY_GRADIENT,
              border: `2px solid ${cardAccent}40`,
            }}
          >
            <span
              className="absolute top-4 left-4 rounded-lg px-2 py-1 text-xs font-bold text-white"
              style={{ background: `${cardAccent}80` }}
            >
              {cardBadge}
            </span>
            <span className="absolute top-4 right-4 text-xs text-white/40">Ketuk untuk flip →</span>
            {card.sub && (
              <p
                className="relative z-10 mb-2 text-sm text-white/60"
                style={{ fontFamily: 'var(--font-noto-sans-jp, inherit)' }}
              >
                {card.sub}
              </p>
            )}
            <p
              className="relative z-10 text-center font-bold text-white"
              style={{
                fontSize: 'clamp(2rem, 8vw, 3.25rem)',
                fontFamily: 'var(--font-noto-sans-jp, inherit)',
              }}
            >
              {card.front}
            </p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 flex min-h-56 flex-col items-center justify-center rounded-2xl p-8 shadow-xl"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              background: `linear-gradient(135deg, ${cardAccent}20 0%, white 100%)`,
              border: `2px solid ${cardAccent}`,
            }}
          >
            <span
              className="absolute top-4 left-4 rounded-lg px-2 py-1 text-xs font-bold text-white"
              style={{ background: cardAccent }}
            >
              Arti
            </span>
            <p className="text-center text-xl font-bold text-foreground sm:text-2xl">{card.back}</p>
            {card.example && (
              <div
                className="mt-4 w-full rounded-xl p-3 text-center"
                style={{ background: `${cardAccent}15` }}
              >
                <p className="whitespace-pre-line text-sm text-muted-foreground">{card.example}</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        {!flipped ? (
          <motion.div
            key="flip-btn"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-5"
          >
            <Button
              type="button"
              size="lg"
              className="gap-2 px-8"
              onClick={(e) => {
                e.stopPropagation();
                setFlipped(true);
              }}
            >
              <Eye className="size-4" />
              Lihat jawaban
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="action-btns"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-5 flex w-full max-w-sm gap-3"
          >
            <Button
              type="button"
              variant="destructive"
              className="flex-1 gap-1.5"
              onClick={(e) => {
                e.stopPropagation();
                handleKnown(false);
              }}
            >
              <X className="size-4" />
              Belum tahu
            </Button>
            <Button
              type="button"
              className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700"
              onClick={(e) => {
                e.stopPropagation();
                handleKnown(true);
              }}
            >
              <CheckCircle2 className="size-4" />
              Sudah tahu
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={index === 0}
          onClick={() => goTo(index - 1)}
          aria-label="Kartu sebelumnya"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <div className="flex gap-1.5">
          {deck.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Kartu ${i + 1}`}
              onClick={() => goTo(i)}
              className={cn(
                'size-2 rounded-full transition-all',
                i === index
                  ? 'scale-125 bg-primary'
                  : known.has(i)
                    ? 'bg-emerald-500'
                    : unknown.has(i)
                      ? 'bg-primary'
                      : 'bg-muted',
              )}
            />
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={index >= deck.length - 1}
          onClick={() => goTo(index + 1)}
          aria-label="Kartu selanjutnya"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {(known.size > 0 || unknown.size > 0) && (
        <button
          type="button"
          onClick={resetDeck}
          className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <RotateCcw className="size-3.5" />
          Ulangi dari awal
        </button>
      )}

      {progress >= 1 && (
        <p className="mt-3 text-center text-sm font-medium text-emerald-600">
          Semua kartu sudah dijawab — bagus!
        </p>
      )}
    </div>
  );
}

export function FlashcardDeck(props: FlashcardDeckProps) {
  const itemsKey = props.items.map((item) => `${item.front}:${item.back}`).join('|');
  const [seed, setSeed] = useState(0);
  return (
    <FlashcardDeckInner
      key={`${itemsKey}:${seed}`}
      {...props}
      deckKey={`${itemsKey}:${seed}`}
      onReshuffle={() => setSeed((value) => value + 1)}
    />
  );
}
