'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertCircle,
  BookOpen,
  Eye,
  EyeOff,
  Trophy,
  Video,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/** Decorative seigaiha — white strokes only, opacity via SVG */
const SEIGAIHA = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Ccircle cx='30' cy='40' r='28' fill='none' stroke='%23ffffff' stroke-width='0.8' stroke-opacity='0.08'/%3E%3Ccircle cx='0' cy='40' r='28' fill='none' stroke='%23ffffff' stroke-width='0.8' stroke-opacity='0.08'/%3E%3Ccircle cx='60' cy='40' r='28' fill='none' stroke='%23ffffff' stroke-width='0.8' stroke-opacity='0.08'/%3E%3Ccircle cx='15' cy='14' r='28' fill='none' stroke='%23ffffff' stroke-width='0.8' stroke-opacity='0.08'/%3E%3Ccircle cx='45' cy='14' r='28' fill='none' stroke='%23ffffff' stroke-width='0.8' stroke-opacity='0.08'/%3E%3C/svg%3E")`;

const VALUE_PROPS = [
  {
    icon: BookOpen,
    title: '1000+ Video Lesson',
    desc: 'VOD berkualitas HD dari N5 hingga N1',
  },
  {
    icon: Trophy,
    title: 'Gamifikasi XP & Badge',
    desc: 'Belajar lebih seru dengan sistem reward',
  },
  {
    icon: Zap,
    title: 'JLPT Try Out Center',
    desc: 'Simulasi ujian JLPT resmi & analitik skor',
  },
  {
    icon: Video,
    title: 'Live Class via Zoom',
    desc: 'Sesi langsung bersama sensei berpengalaman',
  },
] as const;

const FLOATING_KANJI = ['日', '本', '語', '学', '漢', '字'] as const;

const INTEGRATION_MESSAGE =
  'Login SSO via Core Backend sedang diintegrasikan. UI siap — auth menyusul kontrak Sultan.';

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
        ? `${INTEGRATION_MESSAGE} (Google SSO)`
        : INTEGRATION_MESSAGE,
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

  const inputClass = (hasValue: boolean) =>
    cn(
      'w-full rounded-2xl border-2 bg-background px-4 py-3.5 text-sm text-foreground outline-none transition-all',
      hasValue ? 'border-primary bg-primary/5' : 'border-border',
      'focus:border-primary',
    );

  return (
    <div className="flex min-h-screen font-sans">
      {/* Left brand panel — desktop */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-navy via-secondary to-brand-navy lg:flex lg:w-1/2">
        <div
          className="absolute inset-0 opacity-60"
          style={{ backgroundImage: SEIGAIHA, backgroundSize: '60px 60px' }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_60%,color-mix(in_srgb,var(--primary)_18%,transparent),transparent_65%)]" />

        {FLOATING_KANJI.map((char, i) => (
          <motion.div
            key={char}
            className="pointer-events-none absolute select-none text-white/5"
            style={{
              fontSize: `${60 + (i % 3) * 40}px`,
              left: `${(i * 17 + 5) % 85}%`,
              top: `${(i * 23 + 8) % 80}%`,
            }}
            animate={{ y: [0, -16, 0], opacity: [0.04, 0.12, 0.04] }}
            transition={{ duration: 5 + i, repeat: Infinity, delay: i * 0.8 }}
          >
            {char}
          </motion.div>
        ))}

        <div className="relative z-10 flex h-full flex-col justify-between p-10">
          <Link href="/" className="inline-block">
            <Image
              src="/brand/logo-white.png"
              alt="JepangKu"
              width={180}
              height={48}
              className="h-11 w-auto object-contain"
              priority
            />
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/15 px-4 py-2">
              <span className="text-sm text-white/60">日本語を楽しく学ぼう</span>
            </div>
            <h1 className="mb-4 text-[2.5rem] font-black leading-[1.15] text-white">
              Platform LMS
              <br />
              <span className="bg-gradient-to-r from-brand-red to-brand-yellow bg-clip-text text-transparent">
                Bahasa Jepang
              </span>
              <br />
              <span className="text-white">#1 Indonesia</span>
            </h1>
            <p className="mb-8 max-w-sm text-base leading-relaxed text-white/60">
              Kuasai JLPT N5 hingga N1 dengan metode gamifikasi yang membuat belajar
              terasa seperti bermain game.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {VALUE_PROPS.map((vp, i) => (
                <motion.div
                  key={vp.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-brand-red">
                    <vp.icon className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{vp.title}</p>
                    <p className="mt-0.5 text-xs text-white/40">{vp.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex items-center gap-6"
          >
            {[
              { val: '32K+', label: 'Pelajar Aktif' },
              { val: '98%', label: 'Tingkat Lulus' },
              { val: 'N5–N1', label: 'Level Lengkap' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-xl font-black text-white">{s.val}</p>
                <p className="text-xs text-white/40">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background px-6 py-10 sm:px-12 lg:w-1/2">
        <div className="mb-8 text-center lg:hidden">
          <Link href="/" className="inline-block">
            <Image
              src="/brand/logo.png"
              alt="JepangKu"
              width={150}
              height={40}
              className="h-9 w-auto object-contain"
              priority
            />
          </Link>
        </div>

        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-8">
            <h2 className="mb-2 text-3xl font-extrabold text-foreground">
              Selamat Datang!
            </h2>
            <p className="text-sm text-muted-foreground">
              Masuk ke akun Jepangku dan lanjutkan belajar.
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
                className={inputClass(Boolean(email))}
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
                  className={cn(inputClass(Boolean(password)), 'pr-12')}
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
                'bg-gradient-to-br from-brand-red to-brand-orange',
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
                  <Zap className="size-4" />
                  Masuk ke Dashboard
                </>
              )}
            </motion.button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium text-muted-foreground">
              atau masuk dengan
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <motion.button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            whileHover={!googleLoading ? { scale: 1.01 } : {}}
            whileTap={!googleLoading ? { scale: 0.99 } : {}}
            className={cn(
              'flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-border py-3.5 text-sm font-semibold text-foreground transition-all hover:border-muted-foreground/30',
              googleLoading && 'cursor-not-allowed opacity-70',
            )}
          >
            {googleLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="size-5 rounded-full border-2 border-muted border-t-foreground"
              />
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                <path
                  d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
                  fill="#4285F4"
                />
                <path
                  d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
                  fill="#34A853"
                />
                <path
                  d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
                  fill="#FBBC05"
                />
                <path
                  d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                  fill="#EA4335"
                />
              </svg>
            )}
            {googleLoading ? 'Menghubungkan Google...' : 'Masuk dengan Google'}
          </motion.button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Belum punya akun?{' '}
            <Link href="/sign-up" className="font-bold text-primary hover:underline">
              Daftar Sekarang
            </Link>
          </p>

          <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3 text-center">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-primary">SSO:</span> Halaman custom ini
              akan mengarahkan ke Core Backend (Clerk) — bukan komponen bawaan Clerk.
            </p>
          </div>
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
