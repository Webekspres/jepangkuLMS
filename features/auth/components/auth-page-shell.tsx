'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import { BRAND_LOGO } from '@/lib/brand-logo';
import { AuthBrandPanel } from './auth-brand-panel';

type AuthPageShellProps = {
  brandPanel: {
    badge?: string;
    title: React.ReactNode;
    description: string;
  };
  heading: string;
  subheading: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function AuthPageShell({
  brandPanel,
  heading,
  subheading,
  children,
  footer,
}: AuthPageShellProps) {
  return (
    <div className="flex min-h-screen font-sans">
      <AuthBrandPanel {...brandPanel} />

      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background px-6 py-10 sm:px-12 lg:w-1/2">
        <div className="mb-8 text-center lg:hidden">
          <Link href="/" className="inline-block">
            <Image
              src="/brand/logo.png"
              alt="JepangKu"
              width={BRAND_LOGO.authForm.width}
              height={BRAND_LOGO.authForm.height}
              className={BRAND_LOGO.authForm.className}
              priority
            />
          </Link>
        </div>

        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-8 text-center lg:text-left">
            <h2 className="mb-2 text-3xl font-extrabold text-foreground">{heading}</h2>
            <p className="text-sm text-muted-foreground">{subheading}</p>
          </div>

          {children}

          {footer}
        </motion.div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
