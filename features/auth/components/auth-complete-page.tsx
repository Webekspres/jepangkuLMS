'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useAuth, useClerk } from '@clerk/nextjs';
import { Loader2 } from 'lucide-react';
import { AUTH_ROUTES } from '@/lib/auth/constants';
import { resolvePostAuthRedirect } from '@/lib/auth/oauth-urls';
import { isCoreIntegrationEnabled } from '@/lib/core/integration-config';
import { Button } from '@/components/ui/button';
import { syncCoreSessionAndRedirect } from '@/features/auth/lib/sync-core-session';
import { signOutFromApp } from '@/lib/auth/sign-out-client';

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

  const isProd = process.env.NODE_ENV === 'production';

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

    if (!isCoreIntegrationEnabled()) {
      window.location.replace(resolvePostAuthRedirect());
      return;
    }

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
      setError('Sinkronisasi profil terlalu lama. Coba lagi atau lewati ke beranda.');
      setErrorCode('TIMEOUT');
    }, EXCHANGE_UI_TIMEOUT_MS);

    return () => window.clearTimeout(timer);
  }, [isExchanging, error]);

  const handleSignOut = () => {
    void signOutFromApp(signOut);
  };

  const handleRetry = () => {
    const generation = ++exchangeGeneration.current;
    runExchange(generation);
  };

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md space-y-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="font-semibold text-destructive">Gagal menyiapkan profil</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          {errorCode ? (
            <p className="text-xs text-muted-foreground">
              Kode error: <code className="text-[11px]">{errorCode}</code>
            </p>
          ) : null}
          <div className="flex flex-col gap-2">
            <Button size="sm" onClick={handleRetry}>
              Coba lagi
            </Button>
            {!isProd && (
              <Button asChild variant="default" size="sm">
                <Link href={AUTH_ROUTES.dashboard}>Lanjut ke dashboard (Dev Bypass)</Link>
              </Button>
            )}
            <Button asChild variant="outline" size="sm">
              <Link href="/">Kembali ke beranda</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Keluar &amp; ganti akun
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-foreground relative overflow-hidden">
      <div className="flex flex-col items-center gap-8 sm:gap-10">
        <div className="flex flex-col items-center gap-6 sm:gap-8">
          <Image
            src="/brand/logo.png"
            alt="JepangKu"
            width={280}
            height={80}
            className="h-20 w-auto object-contain sm:h-24 animate-pulse"
            priority
          />
          <div className="flex items-center gap-2.5 text-sm font-medium text-muted-foreground tracking-wide select-none">
            <Loader2 className="size-4 animate-spin text-primary" />
            <span>Menyiapkan profil belajar Anda…</span>
          </div>
        </div>
      </div>

      {!isProd && (
        <Button asChild variant="ghost" size="sm" className="mt-8 text-muted-foreground hover:text-foreground">
          <Link href={AUTH_ROUTES.dashboard}>Lewati &amp; ke dashboard (Dev Bypass)</Link>
        </Button>
      )}
    </div>
  );
}
