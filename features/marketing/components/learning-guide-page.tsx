'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight, ChevronRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JLPT_ACCENT, LANDING_SEIGAIHA } from '@/features/marketing/components/landing-data';
import { MarketingFooter } from '@/features/marketing/components/marketing-footer';
import { PublicNavbar } from '@/features/marketing/components/public-navbar';
import { cn } from '@/lib/utils';
import {
  LEARNING_GUIDE_HERO,
  LEARNING_STEPS,
  LEARNING_TIPS,
  LEVEL_GUIDE,
  XP_RULES,
} from './learning-guide-data';

export function LearningGuidePage() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <PublicNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-linear-to-br from-brand-navy via-secondary to-brand-navy px-4 py-20 text-center sm:py-24 md:px-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(LANDING_SEIGAIHA)}")`,
            backgroundSize: '60px 60px',
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative mx-auto max-w-2xl"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/15 px-4 py-2">
            <span className="text-sm text-brand-yellow">{LEARNING_GUIDE_HERO.badge}</span>
          </div>
          <h1 className="mb-5 text-[clamp(2rem,5vw,3rem)] font-extrabold text-white">
            {LEARNING_GUIDE_HERO.title}
          </h1>
          <p className="mx-auto text-base leading-relaxed text-white/70 sm:text-lg">
            {LEARNING_GUIDE_HERO.subtitle}
          </p>
        </motion.div>

        <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 leading-none">
          <svg
            viewBox="0 0 1440 60"
            fill="none"
            className="block h-12 w-full sm:h-16"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path
              d="M0 60H1440V0C1440 0 1080 60 720 60C360 60 0 0 0 0V60Z"
              className="fill-background"
            />
          </svg>
        </div>
      </section>

      {/* Steps */}
      <section className="relative z-10 -mt-px py-16 sm:py-20">
        <div className="container mx-auto px-4 md:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-2 text-2xl font-extrabold text-foreground sm:text-3xl">
              Alur Belajar di Platform
            </h2>
            <p className="text-sm text-muted-foreground">
              Lima langkah sederhana dari daftar sampai try out
            </p>
          </div>
          <div className="mx-auto max-w-2xl space-y-4">
            {LEARNING_STEPS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
                  {step.step}
                </div>
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <step.icon className="size-4 text-primary" />
                    <p className="font-semibold text-foreground">{step.title}</p>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* JLPT Levels */}
      <section className="border-y border-border bg-muted/30 py-16 sm:py-20">
        <div className="container mx-auto px-4 md:px-8">
          <div className="mb-10 text-center">
            <h2 className="mb-2 text-2xl font-extrabold text-foreground sm:text-3xl">
              Sistem Level JLPT
            </h2>
            <p className="text-sm text-muted-foreground">
              Kurikulum mengikuti level resmi JLPT — peluncuran dimulai dari N5
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {LEVEL_GUIDE.map((level, i) => {
              const accent = JLPT_ACCENT[level.accent];
              const isAvailable = level.status.includes('tersedia');

              return (
                <motion.div
                  key={level.level}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    'rounded-2xl border bg-card p-5 shadow-sm',
                    accent.border,
                  )}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span
                      className={cn(
                        'rounded-lg px-2.5 py-1 text-xs font-bold text-white',
                        accent.badge,
                      )}
                    >
                      {level.level}
                    </span>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                        isAvailable
                          ? 'bg-emerald-500/15 text-emerald-600'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {level.status}
                    </span>
                  </div>
                  <p className="mb-1 font-semibold text-foreground">{level.label}</p>
                  <p className="text-sm text-muted-foreground">{level.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* XP System */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-2 lg:gap-16 md:px-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
              <Zap className="size-3.5" />
              Gamifikasi XP
            </div>
            <h2 className="mb-3 text-2xl font-extrabold text-foreground">
              Cara Mendapatkan XP
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
              XP (Experience Points) adalah poin progres belajar. Semakin aktif menyelesaikan
              materi dan kuis, semakin cepat level profilmu naik — dan badge baru bisa terbuka.
            </p>
            <ul className="space-y-3">
              {XP_RULES.map((rule) => (
                <li
                  key={rule.label}
                  className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm"
                >
                  <span className="text-foreground">{rule.label}</span>
                  <span className="font-bold text-primary">{rule.xp}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">
              Nilai XP final dapat disesuaikan saat fitur gamifikasi terhubung ke Core Service.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h3 className="text-lg font-bold text-foreground">Tips Belajar Efektif</h3>
            {LEARNING_TIPS.map((tip) => (
              <div
                key={tip.title}
                className="flex gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                  <tip.icon className="size-5" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{tip.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{tip.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-linear-to-br from-brand-navy via-secondary to-brand-navy px-4 py-16 text-center md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-xl"
        >
          <h2 className="mb-3 text-2xl font-extrabold text-white">Siap mulai belajar?</h2>
          <p className="mb-8 text-sm text-white/70">
            Daftar akun gratis dan mulai dari modul N5 yang sudah tersedia.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              className="h-11 gap-2 rounded-full border-0 bg-linear-to-br from-brand-red to-brand-orange px-6 font-semibold text-primary-foreground hover:opacity-90"
            >
              <Link href="/sign-up">
                Daftar Gratis
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 gap-2 rounded-full border-2 border-white/30 bg-white/10 px-6 font-semibold text-white hover:bg-white/20 hover:text-white"
            >
              <Link href="/kursus">
                Lihat Katalog Kursus
                <ChevronRight className="size-4" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </section>

      <MarketingFooter />
    </div>
  );
}
