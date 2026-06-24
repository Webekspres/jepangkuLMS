'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { BrandLogo } from '@/components/brand-logo';
import { ThemeToggle } from '@/components/theme/theme-toggle';
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

      <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-background px-6 py-10 sm:px-12 lg:w-1/2">
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
          <ThemeToggle />
        </div>

        <div className="mb-8 text-center lg:hidden">
          <Link href="/" className="inline-block">
            <BrandLogo variant="authForm" priority />
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
