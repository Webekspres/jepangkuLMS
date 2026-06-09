'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useAuth, useClerk } from '@clerk/nextjs';
import { AUTH_ROUTES } from '@/lib/auth/constants';
import { resolvePostAuthRedirect } from '@/lib/auth/oauth-urls';
import { Button } from '@/components/ui/button';
import { syncCoreSessionAndRedirect } from '@/features/auth/lib/sync-core-session';

const SESSION_WAIT_MS = 2500;
/** Retry Core exchange can take ~12s server-side */
const EXCHANGE_UI_TIMEOUT_MS = 20_000;

/** Post-OAuth / post-login: Clerk session → Core JWT → dashboard */
export function AuthCompletePage() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { signOut } = useClerk();
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [isExchanging, setIsExchanging] = useState(false);
  const exchangeGeneration = useRef(0);

  const runExchange = (generation: number) => {
    setIsExchanging(true);
    setError(null);
    setErrorCode(null);

    void syncCoreSessionAndRedirect(resolvePostAuthRedirect()).then((result) => {
      if (generation !== exchangeGeneration.current) return;
      setIsExchanging(false);
      if (result.ok) return;
      setError(result.message);
      setErrorCode(result.code ?? null);
    });
  };

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !userId) {
      const timer = window.setTimeout(() => {
        window.location.replace(AUTH_ROUTES.signIn);
      }, SESSION_WAIT_MS);
      return () => window.clearTimeout(timer);
    }

    const generation = ++exchangeGeneration.current;
    runExchange(generation);

    return () => {
      exchangeGeneration.current += 1;
    };
  }, [isLoaded, isSignedIn, userId]);

  useEffect(() => {
    if (!isExchanging || error) return;

    const timer = window.setTimeout(() => {
      setIsExchanging(false);
      setError('Koneksi ke Core terlalu lama. Coba lagi atau lewati ke beranda.');
      setErrorCode('TIMEOUT');
    }, EXCHANGE_UI_TIMEOUT_MS);

    return () => window.clearTimeout(timer);
  }, [isExchanging, error]);

  const handleSignOut = () => {
    void signOut({ redirectUrl: AUTH_ROUTES.signIn });
  };

  const handleRetry = () => {
    const generation = ++exchangeGeneration.current;
    runExchange(generation);
  };

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md space-y-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="font-semibold text-destructive">Gagal masuk ke Core</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <p className="text-xs text-muted-foreground">
            Clerk SSO sudah OK — langkah ini menukar sesi Clerk → JWT Core (
            <code className="text-[11px]">POST /api/v1/auth/token</code>).
            {errorCode ? (
              <>
                {' '}
                Kode error: <code className="text-[11px]">{errorCode}</code>
              </>
            ) : null}
          </p>
          {errorCode === 'USER_NOT_FOUND' ? (
            <p className="text-xs text-muted-foreground">
              Untuk akun baru: pastikan Clerk webhook mengarah ke{' '}
              <code className="text-[11px]">https://core.jepangku.com/api/v1/auth/webhooks/clerk</code>{' '}
              (bukan ke LMS).
            </p>
          ) : null}
          {errorCode === 'INTERNAL_ERROR' ? (
            <p className="text-xs text-muted-foreground">
              Akun yang sama bisa jalan di Portal Berita — minta tim Core cek log server saat endpoint
              di atas dipanggil dari LMS.
            </p>
          ) : null}
          <div className="flex flex-col gap-2">
            <Button size="sm" onClick={handleRetry}>
              Coba lagi
            </Button>
            <Button asChild variant="default" size="sm">
              <Link href={AUTH_ROUTES.dashboard}>Lanjut ke dashboard</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/">Kembali ke beranda</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Keluar & ganti akun
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4">
      <span className="size-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      <p className="text-sm text-muted-foreground">Menghubungkan ke JepangKu Core...</p>
      <p className="max-w-xs text-center text-xs text-muted-foreground">
        Proses ini bisa memakan hingga ~15 detik saat Core sedang retry.
      </p>
      <Button asChild variant="ghost" size="sm" className="mt-2">
        <Link href={AUTH_ROUTES.dashboard}>Lewati & ke dashboard</Link>
      </Button>
    </div>
  );
}
