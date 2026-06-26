'use client';

import { SignIn } from '@clerk/nextjs';
import { useClerkAppearance } from '@/features/auth/hooks/use-clerk-appearance';
import { useClerkRedirectUrls } from '@/features/auth/hooks/use-clerk-redirect-urls';
import { AUTH_ROUTES } from '@/lib/auth/constants';
import { AuthPageShell } from './auth-page-shell';

/**
 * Login shell (brand panel kiri) + Clerk prebuilt SignIn (kanan).
 * Setelah Clerk session → dashboard (Core JWT di-sync di background).
 */
export function LoginPage() {
  const { appearance, appearanceKey, mounted } = useClerkAppearance();
  const clerkUrls = useClerkRedirectUrls();

  return (
    <AuthPageShell
      brandPanel={{
        title: (
          <>
            Platform LMS
            <br />
            <span className="bg-linear-to-r from-brand-red to-brand-yellow bg-clip-text text-transparent">
              Bahasa Jepang
            </span>
            <br />
            <span className="text-white">#1 Indonesia</span>
          </>
        ),
        description:
          'Kuasai JLPT N5 hingga N1 dengan metode gamifikasi yang membuat belajar terasa seperti bermain game.',
      }}
      heading="Selamat Datang!"
      subheading="Masuk ke akun JepangKu dan lanjutkan belajar."
    >
      {mounted ? (
        <SignIn
          key={appearanceKey}
          routing="path"
          path={AUTH_ROUTES.signIn}
          signUpUrl={clerkUrls.signUp}
          fallbackRedirectUrl={clerkUrls.postAuth}
          forceRedirectUrl={clerkUrls.postAuth}
          appearance={appearance}
        />
      ) : (
        <div aria-hidden className="h-[320px] animate-pulse rounded-2xl bg-muted/30" />
      )}
    </AuthPageShell>
  );
}
