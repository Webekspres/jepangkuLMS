'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Eye, EyeOff, Zap } from 'lucide-react';
import { BRAND_LOGO } from '@/lib/brand-logo';
import { cn } from '@/lib/utils';
import { AuthBrandPanel } from './auth-brand-panel';
import { AuthGoogleButton } from './auth-google-button';
import { INTEGRATION_MESSAGE_LOGIN, authInputClass } from './auth-shared';

/**
 * Custom login shell (Figma Make → adapted for Next.js).
 * Auth: redirect ke Core/Clerk — bukan Clerk `<SignIn />` default.
 * @see docs/ECOSYSTEM.md
 */
export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const redirectToCoreAuth = async (provider?: 'google') => {
    // TODO: window.location.href = `${CORE_AUTH_URL}/login?return_to=...&provider=google`
    await new Promise((r) => setTimeout(r, 600));
    setError(
      provider === 'google'
        ? `${INTEGRATION_MESSAGE_LOGIN} (Google SSO)`
        : INTEGRATION_MESSAGE_LOGIN,
    );
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Email dan password tidak boleh kosong.');
      return;
    }
    setLoading(true);
    try {
      await redirectToCoreAuth();
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await redirectToCoreAuth('google');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen font-sans">
      <AuthBrandPanel
        title={
          <>
            Platform LMS
            <br />
            <span className="bg-linear-to-r from-brand-red to-brand-yellow bg-clip-text text-transparent">
              Bahasa Jepang
            </span>
            <br />
            <span className="text-white">#1 Indonesia</span>
          </>
        }
        description="Kuasai JLPT N5 hingga N1 dengan metode gamifikasi yang membuat belajar terasa seperti bermain game."
      />

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
            <h2 className="mb-2 text-3xl font-extrabold text-foreground">Selamat Datang!</h2>
            <p className="text-sm text-muted-foreground">
              Masuk ke akun Jepangku-mu dan lanjutkan belajar.
            </p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
              >
                <AlertCircle className="size-4 shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-foreground">
                Email / Username
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                autoComplete="email"
                className={authInputClass(Boolean(email))}
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground">Password</label>
                <span className="cursor-not-allowed text-xs font-medium text-primary opacity-60">
                  Lupa password?
                </span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={cn(authInputClass(Boolean(password)), 'pr-12')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-4 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={!loading ? { scale: 1.02 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
              className={cn(
                'mt-2 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-primary-foreground transition-all',
                'bg-linear-to-br from-brand-red to-brand-orange',
                loading && 'cursor-not-allowed opacity-70',
              )}
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="size-5 rounded-full border-2 border-white/30 border-t-white"
                  />
                  Memverifikasi...
                </>
              ) : (
                <>                  
                  Masuk ke Dashboard
                </>
              )}
            </motion.button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium text-muted-foreground">atau masuk dengan</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <AuthGoogleButton
            loading={googleLoading}
            onClick={handleGoogle}
            idleLabel="Masuk dengan Google"
            loadingLabel="Menghubungkan Google..."
          />

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Belum punya akun?{' '}
            <Link href="/sign-up" className="font-bold text-primary hover:underline">
              Daftar Sekarang
            </Link>
          </p>
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
