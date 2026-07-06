'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  RotateCcw,
  Shuffle,
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
  mediaUrl?: string | null;
  onyomi?: string | null;
  kunyomi?: string | null;
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

function renderSubText(sub: string | null | undefined, showFurigana: boolean) {
  if (!sub) return null;
  if (showFurigana) return sub;
  
  // If showFurigana is false, filter out the kana (furigana) part
  const parts = sub.split(' · ');
  if (parts.length > 1) {
    return parts[1]; // Return only romaji
  }
  // If there's only 1 part, check if it's kana (Japanese characters). if so, hide it.
  const hasJapanese = /[\u3040-\u30ff\u4e00-\u9faf]/.test(parts[0]);
  return hasJapanese ? null : parts[0];
}

function FlashcardDeckInner({
  items,
  shuffle = false,
  trackLabel = 'Flashcard',
  accentColor = '#ec1d24',
  deckKey,
  onReshuffle,
}: FlashcardDeckProps & { deckKey: string; onReshuffle: () => void }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<number>>(new Set());
  const [unknown, setUnknown] = useState<Set<number>>(new Set());
  const [isShuffled, setIsShuffled] = useState(shuffle);
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [showFurigana, setShowFurigana] = useState(true);
  void deckKey;

  const deck = useMemo(() => {
    if (!isShuffled) return [...items];
    void shuffleSeed;
    return shuffleArray([...items]);
  }, [isShuffled, items, shuffleSeed]);

  function resetNavState() {
    setIndex(0);
    setFlipped(false);
    setKnown(new Set());
    setUnknown(new Set());
  }

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
  const progressPercent = Math.round(progress * 100);

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
    resetNavState();
    if (isShuffled) {
      setShuffleSeed((value) => value + 1);
    }
    onReshuffle();
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center">
      {/* Configuration bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 w-full border-b border-border/60 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={isShuffled ? "default" : "outline"}
            size="sm"
            className="h-8 gap-1.5 text-[11px] font-bold rounded-lg"
            onClick={() => {
              setIsShuffled((current) => !current);
              resetNavState();
            }}
          >
            <Shuffle className="size-3.5" />
            {isShuffled ? 'Urutan Acak' : 'Urutan Asli'}
          </Button>
          
          <Button
            type="button"
            variant={showFurigana ? "default" : "outline"}
            size="sm"
            className="h-8 gap-1.5 text-[11px] font-bold rounded-lg"
            onClick={() => setShowFurigana(!showFurigana)}
          >
            <Eye className="size-3.5" />
            {showFurigana ? 'Sembunyikan Furigana' : 'Tampilkan Furigana'}
          </Button>
        </div>

        <button
          type="button"
          onClick={resetDeck}
          className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          <RotateCcw className="size-3.5" />
          Reset
        </button>
      </div>

      {/* Progress Info */}
      <div className="mb-4 w-full">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground font-semibold">
            {index + 1} / {deck.length} kartu {progressPercent > 0 ? `(${progressPercent}%)` : ''}
          </span>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1 text-emerald-600">
              <CheckCircle2 className="size-3.5" />
              {known.size} sudah tahu
            </span>
            <span className="flex items-center gap-1 text-primary">
              <X className="size-3.5" />
              {unknown.size} belajar lagi
            </span>
          </div>
        </div>
        
        {/* Taller progress bar (h-2.5) with floor 5% for non-zero progress */}
        <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full bg-emerald-500"
            animate={{ width: `${known.size > 0 ? Math.max(5, (known.size / deck.length) * 100) : 0}%` }}
            transition={{ duration: 0.3 }}
          />
          <motion.div
            className="h-full bg-primary"
            animate={{ width: `${unknown.size > 0 ? Math.max(5, (unknown.size / deck.length) * 100) : 0}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Card area with true 3D Flip */}
      <div
        className="mb-6 w-full cursor-pointer select-none"
        style={{ perspective: '1200px' }}
        onClick={() => setFlipped((f) => !f)}
      >
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          style={{ transformStyle: 'preserve-3d', position: 'relative', minHeight: '264px' }}
        >
          {/* Front — navy gradient ala Figma */}
          <div
            className="absolute inset-0 flex min-h-64 max-h-[340px] flex-col items-center justify-center rounded-2xl p-6 shadow-xl overflow-y-auto"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              background: NAVY_GRADIENT,
              border: `2px solid ${cardAccent}40`,
              zIndex: flipped ? 0 : 10,
              visibility: flipped ? 'hidden' : 'visible',
              opacity: flipped ? 0 : 1,
              pointerEvents: flipped ? 'none' : 'auto',
            }}
          >
            <span
              className="absolute top-4 left-4 rounded-lg px-2 py-1 text-xs font-bold text-white"
              style={{ background: `${cardAccent}80` }}
            >
              {cardBadge}
            </span>
            <span className="absolute top-4 right-4 text-[10px] text-white/40">Ketuk untuk flip →</span>
            
            {card.sub && renderSubText(card.sub, showFurigana) && (
              <p
                className="relative z-10 mb-2 text-sm text-white/60 font-semibold"
                style={{ fontFamily: 'var(--font-noto-sans-jp, inherit)' }}
              >
                {renderSubText(card.sub, showFurigana)}
              </p>
            )}
            
            <p
              className="relative z-10 text-center font-bold text-white leading-tight"
              style={{
                fontSize: 'clamp(2rem, 8vw, 3.25rem)',
                fontFamily: 'var(--font-noto-sans-jp, inherit)',
              }}
            >
              {card.front}
            </p>
            
            {/* Front "Sudah tahu" shortcut */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleKnown(true);
              }}
              className="absolute bottom-4 right-4 flex items-center gap-1 rounded-lg bg-emerald-500/20 px-2.5 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/35 transition-colors border border-emerald-500/30"
            >
              <CheckCircle2 className="size-3.5" />
              Sudah tahu
            </button>
          </div>

          {/* Back face */}
          <div
            className="absolute inset-0 flex min-h-64 max-h-[340px] flex-col items-center justify-center rounded-2xl p-6 shadow-xl overflow-y-auto"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              background: `linear-gradient(135deg, ${cardAccent}15 0%, #ffffff 100%)`,
              border: `2px solid ${cardAccent}`,
              zIndex: flipped ? 10 : 0,
              visibility: flipped ? 'visible' : 'hidden',
              opacity: flipped ? 1 : 0,
              pointerEvents: flipped ? 'auto' : 'none',
            }}
          >
            <span
              className="absolute top-4 left-4 rounded-lg px-2 py-1 text-xs font-bold text-white"
              style={{ background: cardAccent }}
            >
              Arti
            </span>
            <span className="absolute top-4 right-4 text-[10px] text-muted-foreground/60">Ketuk untuk kembali →</span>
            
            <p className="text-center text-xl font-extrabold text-foreground sm:text-2xl mt-4 leading-normal">{card.back}</p>
            
            {/* Kunyomi & Onyomi split by | */}
            {(card.onyomi || card.kunyomi) && (
              <div className="mt-3 text-xs text-muted-foreground flex flex-col items-center gap-1 bg-muted/40 px-3 py-2 rounded-lg border border-border/50">
                {card.onyomi && (
                  <span>
                    <strong className="text-foreground">Onyomi:</strong> {card.onyomi.split(/,\s*/).join(' | ')}
                  </span>
                )}
                {card.kunyomi && (
                  <span>
                    <strong className="text-foreground">Kunyomi:</strong> {card.kunyomi.split(/,\s*/).join(' | ')}
                  </span>
                )}
              </div>
            )}

            {card.example && (
              <div
                className="mt-4 w-full rounded-xl p-3 text-center border border-border/40"
                style={{ background: `${cardAccent}08` }}
              >
                <p className="whitespace-pre-line text-xs sm:text-sm text-muted-foreground italic leading-relaxed">
                  {card.example}
                </p>
              </div>
            )}
            
            {card.mediaUrl && (
              <div className="mt-4 flex justify-center w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={card.mediaUrl} alt={card.front} className="max-h-24 w-auto rounded-lg object-contain shadow-sm border border-border/50 bg-white" />
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Action Buttons */}
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
              className="gap-2 px-8 font-bold shadow-md hover:shadow-lg transition-all"
              onClick={(e) => {
                e.stopPropagation();
                setFlipped(true);
              }}
            >
              <Eye className="size-4" />
              Lihat Jawaban
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
              className="flex-1 gap-1.5 font-bold shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                handleKnown(false);
              }}
            >
              <X className="size-4" />
              Belajar Lagi
            </Button>
            <Button
              type="button"
              className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                handleKnown(true);
              }}
            >
              <CheckCircle2 className="size-4" />
              Sudah Tahu
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation dot bar */}
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={index === 0}
          onClick={() => goTo(index - 1)}
          aria-label="Kartu sebelumnya"
          className="size-9 rounded-xl shadow-xs"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <div className="flex gap-1.5 max-w-[200px] overflow-x-auto py-1">
          {deck.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Kartu ${i + 1}`}
              onClick={() => goTo(i)}
              className={cn(
                'size-2 rounded-full transition-all shrink-0',
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
          className="size-9 rounded-xl shadow-xs"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {progress >= 1 && (
        <p className="mt-4 text-center text-sm font-semibold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
          🎉 Semua kartu selesai dipelajari!
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
