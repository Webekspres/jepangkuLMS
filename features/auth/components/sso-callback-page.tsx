'use client';

import Link from 'next/link';
import { AuthenticateWithRedirectCallback, ClerkLoaded, useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { AUTH_ROUTES } from '@/lib/auth/constants';
import { getClerkSignInUrl, getClerkSignUpUrl } from '@/lib/auth/clerk-urls';
import { Button } from '@/components/ui/button';

function SsoCallbackHandler() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  // Fallback: AuthenticateWithRedirectCallback kadang gagal redirect (Next.js router race)
  useEffect(() => {
    if (isLoaded && isSignedIn && userId) {
      window.location.assign(AUTH_ROUTES.dashboard);
    }
  }, [isLoaded, isSignedIn, userId]);

  useEffect(() => {
    const timer = window.setTimeout(() => setTimedOut(true), 15000);
    return () => window.clearTimeout(timer);
  }, []);

  if (timedOut && !isSignedIn) {
    return (
      <div className="max-w-md space-y-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="font-semibold text-destructive">OAuth timeout</p>
        <p className="text-sm text-muted-foreground">
          Login Google tidak selesai dalam 15 detik. Cek: (1) centang{' '}
          <strong>Verify you are human</strong> di atas jika muncul — itu Clerk Bot Protection
          (Turnstile), bukan Cloudflare domain kita; (2) Clerk Dashboard → Redirect URLs harus
          mencakup{' '}
          <code className="text-xs">/sign-in/sso-callback</code> dan wildcard ngrok{' '}
          <code className="text-xs">https://…ngrok-free.dev/*</code>.
        </p>
        <Button asChild size="sm">
          <Link href={AUTH_ROUTES.signIn}>Coba lagi</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <AuthenticateWithRedirectCallback
        signInUrl={getClerkSignInUrl()}
        signUpUrl={getClerkSignUpUrl()}
        signInFallbackRedirectUrl={AUTH_ROUTES.dashboard}
        signUpFallbackRedirectUrl={AUTH_ROUTES.dashboard}
        signInForceRedirectUrl={AUTH_ROUTES.dashboard}
        signUpForceRedirectUrl={AUTH_ROUTES.dashboard}
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
