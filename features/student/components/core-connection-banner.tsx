'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import { AlertCircle, LogOut, RefreshCw } from 'lucide-react';
import { syncCoreSessionSilent } from '@/features/auth/lib/sync-core-session';
import { requestStudentCoreDataRefresh } from '@/features/student/lib/student-core-data-events';
import { signOutFromApp } from '@/lib/auth/sign-out-client';
import { Button } from '@/components/ui/button';
import { useStudentCoreData } from './student-core-data-context';

/** Peringatan saat Clerk OK tapi Core JWT belum tersedia — selalu sediakan keluar. */
export function CoreConnectionBanner() {
  const router = useRouter();
  const { signOut } = useClerk();
  const core = useStudentCoreData();
  const [retrying, setRetrying] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  if (core.status === 'loading' || core.coreConnected || !core.coreSyncWarning) {
    return null;
  }

  const handleRetry = async () => {
    setRetrying(true);
    try {
      const ok = await syncCoreSessionSilent();
      if (ok) {
        requestStudentCoreDataRefresh();
        router.refresh();
      }
    } finally {
      setRetrying(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOutFromApp(signOut);
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div
      role="status"
      className="border-b border-amber-500/25 bg-amber-500/10 px-4 py-3 md:px-8"
    >
      <div className="container mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-2.5">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="min-w-0 text-sm">
            <p className="font-semibold text-foreground">Profil belajar belum siap</p>
            <p className="text-muted-foreground">
              XP dan leaderboard sedang disinkronkan. Coba lagi atau keluar untuk ganti akun.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={retrying || signingOut}
            onClick={() => void handleRetry()}
            className="gap-1.5"
          >
            <RefreshCw className={cnIcon(retrying)} />
            {retrying ? 'Menghubungkan…' : 'Coba lagi'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={retrying || signingOut}
            onClick={() => void handleSignOut()}
            className="gap-1.5"
          >
            <LogOut className="size-3.5" />
            {signingOut ? 'Keluar…' : 'Keluar'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function cnIcon(spinning: boolean) {
  return spinning ? 'size-3.5 animate-spin' : 'size-3.5';
}
