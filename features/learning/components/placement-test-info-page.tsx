'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { CheckCircle2, ChevronRight, Compass, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarketingCtaBand } from '@/features/marketing/components/marketing-cta-band';
import { MarketingFooter } from '@/features/marketing/components/marketing-footer';
import { MarketingPageHero } from '@/features/marketing/components/marketing-page-hero';
import { PublicNavbar } from '@/features/marketing/components/public-navbar';
import {
  PLACEMENT_BENEFITS,
  PLACEMENT_HIGHLIGHT,
  PLACEMENT_STEPS,
} from './placement-test-data';

export function PlacementTestInfoPage() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <PublicNavbar activeHref="/tes-penempatan" />

      <MarketingPageHero>
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm">
          <Compass className="size-4 text-brand-yellow" />
          <span className="text-sm font-medium text-white/80">Tes Penempatan JLPT</span>
        </div>
        <h1 className="mb-4 text-[clamp(1.75rem,4vw,3rem)] font-extrabold text-white">
          Bingung mulai
          <br />
          <span className="bg-linear-to-r from-brand-red to-brand-yellow bg-clip-text text-transparent">
            dari level mana?
          </span>
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-white/70">
          Ambil tes penempatan gratis untuk mengetahui level JLPT yang paling cocok dengan kemampuanmu
          saat ini — lalu lanjut belajar dengan jalur yang lebih tepat.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild className="h-11 w-full gap-2 px-6 sm:w-auto">
            <Link href="/dashboard/tes-penempatan">
              <Zap className="size-4" />
              Mulai Tes Penempatan
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-11 w-full border-white/40 bg-white/10 px-6 text-white hover:bg-white/20 hover:text-white sm:w-auto"
          >
            <Link href="/sign-in">Sudah punya akun? Masuk</Link>
          </Button>
        </div>
      </MarketingPageHero>

      <section className="border-y border-border bg-muted/30 py-12">
        <div className="container mx-auto grid gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4 md:px-8">
          {PLACEMENT_BENEFITS.map((benefit, i) => (
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

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto mb-10 max-w-2xl rounded-2xl border border-border bg-card p-6 text-center shadow-sm"
          >
            <PLACEMENT_HIGHLIGHT.icon className="mx-auto mb-3 size-8 text-primary" />
            <h2 className="mb-2 text-lg font-bold text-foreground">{PLACEMENT_HIGHLIGHT.title}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{PLACEMENT_HIGHLIGHT.desc}</p>
            <Button asChild variant="outline" className="mt-5 h-10">
              <Link href="/tryout">
                Lihat Tryout JLPT
                <ChevronRight className="size-4" />
              </Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10 text-center"
          >
            <h2 className="mb-3 text-2xl font-extrabold text-foreground sm:text-3xl">
              Cara mengikuti
            </h2>
            <p className="text-muted-foreground">Tiga langkah singkat dari daftar hingga rekomendasi level.</p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-3">
            {PLACEMENT_STEPS.map((step, i) => (
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
        <p className="mb-2 font-mono text-sm tracking-[0.35em] text-muted-foreground">判定</p>
        <h2 className="mb-4 text-2xl font-extrabold text-foreground sm:text-3xl">
          Siap tahu levelmu?
        </h2>
        <p className="mx-auto mb-8 max-w-lg text-muted-foreground">
          Daftar gratis untuk mengakses tes penempatan di dasbor. Halaman ini hanya info — ujian
          dikerjakan setelah login.
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
