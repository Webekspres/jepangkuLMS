'use client';

import Link from 'next/link';
import { AuthenticateWithRedirectCallback, ClerkLoaded, useAuth, useClerk } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { AUTH_ROUTES } from '@/lib/auth/constants';
import {
  getClerkPostAuthRedirectUrl,
  getClerkSignInPageUrl,
  getClerkSignUpPageUrl,
} from '@/lib/auth/clerk-redirect-urls';
import { resetClerkOAuthSession } from '@/lib/auth/reset-clerk-session';
import { Button } from '@/components/ui/button';

function SsoCallbackHandler() {
  const { signOut } = useClerk();
  const { isLoaded, isSignedIn, userId } = useAuth();
  const [timedOut, setTimedOut] = useState(false);
  const [failedEarly, setFailedEarly] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Fallback: AuthenticateWithRedirectCallback kadang gagal redirect (Next.js router race)
  useEffect(() => {
    if (isLoaded && isSignedIn && userId) {
      window.location.assign(getClerkPostAuthRedirectUrl());
    }
  }, [isLoaded, isSignedIn, userId]);

  useEffect(() => {
    const timer = window.setTimeout(() => setTimedOut(true), 15000);
    return () => window.clearTimeout(timer);
  }, []);

  // OAuth selesai tapi tidak ada sesi — state stale / akun dari flow lama
  useEffect(() => {
    if (!isLoaded || isSignedIn) return;
    const timer = window.setTimeout(() => setFailedEarly(true), 5000);
    return () => window.clearTimeout(timer);
  }, [isLoaded, isSignedIn]);

  if ((timedOut || failedEarly) && !isSignedIn) {
    return (
      <div className="max-w-md space-y-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="font-semibold text-destructive">
          {timedOut ? 'OAuth timeout' : 'Login Google tidak selesai'}
        </p>
        <p className="text-sm text-muted-foreground">
          {timedOut ? (
            <>
              Login Google tidak selesai dalam 15 detik. Cek: (1) centang{' '}
              <strong>Verify you are human</strong> jika muncul; (2) Clerk Dashboard → Redirect
              URLs harus mencakup{' '}
              <code className="text-xs">/sign-in/sso-callback</code> dan wildcard ngrok{' '}
              <code className="text-xs">https://…ngrok-free.dev/*</code>.
            </>
          ) : (
            <>
              Google mengembalikan ke app tapi sesi Clerk tidak terbentuk. Akun yang pernah login
              saat redirect error sering perlu <strong>reset sesi</strong> atau dihapus dari Clerk
              Dashboard lalu daftar ulang.
            </>
          )}
        </p>
        <div className="flex flex-col gap-2">
          <Button asChild size="sm">
            <Link href={AUTH_ROUTES.signIn}>Kembali ke login</Link>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={resetting}
            onClick={() => {
              setResetting(true);
              void resetClerkOAuthSession(signOut).finally(() => setResetting(false));
            }}
          >
            {resetting ? 'Mereset…' : 'Reset sesi & coba lagi'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <AuthenticateWithRedirectCallback
        signInUrl={getClerkSignInPageUrl()}
        signUpUrl={getClerkSignUpPageUrl()}
        signInFallbackRedirectUrl={getClerkPostAuthRedirectUrl()}
        signUpFallbackRedirectUrl={getClerkPostAuthRedirectUrl()}
        signInForceRedirectUrl={getClerkPostAuthRedirectUrl()}
        signUpForceRedirectUrl={getClerkPostAuthRedirectUrl()}
      />
      <span className="size-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      <p className="text-sm text-muted-foreground">Menyelesaikan login Google...</p>
    </>
  );
}

/** Unified OAuth callback — sign-in & sign-up Google */
export function SsoCallbackPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
      <div id="clerk-captcha" />
      <ClerkLoaded>
        <SsoCallbackHandler />
      </ClerkLoaded>
    </div>
  );
}
