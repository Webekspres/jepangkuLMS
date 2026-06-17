'use client';

import Link from 'next/link';
import { SignUp } from '@clerk/nextjs';
import { useClerkAppearance } from '@/features/auth/hooks/use-clerk-appearance';
import { useClerkRedirectUrls } from '@/features/auth/hooks/use-clerk-redirect-urls';
import { AUTH_ROUTES } from '@/lib/auth/constants';
import { AuthPageShell } from './auth-page-shell';

/**
 * Sign-up shell + Clerk prebuilt SignUp.
 * Setelah Clerk session → dashboard (Core JWT di-sync di background).
 */
export function SignUpPage() {
  const { appearance, appearanceKey, mounted } = useClerkAppearance();
  const clerkUrls = useClerkRedirectUrls();

  return (
    <AuthPageShell
      brandPanel={{
        badge: '無料で始めよう',
        title: (
          <>
            Mulai Belajar
            <br />
            <span className="bg-linear-to-r from-brand-red to-brand-yellow bg-clip-text text-transparent">
              Bahasa Jepang
            </span>
            <br />
            <span className="text-white">Hari Ini</span>
          </>
        ),
        description:
          'Buat akun JepangKu gratis dan akses ribuan materi JLPT, kuis interaktif, serta sistem XP yang membuatmu betah belajar.',
      }}
      heading="Buat Akun Baru"
      subheading="Daftar gratis dan mulai perjalanan JLPT-mu bersama JepangKu."
      footer={
        <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
          Dengan mendaftar, kamu setuju dengan{' '}
          <Link href="/syarat-ketentuan" className="font-semibold text-primary hover:underline">
            Syarat & Ketentuan
          </Link>{' '}
          dan{' '}
          <Link href="/kebijakan-privasi" className="font-semibold text-primary hover:underline">
            Kebijakan Privasi
          </Link>{' '}
          JepangKu.
        </p>
      }
    >
      {mounted ? (
        <SignUp
          key={appearanceKey}
          routing="path"
          path={AUTH_ROUTES.signUp}
          signInUrl={clerkUrls.signIn}
          fallbackRedirectUrl={clerkUrls.postAuth}
          forceRedirectUrl={clerkUrls.postAuth}
          appearance={appearance}
        />
      ) : (
        <div aria-hidden className="h-[360px] animate-pulse rounded-2xl bg-muted/30" />
      )}
    </AuthPageShell>
  );
}
