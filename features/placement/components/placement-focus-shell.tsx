'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
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

type PlacementFocusShellProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export function PlacementFocusShell({ title, subtitle, children }: PlacementFocusShellProps) {
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
              <p className="truncate text-xs font-bold text-foreground sm:text-sm">{title}</p>
              <p className="hidden text-[10px] font-medium tracking-wide text-muted-foreground uppercase sm:block">
                {subtitle ?? 'Tes penempatan · fokus'}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="hover:brightness-100 hover:text-foreground!"
            onClick={() => setShowExitDialog(true)}
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Keluar</span>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-2 py-3 sm:px-4 sm:py-6 md:px-8">{children}</main>

      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-600" />
              Keluar dari tes?
            </DialogTitle>
            <DialogDescription>
              Jawaban yang belum dikirim tidak tersimpan. Audio Choukai akan berhenti jika kamu keluar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setShowExitDialog(false)}>
              Lanjut tes
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowExitDialog(false);
                router.push(STUDENT_ROUTES.placement);
              }}
            >
              Ya, keluar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function PlacementResultShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-50 border-b border-border bg-card shadow-sm">
        <div className="flex items-center justify-between gap-2 px-3 py-2.5 sm:px-4 md:px-8">
          <BrandLogo variant="nav" className="h-7 w-auto sm:h-9" />
          <Button asChild variant="outline" size="sm">
            <Link href={STUDENT_ROUTES.placement}>
              <ArrowLeft className="size-4" />
              Kembali
            </Link>
          </Button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-xl px-3 py-4 sm:px-4 sm:py-8">{children}</main>
    </div>
  );
}
