'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  Menu,
  MessageCircle,
  Play,
  Sparkles,
  Target,
  Video,
  Wifi,
  X,
  Zap,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { MarketingMobileMenu } from './marketing-mobile-menu';
import { LANDING_NAV_MENU_TOP } from './marketing-nav-layout';
import { MarketingNavLinkItem } from './marketing-nav-link';
import { MARKETING_NAV_LINKS } from './marketing-nav-links';
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
  LANDING_HERO_GRID_STYLE,
  LANDING_PILLARS,
  LANDING_SEIGAIHA,
  LANDING_VALUE_PROPS,
  PRICING_PLANS,
} from './landing-data';

const PLATFORM_HIGHLIGHTS = [
  { icon: GraduationCap, value: 'N5 → N1', label: '5 Jalur JLPT' },
  { icon: Video, value: '100+', label: 'Video Lesson' },
  { icon: Target, value: '4 Fase', label: 'Try Out JLPT' },
  { icon: Wifi, value: 'Live', label: 'Kelas Interaktif' },
] as const;

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
          "fixed top-0 right-0 left-0 transition-all duration-300",
          menuOpen ? "z-102" : "z-50",
          scrolled
            ? "border-b border-border bg-header shadow-md backdrop-blur-md dark:backdrop-blur-none"
            : "bg-transparent",
        )}
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Fixed height prevents layout shift between transparent/scrolled states */}
        <div className="relative z-60 container mx-auto flex h-16 items-center justify-between px-4 sm:h-18 md:px-8">
          <Link href="/" className="inline-block">
            <BrandLogo variant="nav" priority />
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {MARKETING_NAV_LINKS.map((link) => (
              <MarketingNavLinkItem
                key={link.href}
                href={link.href}
                label={link.label}
                variant={scrolled ? "default" : "light"}
              />
            ))}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle
              className={cn(
                !scrolled && "text-white hover:bg-white/10 hover:text-white",
              )}
            />
            <Button
              asChild
              variant="outline"
              className={cn(
                "h-10 px-5",
                !scrolled &&
                  "border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white",
              )}
            >
              <Link href="/sign-in">Masuk</Link>
            </Button>
            <Button asChild className="h-10 px-5">
              <Link href="/sign-up">Daftar Gratis</Link>
            </Button>
          </div>

          <div className="flex items-center gap-1 md:hidden">
            <ThemeToggle size="icon-sm" />
            <button
              type="button"
              className={cn(
                "relative rounded-lg p-1",
                scrolled ? "text-foreground" : "text-white",
              )}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? (
                <X className="size-6" />
              ) : (
                <Menu className="size-6" />
              )}
            </button>
          </div>
        </div>

        <MarketingMobileMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          panelTop={LANDING_NAV_MENU_TOP}
          panelClassName="border border-border bg-header backdrop-blur-xl dark:backdrop-blur-none"
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
            <div className="flex items-center justify-between px-1 pb-1">
              <span className="text-xs font-medium text-muted-foreground">
                Tema tampilan
              </span>
              <ThemeToggle size="icon-sm" />
            </div>
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

      {/* Hero — dark navy background matches Figma design */}
      {/* Elliptic bottom curve: border-radius 0 0 50% 50% / 0 0 6rem 6rem gives a wide smooth arch */}
      <section
        className="bg-brand-hero-navy relative flex min-h-[min(100svh,900px)] items-center overflow-hidden sm:min-h-[min(100svh,880px)]"
        style={{ borderRadius: "0 0 50% 50% / 0 0 6rem 6rem" }}
      >
        {/* Seigaiha pattern — subtle */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(LANDING_SEIGAIHA)}")`,
            backgroundSize: "40px 40px",
          }}
        />
        {/* Grid overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={LANDING_HERO_GRID_STYLE}
        />
        {/* Radial light at top-left */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-brand-red/20 blur-[120px]" />

        <div className="container relative mx-auto grid w-full items-center gap-6 px-4 pt-20 pb-10 sm:gap-8 sm:pt-24 sm:pb-12 md:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
          {/* LEFT: headline + buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm">
              <Sparkles className="size-4 text-brand-yellow" />
              <span className="text-sm font-medium text-white/80">
                Powered by JepangKu
              </span>
            </div>
            <h1 className="mb-5 text-[clamp(2rem,4vw,3.25rem)] leading-[1.08] font-extrabold tracking-tight text-white">
              Kursus bahasa Jepang
              <br />
              terstruktur untuk JLPT
              <br />
              <span className="bg-linear-to-r from-brand-red to-brand-yellow bg-clip-text text-transparent">
                N5 sampai N1
              </span>
            </h1>
            <p className="mb-6 max-w-lg text-base leading-relaxed text-white/70 md:text-lg">
              Belajar dengan video lesson, modul bertahap, kuis interaktif, dan
              try out JLPT — dimulai dari N5 saat peluncuran awal.
            </p>

            <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-3">
              <p className="text-sm font-medium text-white/60">
                Kurikulum JLPT N5–N1
              </p>
              <div className="flex -space-x-2.5" aria-hidden>
                {HERO_TRUST_LEVELS.map((level, index) => (
                  <div
                    key={level}
                    className={cn(
                      "flex size-9 items-center justify-center rounded-full border-2 border-brand-navy text-xs font-bold shadow-sm",
                      index === 0
                        ? "bg-linear-to-br from-brand-red to-brand-orange text-white"
                        : "bg-white/20 text-white/90",
                    )}
                  >
                    {level}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-11 w-full border-white/40 bg-white/10 px-6 text-white hover:bg-white/20 hover:text-white sm:h-12 sm:w-auto"
              >
                <Link href="/sign-in">Mulai Belajar Sekarang</Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="h-11 w-full px-6 sm:h-12 sm:w-auto"
              >
                <Link href="/kursus" className="inline-flex items-center gap-2">
                  Jelajahi Semua Kursus
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>

            <div className="mt-6 inline-flex items-center gap-2 text-sm text-white/60">
              <CheckCircle2 className="size-4 shrink-0 text-brand-yellow" />
              <span>Modul N5 dibuka lebih dulu — level lain menyusul</span>
            </div>
          </motion.div>

          {/* RIGHT: LMS mock UI — always light appearance (decorative illustration) */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.12 }}
            className="relative mx-auto w-full max-w-xl lg:mt-0 lg:max-w-none"
          >
            <div className="origin-center transition-transform duration-500 transform-[perspective(1400px)_rotateY(-8deg)_rotateX(4deg)] hover:transform-[perspective(1400px)_rotateY(-5deg)_rotateX(2deg)]">
              {/* Always light-mode colors for the mock UI (it's a decorative illustration on dark bg) */}
              <div className="overflow-hidden rounded-2xl border border-white/20 bg-white shadow-[0_28px_80px_-16px_rgba(0,0,0,0.5)]">
                <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-100 px-4 py-3">
                  <div className="size-3 rounded-full bg-red-400/90" />
                  <div className="size-3 rounded-full bg-amber-400/90" />
                  <div className="size-3 rounded-full bg-emerald-400/90" />
                  <span className="ml-2 truncate text-xs text-gray-400">
                    jepangku.com/kursus/n5
                  </span>
                </div>
                <div className="flex min-h-[260px] sm:min-h-[300px]">
                  <aside className="hidden w-40 shrink-0 border-r border-gray-200 bg-gray-50 p-3 sm:block md:w-44">
                    <p className="mb-3 px-2 text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
                      Modul N5
                    </p>
                    <ul className="space-y-1">
                      {HERO_MOCK_MODULES.map((module) => (
                        <li
                          key={module.title}
                          className={cn(
                            "flex items-center gap-2 rounded-lg px-2 py-2 text-xs",
                            module.active
                              ? "bg-primary/10 font-semibold text-primary"
                              : "text-gray-400",
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
                  <div className="relative flex flex-1 flex-col bg-gray-50 p-3 sm:p-4">
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
                      <div className="mb-1 flex justify-between text-xs text-gray-400">
                        <span>Progress modul</span>
                        <span className="font-semibold text-gray-700">25%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-200">
                        <motion.div
                          className="h-1.5 rounded-full bg-linear-to-r from-brand-red to-brand-orange"
                          initial={{ width: 0 }}
                          animate={{ width: "25%" }}
                          transition={{ duration: 1.2, delay: 0.5 }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-5 text-center text-sm text-white/60">
              Bagian dari ekosistem{" "}
              <Link
                href="/tentang"
                className="font-semibold text-white underline-offset-4 hover:underline"
              >
                JepangKu
              </Link>
            </p>
          </motion.div>
        </div>
      </section>

      {/* JLPT levels */}
      <section
        id="kursus"
        className="relative z-10 bg-background pt-14 pb-20 sm:pt-20 md:pt-24 lg:pt-28 sm:pb-24"
      >
        <div className="container mx-auto px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2">
              {/* <BookOpen className="size-4 text-primary" /> */}
              <span className="text-sm font-medium text-primary">
                Jalur Pembelajaran JLPT
              </span>
            </div>
            <h2 className="mb-4 text-[clamp(1.75rem,3vw,2.5rem)] font-extrabold text-foreground">
              Pilih Level JLPT-mu
            </h2>
            <p className="mx-auto max-w-xl text-muted-foreground">
              Lima level JLPT dalam satu peta belajar. Saat peluncuran, kami
              mulai dari N5 — level lainnya dirilis bertahap sepanjang 2026.
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
                    "cursor-pointer rounded-2xl border-2 bg-card p-6 transition-shadow hover:shadow-lg",
                    accent.border,
                  )}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div
                      className={cn(
                        "flex size-12 items-center justify-center rounded-2xl text-lg font-bold",
                        accent.bg,
                        accent.text,
                      )}
                    >
                      {lvl.badge}
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2 py-1 text-xs font-bold text-primary-foreground",
                        accent.badge,
                      )}
                    >
                      {lvl.level}
                    </span>
                  </div>
                  <h3 className="mb-1 text-lg font-bold text-foreground">
                    {lvl.label}
                  </h3>
                  <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
                    {lvl.desc}
                  </p>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {lvl.modules} modul direncanakan
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                        lvl.status === "tersedia"
                          ? "bg-emerald-500/15 text-emerald-600"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {lvl.statusLabel}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className={cn("h-1.5 rounded-full", accent.bar)}
                      initial={{ width: 0 }}
                      whileInView={{
                        width: lvl.status === "tersedia" ? "35%" : "12%",
                      }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: i * 0.15 }}
                    />
                  </div>
                  <Link
                    href={lvl.status === "tersedia" ? "/sign-up" : "/kursus"}
                  >
                    <motion.span
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className={cn(
                        "mt-4 block w-full rounded-xl py-2.5 text-center text-sm font-semibold",
                        accent.bg,
                        accent.text,
                      )}
                    >
                      {lvl.status === "tersedia"
                        ? "Mulai Belajar"
                        : "Lihat Roadmap"}
                    </motion.span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="fitur"
        className="bg-linear-to-br from-muted/50 to-primary/5 py-24"
      >
        <div className="container mx-auto px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background px-4 py-2 shadow-sm">
              {/* <Zap className="size-4 text-primary" /> */}
              <span className="text-sm font-medium text-primary">
                Fitur Unggulan
              </span>
            </div>
            <h2 className="mb-4 text-[clamp(1.75rem,3vw,2.5rem)] font-extrabold text-foreground">
              Belajar Lebih Efektif &
              <br />
              Menyenangkan
            </h2>
            <p className="mx-auto max-w-xl text-muted-foreground">
              Ekosistem belajar lengkap yang memadukan teknologi modern dengan
              pendekatan gamifikasi.
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
                {/* Decorative corner blob — same style as Figma */}
                <div
                  className={cn(
                    "pointer-events-none absolute top-0 right-0 h-28 w-28 rounded-bl-full opacity-[0.08] transition-opacity group-hover:opacity-[0.14]",
                    feat.blobColor,
                  )}
                />
                <div
                  className={cn(
                    "mb-5 flex size-14 items-center justify-center rounded-2xl bg-linear-to-br text-primary-foreground shadow-lg transition-transform group-hover:scale-110",
                    feat.gradient,
                  )}
                >
                  <feat.icon className="size-7" />
                </div>
                <span className="mb-3 inline-block rounded-lg bg-muted px-2 py-1 text-xs font-bold text-muted-foreground">
                  {feat.tag}
                </span>
                <h3 className="mb-2 text-base font-bold text-foreground">
                  {feat.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feat.desc}
                </p>
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

      {/* Platform highlights — dark navy band */}
      <section className="bg-brand-hero-navy relative overflow-hidden py-20">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(LANDING_SEIGAIHA)}")`,
            backgroundSize: "60px 60px",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={LANDING_HERO_GRID_STYLE}
        />
        <div className="container relative mx-auto px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="text-[clamp(1.75rem,3vw,2.25rem)] font-extrabold text-white">
              Platform{" "}
              <span className="bg-linear-to-r from-brand-red to-brand-yellow bg-clip-text text-transparent">
                Terpadu
              </span>{" "}
              untuk JLPT
            </h2>
            <p className="mt-2 text-sm text-white/60">
              Satu platform, semua yang kamu butuhkan untuk lulus JLPT N5 sampai
              N1
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {PLATFORM_HIGHLIGHTS.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-white/10 bg-white/6 p-6 text-center backdrop-blur-sm"
              >
                <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-primary/20 text-white">
                  <item.icon className="size-6" />
                </div>
                <p className="text-2xl font-extrabold text-white">
                  {item.value}
                </p>
                <p className="mt-1 text-xs text-white/55">{item.label}</p>
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
              {/* <Sparkles className="size-4 text-primary" /> */}
              <span className="text-sm font-medium text-muted-foreground">
                Nilai platform
              </span>
            </div>
            <h2 className="mb-3 text-[clamp(1.75rem,3vw,2.5rem)] font-extrabold text-foreground">
              Yang Kami{" "}
              <span className="bg-linear-to-r from-brand-red to-brand-orange bg-clip-text text-transparent">
                Bangun
              </span>
            </h2>
            <p className="mx-auto max-w-xl text-muted-foreground">
              Fokus pada nilai platform — tanpa angka yang belum bisa kami
              buktikan
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
                <h3 className="mb-2 text-lg font-bold text-foreground">
                  {pillar.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {pillar.desc}
                </p>
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
              {/* <GraduationCap className="size-4 text-primary" /> */}
              <span className="text-sm font-medium text-primary">
                Paket Belajar
              </span>
            </div>
            <h2 className="mb-4 text-[clamp(1.75rem,3vw,2.5rem)] font-extrabold text-foreground">
              Pilih Paket yang Cocok untukmu
            </h2>
            <p className="mx-auto max-w-xl text-muted-foreground">
              Paket peluncuran — konsultasi & pembelian via admin WhatsApp.
              Harga dapat berubah seiring penambahan konten.
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
                  "relative flex flex-col rounded-2xl border p-8",
                  plan.highlighted
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                    : "border-border bg-card",
                )}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-linear-to-r from-brand-red to-brand-orange px-4 py-1 text-xs font-bold text-primary-foreground">
                    Terpopuler
                  </span>
                )}
                <h3 className="text-lg font-bold text-foreground">
                  {plan.name}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {plan.description}
                </p>
                <p className="mt-6 text-3xl font-extrabold text-foreground">
                  {plan.price}
                  {plan.period && (
                    <span className="text-base font-medium text-muted-foreground">
                      {plan.period}
                    </span>
                  )}
                </p>
                <ul className="mt-6 flex flex-1 flex-col gap-2">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  variant={plan.highlighted ? "default" : "outline"}
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
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2">
              <span className="text-sm font-medium text-primary">
                Untuk Siapa JepangKu?
              </span>
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
                <h3 className="mb-1 text-lg font-bold text-foreground">
                  {item.title}
                </h3>
                <p className="mb-4 text-xs font-medium text-primary">
                  {item.persona}
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final — bg-background matches pricing section directly above */}
      <section className="bg-background relative overflow-hidden">
        <div className="container relative mx-auto px-4 py-16 md:px-8 sm:py-20 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2">
              <span className="text-sm font-medium text-primary">
                Mulai dari N5
              </span>
            </div>
            <h2 className="mb-4 text-[clamp(1.75rem,3.5vw,2.5rem)] font-extrabold leading-[1.12] tracking-tight text-foreground">
              Mulai perjalanan Japanmu
              <br />
              <span className="bg-linear-to-r from-brand-red to-brand-orange bg-clip-text text-transparent">
                hari ini
              </span>
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-muted-foreground">
              Jadilah bagian dari komunitas awal JepangKu. Daftar gratis, mulai
              modul N5, atau konsultasi paket lewat tim admin.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-11 w-full gap-2 px-8 sm:h-12 sm:w-auto"
              >
                <Link href="/sign-up">
                  <Zap className="size-4" />
                  Daftar Gratis
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-11 w-full px-8 sm:h-12 sm:w-auto"
              >
                <Link href="/hubungi">Hubungi Admin</Link>
              </Button>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              Sudah punya akun?{" "}
              <Link
                href="/sign-in"
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                Masuk di sini
              </Link>
            </p>
          </motion.div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
