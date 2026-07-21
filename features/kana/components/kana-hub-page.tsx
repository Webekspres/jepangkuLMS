'use client';

import Link from 'next/link';
import { BookOpen, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';
import { cn } from '@/lib/utils';

const SCRIPT_CARDS = [
  {
    script: 'hiragana' as const,
    title: 'Hiragana',
    desc: 'Aksara fonetik dasar untuk kata asli Jepang, tata bahasa, dan partikel.',
    sample: 'あいうえお',
    href: STUDENT_ROUTES.kanaScript('hiragana'),
  },
  {
    script: 'katakana' as const,
    title: 'Katakana',
    desc: 'Aksara untuk kata serapan, nama asing, dan penekanan tertentu.',
    sample: 'アイウエオ',
    href: STUDENT_ROUTES.kanaScript('katakana'),
  },
];

export function KanaHubPage() {
  return (
    <div className="pb-10">
      <div className="mb-8 space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
          <Languages className="size-3.5 text-primary" />
          Belajar Aksara
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Hiragana & Katakana
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Jelajahi chart interaktif lengkap dengan bunyi pengucapan, animasi cara menulis, dan
          contoh kosakata. Cocok untuk pemula sebelum atau sambil mengikuti modul aksara N5.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {SCRIPT_CARDS.map((card) => (
          <Link
            key={card.script}
            href={card.href}
            className={cn(
              'group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all',
              'hover:border-primary/40 hover:shadow-md',
            )}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-foreground">{card.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{card.desc}</p>
              </div>
              <span className="rounded-xl bg-primary/10 px-3 py-2 text-lg font-bold text-primary">
                {card.sample}
              </span>
            </div>
            <span className="text-sm font-semibold text-primary group-hover:underline">
              Buka chart →
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-muted/30 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BookOpen className="size-5" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Lanjut ke kursus N5</p>
              <p className="text-sm text-muted-foreground">
                Modul aksara di kursus mencakup flashcard dan latihan terstruktur.
              </p>
            </div>
          </div>
          <Button asChild variant="outline" className="shrink-0">
            <Link href={STUDENT_ROUTES.kursus}>Lihat katalog kursus</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
