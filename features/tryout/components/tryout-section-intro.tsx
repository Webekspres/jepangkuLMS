'use client';

import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TryoutSectionValue } from '@/features/admin-cms/lib/tryout-sections';
import { TRYOUT_SECTION_INSTRUCTIONS } from '@/features/tryout/lib/section-instructions';
import { cn } from '@/lib/utils';

const SECTION_COLORS: Record<string, string> = {
  MOJI_GOI: 'bg-blue-500',
  BUNPOU_DOKKAI: 'bg-violet-500',
  CHOKAI: 'bg-emerald-500',
};

type TryoutSectionIntroProps = {
  section: TryoutSectionValue;
  questionCount: number;
  sectionIndex: number;
  totalSections: number;
  onStart: () => void;
};

export function TryoutSectionIntro({
  section,
  questionCount,
  sectionIndex,
  totalSections,
  onStart,
}: TryoutSectionIntroProps) {
  const content = TRYOUT_SECTION_INSTRUCTIONS[section];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
          Bagian {sectionIndex + 1} dari {totalSections}
        </p>
        <span
          className={cn(
            'mt-3 inline-block rounded-lg px-3 py-1 text-sm font-bold text-white',
            SECTION_COLORS[section] ?? 'bg-muted-foreground',
          )}
        >
          {content.title}
        </span>
        <h1 className="mt-2 text-2xl font-extrabold text-foreground">{content.subtitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {questionCount} soal · {content.durationHint}
        </p>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">Petunjuk Pengerjaan</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {content.instructions.map((line) => (
              <li key={line} className="flex gap-2">
                <span className="text-primary">·</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-dashed border-border bg-muted/20">
        <CardHeader>
          <CardTitle className="text-base">Contoh Soal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p
            className="whitespace-pre-line text-sm leading-relaxed text-foreground"
            style={{ fontFamily: 'var(--font-noto-sans-jp, sans-serif)' }}
          >
            {content.example.prompt}
          </p>
          <div className="grid gap-2">
            {content.example.options.map((opt, i) => (
              <div
                key={opt}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5 text-sm"
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                  {String.fromCharCode(65 + i)}
                </span>
                <span style={{ fontFamily: 'var(--font-noto-sans-jp, sans-serif)' }}>{opt}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{content.example.note}</p>
        </CardContent>
      </Card>

      <div className="flex justify-center pt-2">
        <Button size="lg" className="min-w-[220px] gap-2 font-bold" onClick={onStart}>
          Mulai {content.title}
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
