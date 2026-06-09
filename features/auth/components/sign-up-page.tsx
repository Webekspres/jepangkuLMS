'use client';

import Link from 'next/link';
import { SignUp } from '@clerk/nextjs';
import { AUTH_ROUTES } from '@/lib/auth/constants';
import { AuthPageShell } from './auth-page-shell';
import { clerkAppearance } from './clerk-appearance';

/**
 * Sign-up shell + Clerk prebuilt SignUp.
 * Setelah Clerk session → dashboard (Core JWT di-sync di background).
 */
export function SignUpPage() {
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
      <SignUp
        routing="path"
        path={AUTH_ROUTES.signUp}
        signInUrl={AUTH_ROUTES.signIn}
        fallbackRedirectUrl={AUTH_ROUTES.dashboard}
        forceRedirectUrl={AUTH_ROUTES.dashboard}
        appearance={clerkAppearance}
      />
    </AuthPageShell>
  );
}
