'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, Clock } from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';
import { cn } from '@/lib/utils';

type TryoutFocusShellProps = {
  sessionTitle: string;
  level: string;
  timeLeft: number;
  isUrgent: boolean;
  formatTime: (seconds: number) => string;
  children: React.ReactNode;
};

export function TryoutFocusShell({
  sessionTitle,
  level,
  timeLeft,
  isUrgent,
  formatTime,
  children,
}: TryoutFocusShellProps) {
  const router = useRouter();
  const [showExitDialog, setShowExitDialog] = useState(false);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-50 border-b border-border bg-card shadow-sm">
        <div className="flex items-center justify-between gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3 md:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <BrandLogo variant="nav" className="pointer-events-none h-7 w-auto shrink-0 opacity-90 sm:h-9" />
            <div className="hidden h-6 w-px bg-border sm:block" />
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-foreground sm:text-sm">
                JLPT {level} — {sessionTitle}
              </p>
              <p className="hidden text-[10px] font-medium tracking-wide text-muted-foreground uppercase sm:block">
                Mode ujian · fokus
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <ThemeToggle size="icon-sm" />
            <div
              className={cn(
                'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold tabular-nums',
                isUrgent ? 'bg-destructive/10 text-destructive' : 'bg-muted text-foreground',
              )}
            >
              <Clock className="size-3.5" />
              {formatTime(timeLeft)}
              {isUrgent ? <AlertTriangle className="size-3.5" /> : null}
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowExitDialog(true)}>
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-2 py-3 sm:px-4 sm:py-6 md:px-8">{children}</main>

      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Keluar dari ujian?</DialogTitle>
            <DialogDescription>
              Progress jawaban di sesi ini belum disimpan jika kamu keluar sekarang. Yakin ingin
              meninggalkan ujian?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExitDialog(false)}>
              Tetap di Ujian
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowExitDialog(false);
                router.push(STUDENT_ROUTES.tryout);
              }}
            >
              Ya, Keluar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Review / hasil page — minimal header with back to tryout */
export function TryoutReviewShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-50 border-b border-border bg-card shadow-sm">
        <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-3 md:px-8">
          <Link href={STUDENT_ROUTES.home} className="inline-block shrink-0">
            <BrandLogo variant="nav" />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle size="icon-sm" />
            <Button asChild variant="outline" size="sm">
              <Link href={STUDENT_ROUTES.tryout}>← Pilih Sesi Tryout</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  );
}
