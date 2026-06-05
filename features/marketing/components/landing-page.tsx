'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  GraduationCap,
  Menu,
  MessageCircle,
  Play,
  Sparkles,
  Star,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import { MARKETING_NAV_LINKS } from './marketing-nav-links';
import { MarketingFooter } from './marketing-footer';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  FLOATING_KANJI,
  JLPT_ACCENT,
  JLPT_LEVELS,
  LANDING_FEATURES,
  LANDING_PILLARS,
  LANDING_SEIGAIHA,
  LANDING_VALUE_PROPS,
  PRICING_PLANS,
} from './landing-data';

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const navText = scrolled ? 'text-foreground' : 'text-white/90';
  const navHover = scrolled ? 'hover:text-primary' : 'hover:text-white';

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* Navbar */}
      <motion.nav
        className={cn(
          'fixed top-0 right-0 left-0 z-50 transition-all duration-300',
          scrolled ? 'border-b border-border bg-background/95 shadow-md backdrop-blur-md' : 'bg-transparent',
        )}
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto flex items-center justify-between px-4 py-4 md:px-8">
          <Link href="/" className="inline-block">
            <Image
              src={scrolled ? '/brand/logo.png' : '/brand/logo-white.png'}
              alt="JepangKu"
              width={150}
              height={40}
              className="h-9 w-auto object-contain"
              priority
            />
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {MARKETING_NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn('text-sm font-medium transition-colors', navText, navHover)}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Button
              asChild
              variant="outline"
              className={cn(
                'h-10 rounded-full border-2 px-5 font-semibold shadow-sm transition-colors',
                scrolled
                  ? 'border-primary !bg-background !text-primary hover:!border-primary hover:!bg-primary/5 hover:!text-primary'
                  : '!border-white/80 !bg-white/10 !text-white hover:!border-white hover:!bg-white/25 hover:!text-white',
              )}
            >
              <Link href="/sign-in">Masuk</Link>
            </Button>
            <Button
              asChild
              className="h-10 rounded-full border-0 bg-gradient-to-br from-brand-red to-brand-orange px-5 font-semibold text-primary-foreground shadow-lg hover:opacity-90"
            >
              <Link href="/sign-up">Daftar Gratis</Link>
            </Button>
          </div>

          <button
            type="button"
            className={cn(
              'relative z-[60] rounded-lg p-1 md:hidden',
              scrolled ? 'text-foreground' : 'text-white',
            )}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <>
              <motion.button
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 top-16 z-40 bg-brand-navy/60 backdrop-blur-sm md:hidden"
                aria-label="Tutup menu"
                onClick={() => setMenuOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  'absolute top-full right-4 left-4 z-50 overflow-hidden rounded-2xl border shadow-2xl md:hidden',
                  scrolled
                    ? 'border-border bg-background/95 backdrop-blur-xl'
                    : 'border-white/15 bg-brand-navy/95 backdrop-blur-xl',
                )}
              >
                <nav className="flex flex-col p-2">
                  {MARKETING_NAV_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition-colors',
                        scrolled
                          ? 'text-foreground hover:bg-muted'
                          : 'text-white/90 hover:bg-white/10 hover:text-white',
                      )}
                    >
                      <link.icon className="size-4 shrink-0 opacity-70" />
                      {link.label}
                    </Link>
                  ))}
                </nav>
                <div
                  className={cn(
                    'flex flex-col gap-2 border-t p-4',
                    scrolled ? 'border-border bg-muted/30' : 'border-white/10 bg-black/20',
                  )}
                >
                  <Button
                    asChild
                    variant="outline"
                    className={cn(
                      'h-11 w-full rounded-full border-2 font-semibold',
                      scrolled
                        ? 'border-primary !text-primary hover:!bg-primary/5'
                        : '!border-white/80 !bg-transparent !text-white hover:!bg-white/15 hover:!text-white',
                    )}
                  >
                    <Link href="/sign-in" onClick={() => setMenuOpen(false)}>
                      Masuk
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="h-11 w-full rounded-full border-0 bg-gradient-to-br from-brand-red to-brand-orange font-semibold text-primary-foreground shadow-lg"
                  >
                    <Link href="/sign-up" onClick={() => setMenuOpen(false)}>
                      Daftar Gratis
                    </Link>
                  </Button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Hero */}
      <section className="relative flex min-h-screen items-center overflow-hidden bg-gradient-to-br from-brand-navy via-secondary to-brand-navy">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(LANDING_SEIGAIHA)}")`,
            backgroundSize: '60px 60px',
          }}
        />
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {FLOATING_KANJI.map((char, i) => (
            <motion.div
              key={char}
              className="absolute text-white/5 select-none"
              style={{
                fontSize: `${48 + (i % 3) * 24}px`,
                left: `${(i * 13) % 100}%`,
                top: `${(i * 17 + 5) % 90}%`,
              }}
              animate={{ y: [0, -20, 0], opacity: [0.04, 0.12, 0.04] }}
              transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.6 }}
            >
              {char}
            </motion.div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,color-mix(in_srgb,var(--primary)_20%,transparent),transparent_60%)]" />

        <div className="relative container mx-auto grid w-full items-center gap-12 px-4 pt-28 pb-16 md:px-8 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/15 px-4 py-2">
              <Sparkles className="size-4 text-brand-yellow" />
              <span className="text-sm text-white/80">Peluncuran 2026 — Platform LMS Bahasa Jepang</span>
            </div>
            <h1 className="mb-6 text-[clamp(2rem,5vw,3.5rem)] leading-[1.15] font-extrabold text-white">
              Kuasai Bahasa Jepang
              <br />
              <span className="bg-gradient-to-r from-brand-red to-brand-yellow bg-clip-text text-transparent">
                Dari N5 Sampai N1
              </span>
            </h1>
            <p className="mb-8 max-w-xl text-lg leading-relaxed text-white/70">
              Platform baru untuk belajar Jepang secara terstruktur — mulai dari N5, dengan video
              lesson, kuis interaktif, dan try out JLPT. Bergabung sebagai siswa awal.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/sign-up">
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-brand-red to-brand-orange px-8 py-4 text-base font-bold text-primary-foreground shadow-2xl"
                >
                  <Play className="size-5" />
                  Mulai Belajar Sekarang
                </motion.span>
              </Link>
              <Link href="/tryout">
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 rounded-2xl border-2 border-white/30 bg-white/5 px-8 py-4 text-base font-bold text-white backdrop-blur-sm transition-colors hover:border-white/60"
                >
                  <BookOpen className="size-5" />
                  Coba JLPT Try Out
                </motion.span>
              </Link>
            </div>
            <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 backdrop-blur-sm">
              <Zap className="size-4 text-brand-yellow" />
              <p className="text-sm text-white/80">
                Akses awal tersedia — modul N5 dibuka lebih dulu, level lain menyusul
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
              <Image
                src="https://images.unsplash.com/photo-1681317474675-494bd8e91d7d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800"
                alt="Pemandangan Jepang — Gunung Fuji dan pagoda"
                width={800}
                height={480}
                className="h-80 w-full object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/80 to-transparent" />
              <div className="absolute right-4 bottom-4 left-4">
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">Contoh: Modul N5</span>
                    <span className="text-sm font-bold text-brand-yellow">3/12</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/20">
                    <motion.div
                      className="h-2 rounded-full bg-gradient-to-r from-brand-red to-brand-yellow"
                      initial={{ width: 0 }}
                      animate={{ width: '25%' }}
                      transition={{ duration: 1.5, delay: 0.8 }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-white/50">Ilustrasi tampilan progress belajar</p>
                </div>
              </div>
            </div>
            <motion.div
              className="absolute -top-4 -right-4 rounded-2xl bg-gradient-to-br from-brand-yellow to-amber-500 p-4 shadow-xl"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <div className="flex items-center gap-2">
                <Trophy className="size-5 text-white" />
                <div>
                  <p className="text-xs text-white/80">XP Hari Ini</p>
                  <p className="font-bold text-white">+250 XP</p>
                </div>
              </div>
            </motion.div>
            <motion.div
              className="absolute -bottom-4 -left-4 rounded-2xl bg-card p-4 shadow-xl"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 4, repeat: Infinity, delay: 1 }}
            >
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-full bg-primary">
                  <Zap className="size-4 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Contoh Streak</p>
                  <p className="font-bold text-foreground">🔥 Gamifikasi</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 leading-none">
          <svg
            viewBox="0 0 1440 80"
            fill="none"
            className="block h-16 w-full md:h-20"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path
              d="M0 80H1440V0C1440 0 1080 80 720 80C360 80 0 0 0 0V80Z"
              className="fill-background"
            />
          </svg>
        </div>
      </section>

      {/* JLPT levels */}
      <section id="kursus" className="relative z-10 -mt-px bg-background py-24">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2">
              <BookOpen className="size-4 text-primary" />
              <span className="text-sm font-medium text-primary">Jalur Pembelajaran JLPT</span>
            </div>
            <h2 className="mb-4 text-[clamp(1.75rem,3vw,2.5rem)] font-extrabold text-foreground">
              Pilih Level JLPT-mu
            </h2>
            <p className="mx-auto max-w-xl text-muted-foreground">
              Lima level JLPT dalam satu peta belajar. Saat peluncuran, kami mulai dari N5 — level
              lainnya dirilis bertahap sepanjang 2026.
            </p>
          </motion.div>

          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            {JLPT_LEVELS.map((lvl, i) => {
              const accent = JLPT_ACCENT[lvl.accent];
              return (
                <motion.div
                  key={lvl.level}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -8 }}
                  className={cn(
                    'cursor-pointer rounded-2xl border-2 bg-card p-6 transition-shadow hover:shadow-lg',
                    accent.border,
                  )}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div
                      className={cn(
                        'flex size-12 items-center justify-center rounded-2xl text-lg font-bold',
                        accent.bg,
                        accent.text,
                      )}
                    >
                      {lvl.badge}
                    </div>
                    <span
                      className={cn(
                        'rounded-full px-2 py-1 text-xs font-bold text-primary-foreground',
                        accent.badge,
                      )}
                    >
                      {lvl.level}
                    </span>
                  </div>
                  <h3 className="mb-1 text-lg font-bold text-foreground">{lvl.label}</h3>
                  <p className="mb-4 text-xs leading-relaxed text-muted-foreground">{lvl.desc}</p>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{lvl.modules} modul direncanakan</span>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                        lvl.status === 'tersedia'
                          ? 'bg-emerald-500/15 text-emerald-600'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {lvl.statusLabel}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className={cn('h-1.5 rounded-full', accent.bar)}
                      initial={{ width: 0 }}
                      whileInView={{ width: lvl.status === 'tersedia' ? '35%' : '12%' }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: i * 0.15 }}
                    />
                  </div>
                  <Link href={lvl.status === 'tersedia' ? '/sign-up' : '/kursus'}>
                    <motion.span
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className={cn(
                        'mt-4 block w-full rounded-xl py-2.5 text-center text-sm font-semibold',
                        accent.bg,
                        accent.text,
                      )}
                    >
                      {lvl.status === 'tersedia' ? 'Mulai Belajar' : 'Lihat Roadmap'}
                    </motion.span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="fitur" className="bg-gradient-to-br from-muted/50 to-primary/5 py-24">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background px-4 py-2 shadow-sm">
              <Zap className="size-4 text-primary" />
              <span className="text-sm font-medium text-primary">Fitur Unggulan</span>
            </div>
            <h2 className="mb-4 text-[clamp(1.75rem,3vw,2.5rem)] font-extrabold text-foreground">
              Belajar Lebih Efektif &
              <br />
              Menyenangkan
            </h2>
            <p className="mx-auto max-w-xl text-muted-foreground">
              Ekosistem belajar lengkap yang memadukan teknologi modern dengan pendekatan
              gamifikasi.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {LANDING_FEATURES.map((feat, i) => (
              <motion.div
                key={feat.tag}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-card p-7 shadow-sm"
              >
                <div
                  className={cn(
                    'mb-5 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br text-primary-foreground shadow-lg transition-transform group-hover:scale-110',
                    feat.gradient,
                  )}
                >
                  <feat.icon className="size-7" />
                </div>
                <span className="mb-3 inline-block rounded-lg bg-muted px-2 py-1 text-xs font-bold text-muted-foreground">
                  {feat.tag}
                </span>
                <h3 className="mb-2 text-base font-bold text-foreground">{feat.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{feat.desc}</p>
                <Link href={feat.href}>
                  <motion.span
                    className="mt-4 flex cursor-pointer items-center gap-1 text-sm font-semibold text-primary"
                    whileHover={{ x: 4 }}
                  >
                    Pelajari lebih lanjut <ChevronRight className="size-4" />
                  </motion.span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform pillars */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-navy via-secondary to-brand-navy py-20">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(LANDING_SEIGAIHA)}")`,
            backgroundSize: '40px 40px',
          }}
        />
        <div className="container relative mx-auto px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="mb-3 text-[clamp(1.75rem,3vw,2.5rem)] font-extrabold text-white">
              Yang Kami <span className="text-brand-yellow">Bangun</span>
            </h2>
            <p className="text-white/60">
              Fokus pada nilai platform — tanpa angka yang belum bisa kami buktikan
            </p>
          </motion.div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
            {LANDING_PILLARS.map((pillar, i) => (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm"
              >
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/20 text-white">
                  <pillar.icon className="size-6" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-white">{pillar.title}</h3>
                <p className="text-sm leading-relaxed text-white/60">{pillar.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing — sitemap: Section Pricing Paket + CTA WhatsApp */}
      <section id="pricing" className="bg-background py-24">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2">
              <GraduationCap className="size-4 text-primary" />
              <span className="text-sm font-medium text-primary">Paket Belajar</span>
            </div>
            <h2 className="mb-4 text-[clamp(1.75rem,3vw,2.5rem)] font-extrabold text-foreground">
              Pilih Paket yang Cocok untukmu
            </h2>
            <p className="mx-auto max-w-xl text-muted-foreground">
              Paket peluncuran — konsultasi & pembelian via admin WhatsApp. Harga dapat berubah
              seiring penambahan konten.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {PRICING_PLANS.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  'relative flex flex-col rounded-2xl border p-8',
                  plan.highlighted
                    ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                    : 'border-border bg-card',
                )}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-brand-red to-brand-orange px-4 py-1 text-xs font-bold text-primary-foreground">
                    Terpopuler
                  </span>
                )}
                <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                <p className="mt-6 text-3xl font-extrabold text-foreground">
                  {plan.price}
                  {plan.period && (
                    <span className="text-base font-medium text-muted-foreground">{plan.period}</span>
                  )}
                </p>
                <ul className="mt-6 flex flex-1 flex-col gap-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  variant={plan.highlighted ? 'default' : 'outline'}
                  className={cn(
                    'mt-8 h-11 w-full gap-2 rounded-full font-semibold',
                    plan.highlighted
                      ? 'border-0 bg-gradient-to-br from-brand-red to-brand-orange text-primary-foreground hover:opacity-90'
                      : 'border-primary !text-primary hover:!bg-primary/5',
                  )}
                >
                  <Link href="/hubungi">
                    <MessageCircle className="size-4" />
                    Tanya via WhatsApp
                  </Link>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Value props — menggantikan testimoni palsu */}
      <section className="bg-muted/30 py-24">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-yellow/30 bg-brand-yellow/10 px-4 py-2">
              <Star className="size-4 text-brand-yellow" />
              <span className="text-sm font-medium text-amber-700">Untuk Siapa JepangKu?</span>
            </div>
            <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] font-extrabold text-foreground">
              Dirancang untuk
              <br />
              Perjalanan JLPT-mu
            </h2>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {LANDING_VALUE_PROPS.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                whileHover={{ y: -4 }}
                className="rounded-2xl border border-border bg-card p-8 shadow-sm"
              >
                <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <item.icon className="size-6" />
                </div>
                <h3 className="mb-1 text-lg font-bold text-foreground">{item.title}</h3>
                <p className="mb-4 text-xs font-medium text-primary">{item.persona}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative mx-4 mb-16 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-red via-brand-orange to-brand-navy py-20 md:mx-8">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(LANDING_SEIGAIHA)}")`,
            backgroundSize: '50px 50px',
          }}
        />
        <div className="relative container mx-auto max-w-3xl px-4 text-center md:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <p className="mb-3 text-[clamp(3rem,10vw,5.5rem)] leading-none font-black tracking-wide text-white drop-shadow-lg">
              始めよう
            </p>
            <h2 className="mb-4 text-[clamp(1.75rem,3vw,2.5rem)] font-extrabold text-white">
              Mulai Perjalanan Japanmu
              <br />
              Hari Ini!
            </h2>
            <p className="mb-8 text-white/70">
              Jadilah bagian dari komunitas awal JepangKu. Daftar gratis dan mulai dari modul N5 —
              konsultasi paket via tim admin.
            </p>
            <Link href="/sign-up">
              <motion.span
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="mx-auto inline-flex items-center gap-2 rounded-2xl bg-brand-yellow px-10 py-4 font-bold text-brand-navy shadow-2xl"
              >
                <Zap className="size-5" />
                Mulai Belajar Sekarang — Gratis!
                <ArrowRight className="size-5" />
              </motion.span>
            </Link>
            <p className="mt-4">
              <Link href="/hubungi" className="text-sm text-white/80 underline-offset-4 hover:text-white hover:underline">
                Atau hubungi admin via WhatsApp untuk paket kursus
              </Link>
            </p>
          </motion.div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
