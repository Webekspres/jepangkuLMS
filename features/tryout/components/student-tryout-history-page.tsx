'use client';

import Link from 'next/link';
import { ArrowLeft, BarChart3, Calendar, ChevronRight, ClipboardList } from 'lucide-react';
import type { StudentTryoutHistoryItem } from '@/features/tryout/lib/load-student-tryout-history';
import { JLPT_TOTAL_MAX_SCORE } from '@/features/tryout/lib/jlpt-cefr-reference';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const CEFR_STYLES: Record<string, string> = {
  A1: 'bg-pink-500/10 text-pink-700',
  A2: 'bg-amber-500/10 text-amber-700',
  B1: 'bg-emerald-500/10 text-emerald-700',
  B2: 'bg-blue-500/10 text-blue-700',
  C1: 'bg-violet-500/10 text-violet-700',
};

type StudentTryoutHistoryPageProps = {
  items: StudentTryoutHistoryItem[];
};

export function StudentTryoutHistoryPage({ items }: StudentTryoutHistoryPageProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
            <Link href={STUDENT_ROUTES.profil}>
              <ArrowLeft className="size-4" />
              Kembali ke Profil
            </Link>
          </Button>
          <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">Tryout JLPT Saya</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Riwayat simulasi ujian JLPT — buka kembali analisa skor dan review jawaban.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={STUDENT_ROUTES.tryout}>Pilih Sesi Baru</Link>
        </Button>
      </div>

      {items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-4 px-6 py-12 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <ClipboardList className="size-7" />
            </span>
            <div>
              <p className="font-semibold text-foreground">Belum ada riwayat tryout</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Selesaikan simulasi JLPT pertama kamu — hasil dan analisa akan tersimpan di sini.
              </p>
            </div>
            <Button asChild>
              <Link href={STUDENT_ROUTES.tryout}>Mulai Tryout JLPT</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const submittedLabel = new Date(item.submittedAt).toLocaleString('id-ID', {
              dateStyle: 'medium',
              timeStyle: 'short',
            });

            return (
              <Card key={item.attemptId} className="overflow-hidden border-border shadow-sm">
                <CardContent className="p-0">
                  <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="font-bold">
                          JLPT {item.level}
                        </Badge>
                        {item.passed ? (
                          <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10">
                            Lulus simulasi
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Belum lulus simulasi
                          </Badge>
                        )}
                        {item.indicatedCefr ? (
                          <Badge
                            className={cn(
                              'font-bold',
                              CEFR_STYLES[item.indicatedCefr] ?? 'bg-muted text-muted-foreground',
                            )}
                          >
                            CEFR {item.indicatedCefr}
                          </Badge>
                        ) : null}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{item.sessionTitle}</p>
                        {item.phaseLabel ? (
                          <p className="text-xs text-muted-foreground">{item.phaseLabel}</p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="size-3.5" />
                          {submittedLabel}
                        </span>
                        <span className="tabular-nums">
                          {item.correct}/{item.total} benar ({item.score}%)
                        </span>
                        <span className="tabular-nums">
                          Skor setara {item.scaledJlptScore}/{JLPT_TOTAL_MAX_SCORE}
                        </span>
                      </div>
                    </div>
                    <Button asChild className="w-full shrink-0 sm:w-auto">
                      <Link href={STUDENT_ROUTES.tryoutResult(item.attemptId)}>
                        <BarChart3 className="size-4" />
                        Lihat Analisa
                        <ChevronRight className="size-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
