'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { ChevronDown, Lock, Play } from 'lucide-react';
import { AnimatedCollapse } from '@/components/ui/animated-collapse';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { GroupedLesson } from '@/features/learning/lib/n5-lesson-modules';

export type SyllabusAccordionLesson = {
  slug: string;
  title: string;
  content?: string | null;
  hasQuiz?: boolean;
  locked?: boolean;
  href?: string;
};

type CourseSyllabusAccordionProps = {
  groups: GroupedLesson<SyllabusAccordionLesson>[];
  expandedIds: string[];
  onToggle: (moduleId: string) => void;
  /** Nomor lesson global (1-based) di header item */
  showGlobalIndex?: boolean;
};

export function CourseSyllabusAccordion({
  groups,
  expandedIds,
  onToggle,
  showGlobalIndex = true,
}: CourseSyllabusAccordionProps) {
  const groupStartIndices = useMemo(() => {
    const starts: number[] = [];
    let total = 0;
    for (const group of groups) {
      starts.push(total);
      total += group.lessons.length;
    }
    return starts;
  }, [groups]);

  return (
    <div className="space-y-3">
      {groups.map((group, groupIndex) => {
        const groupId = group.module;
        const isOpen = expandedIds.includes(groupId);
        const lessonCount = group.lessons.length;

        return (
          <div
            key={groupId}
            className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
          >
            <button
              type="button"
              onClick={() => onToggle(groupId)}
              className="flex w-full items-center gap-3 bg-muted/40 px-4 py-3 text-left transition-colors hover:bg-muted/60"
              aria-expanded={isOpen}
            >
              <ChevronDown
                className={cn(
                  'size-4 shrink-0 text-muted-foreground transition-transform duration-300 ease-out',
                  isOpen && 'rotate-180',
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{group.title}</p>
                <p className="text-xs text-muted-foreground">
                  {group.subtitle} · {lessonCount} pelajaran
                </p>
              </div>
              <Badge variant="outline" className="shrink-0 tabular-nums">
                {lessonCount}
              </Badge>
            </button>

            <AnimatedCollapse open={isOpen}>
              <ul className="divide-y divide-border border-t border-border">
                {group.lessons.map((lesson, lessonIndex) => {
                  const index = groupStartIndices[groupIndex] + lessonIndex + 1;
                  const row = (
                    <>
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {showGlobalIndex ? index : '·'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">{lesson.title}</p>
                        {lesson.content && (
                          <p className="line-clamp-1 text-xs text-muted-foreground">
                            {lesson.content}
                          </p>
                        )}
                      </div>
                      {lesson.locked ? (
                        <Lock className="size-4 shrink-0 text-muted-foreground" />
                      ) : lesson.hasQuiz ? (
                        <Badge variant="secondary" className="shrink-0">
                          Quiz
                        </Badge>
                      ) : !showGlobalIndex && lesson.content ? (
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {lesson.locked ? 'Terdaftar' : lesson.content}
                        </span>
                      ) : lesson.href ? (
                        <Play className="size-4 shrink-0 text-primary" />
                      ) : null}
                    </>
                  );

                  const className = cn(
                    'flex items-center gap-3 px-4 py-3 text-sm transition-colors',
                    lesson.locked && 'bg-muted/20 opacity-60',
                    lesson.href && !lesson.locked && 'hover:bg-muted/30',
                  );

                  return (
                    <li key={lesson.slug}>
                      {lesson.href && !lesson.locked ? (
                        <Link href={lesson.href} className={className}>
                          {row}
                        </Link>
                      ) : (
                        <div className={className}>{row}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </AnimatedCollapse>
          </div>
        );
      })}
    </div>
  );
}
