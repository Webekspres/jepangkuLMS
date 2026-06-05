'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  CheckCircle2,
  GraduationCap,
  Menu,
  MessageCircle,
  Play,
  Sparkles,
  Star,
  X,
  Zap,
} from 'lucide-react';
import { BRAND_LOGO } from '@/lib/brand-logo';
import { MarketingMobileMenu } from './marketing-mobile-menu';
import { LANDING_NAV_MENU_TOP } from './marketing-nav-layout';
import { MarketingNavLinkItem } from './marketing-nav-link';
import { MARKETING_NAV_LINKS } from './marketing-nav-links';
import { MarketingCtaBand } from './marketing-cta-band';
import { MarketingFooter } from './marketing-footer';
import { MarketingLightSurface } from './marketing-light-surface';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  HERO_MOCK_MODULES,
  HERO_TRUST_LEVELS,
  JLPT_ACCENT,
  JLPT_LEVELS,
  LANDING_FEATURES,
  LANDING_PILLARS,
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

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* Navbar */}
      <motion.nav
        className={cn(
          'fixed top-0 right-0 left-0 transition-all duration-300',
          menuOpen ? 'z-102' : 'z-50',
          scrolled ? 'border-b border-border bg-background/95 shadow-md backdrop-blur-md' : 'bg-transparent',
        )}
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative z-60 container mx-auto flex items-center justify-between px-4 py-4 md:px-8">
          <Link href="/" className="inline-block">
            <Image
              src="/brand/logo.png"
              alt="JepangKu"
              width={BRAND_LOGO.nav.width}
              height={BRAND_LOGO.nav.height}
              className={BRAND_LOGO.nav.className}
              priority
            />
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {MARKETING_NAV_LINKS.map((link) => (
              <MarketingNavLinkItem key={link.href} href={link.href} label={link.label} />
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Button asChild variant="outline" className="h-10 px-5">
              <Link href="/sign-in">Masuk</Link>
            </Button>
            <Button asChild className="h-10 px-5">
              <Link href="/sign-up">Daftar Gratis</Link>
            </Button>
          </div>

          <button
            type="button"
            className="relative rounded-lg p-1 text-foreground md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>

        <MarketingMobileMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          panelTop={LANDING_NAV_MENU_TOP}
          panelClassName="border border-border bg-background/95 backdrop-blur-xl"
        >
          <nav className="flex flex-col p-2">
            {MARKETING_NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <link.icon className="size-4 shrink-0 opacity-70" />
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-col gap-2 border-t border-border bg-muted/30 p-4">
            <Button asChild variant="outline" className="h-11 w-full">
              <Link href="/sign-in" onClick={() => setMenuOpen(false)}>
                Masuk
              </Link>
            </Button>
            <Button asChild className="h-11 w-full">
              <Link href="/sign-up" onClick={() => setMenuOpen(false)}>
                Daftar Gratis
              </Link>
            </Button>
          </div>
        </MarketingMobileMenu>
      </motion.nav>

      {/* Hero */}
      <MarketingLightSurface
        roundedBottom
        className="flex min-h-[min(100svh,900px)] items-center sm:min-h-[min(100svh,880px)]"
        contentClassName="container mx-auto grid w-full items-center gap-6 px-4 pt-20 pb-10 sm:gap-8 sm:pt-24 sm:pb-12 md:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12"
      >
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-2 shadow-sm backdrop-blur-sm">
              <Sparkles className="size-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Powered by JepangKu</span>
            </div>
            <h1 className="mb-5 text-[clamp(2rem,4vw,3.25rem)] leading-[1.08] font-extrabold tracking-tight text-foreground">
              Kursus bahasa Jepang
              <br />
              terstruktur untuk JLPT
              <br />
              <span className="bg-linear-to-r from-brand-red to-brand-orange bg-clip-text text-transparent">
                N5 sampai N1
              </span>
            </h1>
            <p className="mb-6 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
              Belajar dengan video lesson, modul bertahap, kuis interaktif, dan try out JLPT — dimulai
              dari N5 saat peluncuran awal.
            </p>

            <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-3">
              <p className="text-sm font-medium text-muted-foreground">Kurikulum JLPT N5–N1</p>
              <div className="flex -space-x-2.5" aria-hidden>
                {HERO_TRUST_LEVELS.map((level, index) => (
                  <div
                    key={level}
                    className={cn(
                      'flex size-9 items-center justify-center rounded-full border-2 border-background text-xs font-bold shadow-sm',
                      index === 0
                        ? 'bg-linear-to-br from-brand-red to-brand-orange text-primary-foreground'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {level}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Button asChild variant="outline" size="lg" className="h-11 w-full px-6 sm:h-12 sm:w-auto">
                <Link href="/sign-in">Masuk</Link>
              </Button>
              <Button asChild size="lg" className="h-11 w-full px-6 sm:h-12 sm:w-auto">
                <Link href="/kursus" className="inline-flex items-center gap-2">
                  Jelajahi Semua Kursus
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>

            <div className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="size-4 shrink-0 text-primary" />
              <span>Modul N5 dibuka lebih dulu — level lain menyusul</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.12 }}
            className="relative mx-auto w-full max-w-xl lg:max-w-none lg:mt-0"
          >
            <div className="origin-center transition-transform duration-500 transform-[perspective(1400px)_rotateY(-8deg)_rotateX(4deg)] hover:transform-[perspective(1400px)_rotateY(-5deg)_rotateX(2deg)]">
              <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_28px_80px_-16px_rgba(15,23,42,0.22)]">
                <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-3">
                  <div className="size-3 rounded-full bg-red-400/90" />
                  <div className="size-3 rounded-full bg-amber-400/90" />
                  <div className="size-3 rounded-full bg-emerald-400/90" />
                  <span className="ml-2 truncate text-xs text-muted-foreground">jepangku.com/kursus/n5</span>
                </div>
                <div className="flex min-h-[260px] sm:min-h-[300px]">
                  <aside className="hidden w-40 shrink-0 border-r border-border bg-muted/25 p-3 sm:block md:w-44">
                    <p className="mb-3 px-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                      Modul N5
                    </p>
                    <ul className="space-y-1">
                      {HERO_MOCK_MODULES.map((module) => (
                        <li
                          key={module.title}
                          className={cn(
                            'flex items-center gap-2 rounded-lg px-2 py-2 text-xs',
                            module.active
                              ? 'bg-primary/10 font-semibold text-primary'
                              : 'text-muted-foreground',
                          )}
                        >
                          {module.active ? (
                            <Play className="size-3 shrink-0 fill-primary" />
                          ) : (
                            <BookOpen className="size-3 shrink-0 opacity-60" />
                          )}
                          <span className="line-clamp-2">{module.title}</span>
                        </li>
                      ))}
                    </ul>
                  </aside>
                  <div className="relative flex flex-1 flex-col bg-linear-to-br from-muted/20 to-background p-3 sm:p-4">
                    <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-xl bg-brand-navy">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,color-mix(in_srgb,var(--primary)_35%,transparent),transparent_55%)]" />
                      <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" />
                      <motion.div
                        className="relative z-10 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl sm:size-16"
                        whileHover={{ scale: 1.06 }}
                      >
                        <Play className="size-6 fill-current pl-0.5 sm:size-7" />
                      </motion.div>
                      <div className="absolute right-3 bottom-3 left-3 flex items-center justify-between text-[11px] text-white/85 sm:text-xs">
                        <span>Lesson 1: Hiragana Dasar</span>
                        <span>12:34</span>
                      </div>
                    </div>
                    <div className="mt-3 sm:mt-4">
                      <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                        <span>Progress modul</span>
                        <span className="font-semibold text-foreground">25%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted">
                        <motion.div
                          className="h-1.5 rounded-full bg-linear-to-r from-brand-red to-brand-orange"
                          initial={{ width: 0 }}
                          animate={{ width: '25%' }}
                          transition={{ duration: 1.2, delay: 0.5 }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-5 text-center text-sm text-muted-foreground">
              Bagian dari ekosistem{' '}
              <Link href="/tentang" className="font-semibold text-foreground underline-offset-4 hover:underline">
                JepangKu
              </Link>
            </p>
          </motion.div>
      </MarketingLightSurface>

      {/* JLPT levels */}
      <section id="kursus" className="relative z-10 bg-background pt-14 pb-20 sm:pt-20 md:pt-24 lg:pt-28 sm:pb-24">
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
      <section id="fitur" className="bg-linear-to-br from-muted/50 to-primary/5 py-24">
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
                    'mb-5 flex size-14 items-center justify-center rounded-2xl bg-linear-to-br text-primary-foreground shadow-lg transition-transform group-hover:scale-110',
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
      <MarketingLightSurface contentClassName="py-20 sm:py-24">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center sm:mb-16"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-2 shadow-sm">
              <Sparkles className="size-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Nilai platform</span>
            </div>
            <h2 className="mb-3 text-[clamp(1.75rem,3vw,2.5rem)] font-extrabold text-foreground">
              Yang Kami <span className="text-brand-yellow">Bangun</span>
            </h2>
            <p className="mx-auto max-w-xl text-muted-foreground">
              Fokus pada nilai platform — tanpa angka yang belum bisa kami buktikan
            </p>
          </motion.div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 md:grid-cols-4">
            {LANDING_PILLARS.map((pillar, i) => (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-border bg-card/90 p-6 text-center shadow-sm backdrop-blur-sm"
              >
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                  <pillar.icon className="size-6" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-foreground">{pillar.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{pillar.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </MarketingLightSurface>

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
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-linear-to-r from-brand-red to-brand-orange px-4 py-1 text-xs font-bold text-primary-foreground">
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
                  className="mt-8 h-11 w-full gap-2"
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

      {/* Value props + CTA — satu zona muted tanpa garis pemisah */}
      <section className="bg-muted/30 pt-24 pb-10">
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

      <MarketingCtaBand className="[&>div]:pt-6 [&>div]:pb-20 sm:[&>div]:pt-8 sm:[&>div]:pb-24">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-2 shadow-sm backdrop-blur-sm">
          <Sparkles className="size-4 text-primary" />
          <span className="text-sm font-medium text-muted-foreground">始めよう · Mulai dari N5</span>
        </div>
        <h2 className="mb-4 text-[clamp(1.75rem,3.5vw,2.5rem)] leading-[1.12] font-extrabold tracking-tight text-foreground">
          Mulai perjalanan Japanmu
          <br />
          <span className="bg-linear-to-r from-brand-red to-brand-orange bg-clip-text text-transparent">
            hari ini
          </span>
        </h2>
        <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-muted-foreground">
          Jadilah bagian dari komunitas awal JepangKu. Daftar gratis, mulai modul N5, atau konsultasi
          paket lewat tim admin.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="h-11 w-full gap-2 px-8 sm:h-12 sm:w-auto">
            <Link href="/sign-up">
              <Zap className="size-4" />
              Daftar Gratis
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-11 w-full px-8 sm:h-12 sm:w-auto">
            <Link href="/hubungi">Hubungi Admin</Link>
          </Button>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Sudah punya akun?{' '}
          <Link href="/sign-in" className="font-semibold text-primary underline-offset-4 hover:underline">
            Masuk di sini
          </Link>
        </p>
      </MarketingCtaBand>

      <MarketingFooter />
    </div>
  );
}
