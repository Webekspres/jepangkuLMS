'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Eye, EyeOff, UserPlus } from 'lucide-react';
import { BRAND_LOGO } from '@/lib/brand-logo';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AuthBrandPanel } from './auth-brand-panel';
import { AuthGoogleButton } from './auth-google-button';
import {
  INTEGRATION_MESSAGE_SIGNUP,
  authInputClass,
} from './auth-shared';

/**
 * Custom sign-up shell — selaras dengan login-page & DESIGN.md.
 * Auth: redirect ke Core/Clerk — bukan komponen bawaan Clerk.
 */
export function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const redirectToCoreAuth = async (provider?: 'google') => {
    // TODO: window.location.href = `${CORE_AUTH_URL}/register?return_to=...`
    await new Promise((r) => setTimeout(r, 600));
    setError(
      provider === 'google'
        ? `${INTEGRATION_MESSAGE_SIGNUP} (Google SSO)`
        : INTEGRATION_MESSAGE_SIGNUP,
    );
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Semua field wajib diisi.');
      return;
    }
    if (password.length < 8) {
      setError('Password minimal 8 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }
    if (!acceptedTerms) {
      setError('Anda harus menyetujui Syarat & Ketentuan.');
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

  const PasswordToggle = ({
    show,
    onToggle,
    label,
  }: {
    show: boolean;
    onToggle: () => void;
    label: string;
  }) => (
    <button
      type="button"
      onClick={onToggle}
      className="absolute top-1/2 right-4 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
      aria-label={label}
    >
      {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </button>
  );

  return (
    <div className="flex min-h-screen font-sans">
      <AuthBrandPanel
        badge="無料で始めよう"
        title={
          <>
            Mulai Belajar
            <br />
            <span className="bg-linear-to-r from-brand-red to-brand-yellow bg-clip-text text-transparent">
              Bahasa Jepang
            </span>
            <br />
            <span className="text-white">Hari Ini</span>
          </>
        }
        description="Buat akun JepangKu gratis dan akses ribuan materi JLPT, kuis interaktif, serta sistem XP yang membuatmu betah belajar."
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
            <h2 className="mb-2 text-3xl font-extrabold text-foreground">Buat Akun Baru</h2>
            <p className="text-sm text-muted-foreground">
              Daftar gratis dan mulai perjalanan JLPT-mu bersama JepangKu.
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

          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-foreground">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Kenji Tanaka"
                autoComplete="name"
                className={authInputClass(Boolean(name))}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-foreground">Email</label>
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
              <label className="mb-1.5 block text-sm font-semibold text-foreground">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  autoComplete="new-password"
                  className={cn(authInputClass(Boolean(password)), 'pr-12')}
                />
                <PasswordToggle
                  show={showPassword}
                  onToggle={() => setShowPassword(!showPassword)}
                  label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-foreground">
                Konfirmasi Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password"
                  autoComplete="new-password"
                  className={cn(authInputClass(Boolean(confirmPassword)), 'pr-12')}
                />
                <PasswordToggle
                  show={showConfirmPassword}
                  onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                  label={
                    showConfirmPassword
                      ? 'Sembunyikan konfirmasi password'
                      : 'Tampilkan konfirmasi password'
                  }
                />
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-muted/30 p-3">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 size-4 shrink-0 accent-primary"
              />
              <span className="text-xs leading-relaxed text-muted-foreground">
                Saya setuju dengan{' '}
                <Link href="/syarat-ketentuan" className="font-semibold text-primary hover:underline">
                  Syarat & Ketentuan
                </Link>{' '}
                dan{' '}
                <Link href="/kebijakan-privasi" className="font-semibold text-primary hover:underline">
                  Kebijakan Privasi
                </Link>{' '}
                JepangKu.
              </span>
            </label>

            <Button
              type="submit"
              disabled={loading}
              size="lg"
              className={cn(
                'mt-2 w-full py-4 text-sm font-bold',
                loading && 'cursor-not-allowed opacity-70',
              )}
            >
              {loading ? (
                <>
                  <span className="size-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Membuat akun...
                </>
              ) : (
                <>
                  <UserPlus className="size-4" />
                  Daftar Sekarang
                </>
              )}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium text-muted-foreground">atau daftar dengan</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <AuthGoogleButton
            loading={googleLoading}
            onClick={handleGoogle}
            idleLabel="Daftar dengan Google"
            loadingLabel="Menghubungkan Google..."
          />

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Sudah punya akun?{' '}
            <Link href="/sign-in" className="font-bold text-primary hover:underline">
              Masuk di sini
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
