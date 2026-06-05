'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileQuestion,
  Trophy,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JLPT_ACCENT } from '@/features/marketing/components/landing-data';
import { MarketingCtaBand } from '@/features/marketing/components/marketing-cta-band';
import { MarketingFooter } from '@/features/marketing/components/marketing-footer';
import { MarketingPageHero } from '@/features/marketing/components/marketing-page-hero';
import { PublicNavbar } from '@/features/marketing/components/public-navbar';
import { cn } from '@/lib/utils';
import {
  TRYOUT_BENEFITS,
  TRYOUT_OFFERINGS,
  TRYOUT_SCHEDULE,
  TRYOUT_STEPS,
} from './tryout-data';

export function TryoutInfoPage() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <PublicNavbar activeHref="/tryout" />

      <MarketingPageHero contentClassName="px-4 py-14 text-center sm:py-16 md:px-8 md:py-20">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-2 shadow-sm">
            <Trophy className="size-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">JLPT Try Out Center</span>
          </div>
          <h1 className="mb-4 text-[clamp(1.75rem,4vw,3rem)] font-extrabold text-foreground">
            Simulasi Ujian
            <br />
            <span className="bg-linear-to-r from-brand-red to-brand-orange bg-clip-text text-transparent">
              JLPT Terstruktur
            </span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-muted-foreground">
            Halaman info try out JepangKu — jadwal simulasi, level yang tersedia, dan cara mulai.
            Ujian interaktif diakses setelah login dari dashboard.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild className="h-11 w-full gap-2 px-6 sm:w-auto">
              <Link href="/sign-up">
                <Zap className="size-4" />
                Daftar untuk Try Out
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-11 w-full px-6 sm:w-auto">
              <Link href="/sign-in">Sudah punya akun? Masuk</Link>
            </Button>
          </div>
      </MarketingPageHero>

      {/* Benefits */}
      <section className="border-y border-border bg-muted/30 py-12">
        <div className="container mx-auto grid gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4 md:px-8">
          {TRYOUT_BENEFITS.map((benefit, i) => (
            <motion.div
              key={benefit}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
            >
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
              <p className="text-sm text-muted-foreground">{benefit}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Offerings by level */}
      <section className="py-20">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-3 text-2xl font-extrabold text-foreground sm:text-3xl">
              Paket Simulasi per Level
            </h2>
            <p className="mx-auto max-w-xl text-muted-foreground">
              Lima level JLPT — peluncuran awal membuka simulasi N5 terlebih dahulu.
            </p>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TRYOUT_OFFERINGS.map((item, i) => {
              const accent = JLPT_ACCENT[item.accent];
              return (
                <motion.article
                  key={item.level}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className={cn(
                    'flex flex-col rounded-2xl border bg-card p-6 shadow-sm',
                    accent.border,
                  )}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div
                      className={cn(
                        'flex size-11 items-center justify-center rounded-xl text-sm font-bold',
                        accent.bg,
                        accent.text,
                      )}
                    >
                      {item.badge}
                    </div>
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
                        item.status === 'tersedia'
                          ? 'bg-emerald-500/15 text-emerald-600'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {item.statusLabel}
                    </span>
                  </div>
                  <h3 className="mb-1 text-lg font-bold text-foreground">{item.title}</h3>
                  <p className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {item.desc}
                  </p>
                  <div className="mb-4 space-y-2 text-xs text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <Clock className="size-3.5" />
                      Durasi {item.duration}
                    </p>
                    <p className="flex items-center gap-2">
                      <FileQuestion className="size-3.5" />
                      ±{item.questions} soal
                    </p>
                    <p className="flex items-center gap-2">
                      <BarChart3 className="size-3.5" />
                      {item.sections.join(' · ')}
                    </p>
                  </div>
                  <Button
                    asChild
                    variant={item.status === 'tersedia' ? 'default' : 'outline'}
                    className="h-10 w-full"
                  >
                    <Link href={item.status === 'tersedia' ? '/sign-up' : '/hubungi'}>
                      {item.status === 'tersedia' ? 'Daftar & Mulai' : 'Info Jadwal'}
                      <ChevronRight className="size-4" />
                    </Link>
                  </Button>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Schedule */}
      <section className="bg-linear-to-br from-muted/40 to-primary/5 py-20">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background px-4 py-2">
              <Calendar className="size-4 text-primary" />
              <span className="text-sm font-medium text-primary">Jadwal Try Out</span>
            </div>
            <h2 className="mb-3 text-2xl font-extrabold text-foreground sm:text-3xl">
              Sesi Simulasi Mendatang
            </h2>
            <p className="mx-auto max-w-xl text-muted-foreground">
              Jadwal dapat berubah seiring penambahan konten — cek halaman ini secara berkala.
            </p>
          </motion.div>

          <div className="mx-auto max-w-3xl space-y-4">
            {TRYOUT_SCHEDULE.map((slot, i) => (
              <motion.div
                key={slot.id}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-4">
                  <div className="flex min-w-16 flex-col items-center rounded-xl bg-secondary/10 px-3 py-2 text-center">
                    <span className="text-xs font-medium text-muted-foreground">{slot.dayLabel}</span>
                    <span className="text-sm font-bold text-secondary">{slot.level}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{slot.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {slot.dateLabel} · {slot.time}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{slot.note}</p>
                  </div>
                </div>
                <span
                  className={cn(
                    'shrink-0 self-start rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide sm:self-center',
                    slot.status === 'buka'
                      ? 'bg-emerald-500/15 text-emerald-600'
                      : 'bg-amber-500/15 text-amber-600',
                  )}
                >
                  {slot.status === 'buka' ? 'Pendaftaran dibuka' : 'Rencana'}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-3 text-2xl font-extrabold text-foreground sm:text-3xl">
              Cara Mengikuti Try Out
            </h2>
            <p className="text-muted-foreground">
              Empat langkah singkat dari daftar hingga analitik skor.
            </p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TRYOUT_STEPS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {step.step}
                  </span>
                  <step.icon className="size-5 text-primary" />
                </div>
                <h3 className="mb-2 font-bold text-foreground">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <MarketingCtaBand>
        <p className="mb-2 font-mono text-sm tracking-[0.35em] text-muted-foreground">試験</p>
        <h2 className="mb-4 text-2xl font-extrabold text-foreground sm:text-3xl">
          Siap uji level JLPT-mu?
        </h2>
        <p className="mx-auto mb-8 max-w-lg text-muted-foreground">
          Daftar gratis untuk mengakses try out. Ujian interaktif dilakukan setelah login — bukan di
          halaman ini.
        </p>
        <Button asChild size="lg" className="mx-auto h-12 gap-2 px-8 text-base font-bold">
          <Link href="/sign-up">
            <Zap className="size-4" />
            Daftar Sekarang
            <ChevronRight className="size-4" />
          </Link>
        </Button>
      </MarketingCtaBand>

      <MarketingFooter />
    </div>
  );
}
