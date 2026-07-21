'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KanaChartGrid } from '@/features/kana/components/kana-chart-grid';
import { getKanaChartData } from '@/features/kana/lib/kana-data';
import type { KanaScript } from '@/features/kana/lib/kana-types';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';
import { cn } from '@/lib/utils';

type KanaChartPageProps = {
  script: KanaScript;
};

export function KanaChartPage({ script }: KanaChartPageProps) {
  const chart = getKanaChartData(script);
  const otherScript = script === 'hiragana' ? 'katakana' : 'hiragana';
  const otherLabel = otherScript === 'hiragana' ? 'Hiragana' : 'Katakana';

  return (
    <div className="pb-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Button asChild variant="ghost" size="sm" className="-ml-2 h-8 gap-1.5 px-2">
            <Link href={STUDENT_ROUTES.kana}>
              <ArrowLeft className="size-4" />
              Kembali
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{chart.title}</h1>
            <p className="text-sm text-muted-foreground">
              Klik karakter untuk lihat animasi penulisan, bunyi, dan contoh kosakata.
            </p>
          </div>
        </div>

        <div className="flex rounded-xl border border-border bg-muted/40 p-1">
          <Link
            href={STUDENT_ROUTES.kanaScript('hiragana')}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
              script === 'hiragana'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Hiragana
          </Link>
          <Link
            href={STUDENT_ROUTES.kanaScript('katakana')}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
              script === 'katakana'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Katakana
          </Link>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-border bg-card/60 px-4 py-3 text-sm text-muted-foreground">
        Belajar {otherLabel}?{' '}
        <Link
          href={STUDENT_ROUTES.kanaScript(otherScript)}
          className="font-semibold text-primary hover:underline"
        >
          Buka chart {otherLabel}
        </Link>
      </div>

      <div className="space-y-8">
        {chart.sections.map((section) => (
          <KanaChartGrid key={section.id} section={section} />
        ))}
      </div>
    </div>
  );
}
