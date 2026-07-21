'use client';

import Link from 'next/link';
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
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{chart.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Klik karakter untuk lihat animasi penulisan, bunyi, dan contoh kosakata.
          </p>
        </div>

        <div className="flex w-fit rounded-xl border border-border bg-muted/40 p-1">
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
