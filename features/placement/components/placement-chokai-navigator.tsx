'use client';

import { BookOpen } from 'lucide-react';
import {
  CHOKAI_MONDAI_INSTRUCTIONS,
  CHOKAI_MONDAI_ORDER,
  type ChokaiMondaiKey,
} from '@/features/placement/data/chokai-mondai-instructions';
import type { PlacementQuestion } from '@/features/placement/data/types';
import { cn } from '@/lib/utils';

export type ChokaiNavTarget =
  | { kind: 'intro'; mondai: ChokaiMondaiKey }
  | { kind: 'question'; mondai: ChokaiMondaiKey; questionIndex: number };

type PlacementChokaiNavigatorProps = {
  questionsByMondai: Record<ChokaiMondaiKey, PlacementQuestion[]>;
  answers: Record<string, string>;
  flagged: Set<string>;
  /** Current view */
  activeMondai: ChokaiMondaiKey;
  view: 'mondai-intro' | 'question';
  questionIndex: number;
  onNavigate: (target: ChokaiNavTarget) => void;
};

export function PlacementChokaiNavigator({
  questionsByMondai,
  answers,
  flagged,
  activeMondai,
  view,
  questionIndex,
  onNavigate,
}: PlacementChokaiNavigatorProps) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 text-xs">
        {[
          { color: 'bg-emerald-500', label: 'Terjawab' },
          { color: 'bg-primary', label: 'Saat ini' },
          { color: 'bg-amber-500', label: 'Ditandai' },
          { color: 'bg-muted', label: 'Belum' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 text-muted-foreground">
            <span className={cn('size-2.5 rounded-full', item.color)} />
            {item.label}
          </div>
        ))}
      </div>

      {CHOKAI_MONDAI_ORDER.map((mondaiKey) => {
        const qs = questionsByMondai[mondaiKey] ?? [];
        if (qs.length === 0) return null;
        const meta = CHOKAI_MONDAI_INSTRUCTIONS[mondaiKey];
        const introActive = activeMondai === mondaiKey && view === 'mondai-intro';

        return (
          <div key={mondaiKey}>
            <p className="mb-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">
              Mondai {meta.number}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onNavigate({ kind: 'intro', mondai: mondaiKey })}
                className={cn(
                  'flex h-10 items-center gap-1.5 rounded-xl border-2 px-2.5 text-[11px] font-bold',
                  introActive
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-muted text-muted-foreground hover:border-primary/40',
                )}
              >
                <BookOpen className="size-3.5" />
                Intro
              </button>
              {qs.map((question, index) => {
                const isCurrent =
                  activeMondai === mondaiKey &&
                  view === 'question' &&
                  questionIndex === index;
                const isAnswered = Boolean(answers[question.id]);
                const isFlagged = flagged.has(question.id);

                return (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() =>
                      onNavigate({ kind: 'question', mondai: mondaiKey, questionIndex: index })
                    }
                    className={cn(
                      'flex size-10 items-center justify-center rounded-xl border-2 text-xs font-bold',
                      isCurrent && 'border-primary bg-primary text-primary-foreground',
                      !isCurrent && isFlagged && 'border-amber-400 bg-amber-50 text-amber-700',
                      !isCurrent &&
                        !isFlagged &&
                        isAnswered &&
                        'border-emerald-400 bg-emerald-50 text-emerald-700',
                      !isCurrent &&
                        !isFlagged &&
                        !isAnswered &&
                        'border-border bg-muted text-muted-foreground',
                    )}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
