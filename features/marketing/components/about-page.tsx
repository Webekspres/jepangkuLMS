'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight, Sparkles, Target, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarketingCtaBand } from '@/features/marketing/components/marketing-cta-band';
import { MarketingFooter } from '@/features/marketing/components/marketing-footer';
import { MarketingPageHero } from '@/features/marketing/components/marketing-page-hero';
import { PublicNavbar } from '@/features/marketing/components/public-navbar';
import { cn } from '@/lib/utils';
import {
  ABOUT_FACTS,
  ABOUT_HERO,
  ABOUT_MISSION,
  ABOUT_PILLARS,
  ABOUT_TEAM,
  ABOUT_VISION,
  TEAM_ACCENT,
} from './about-data';

export function AboutPage() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <PublicNavbar activeHref="/tentang" />

      <MarketingPageHero>
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm">
          <Sparkles className="size-4 text-brand-yellow" />
          <span className="text-sm font-medium text-white/80">{ABOUT_HERO.badge}</span>
        </div>
        <h1 className="mb-5 text-[clamp(2rem,5vw,3.25rem)] leading-tight font-extrabold text-white">
          {ABOUT_HERO.title.split(' ').slice(0, -1).join(' ')}{' '}
          <span className="bg-linear-to-r from-brand-red to-brand-yellow bg-clip-text text-transparent">
            {ABOUT_HERO.title.split(' ').slice(-1)}
          </span>
        </h1>
        <p className="mx-auto max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
          {ABOUT_HERO.subtitle}
        </p>
      </MarketingPageHero>

      {/* Facts — faktual, tanpa angka palsu */}
      <section className="relative z-10 py-12 pt-14 sm:pt-16">
        <div className="container mx-auto grid grid-cols-2 gap-4 px-4 md:px-8 lg:grid-cols-4">
          {ABOUT_FACTS.map((fact, i) => (
            <motion.div
              key={fact.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl border border-border bg-card p-5 text-center shadow-sm"
            >
              <p className="text-xl font-extrabold text-foreground sm:text-2xl">{fact.value}</p>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{fact.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Visi & Misi */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto grid gap-8 px-4 md:px-8 lg:grid-cols-2 lg:gap-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-border bg-card p-6 sm:p-8"
          >
            <div className="mb-4 flex items-center gap-2">
              <Target className="size-5 text-primary" />
              <h2 className="text-xl font-extrabold text-foreground sm:text-2xl">
                {ABOUT_VISION.title}
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground italic sm:text-base">
              {ABOUT_VISION.body}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-border bg-card p-6 sm:p-8"
          >
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              <h2 className="text-xl font-extrabold text-foreground sm:text-2xl">
                {ABOUT_MISSION.title}
              </h2>
            </div>
            <ul className="space-y-3">
              {ABOUT_MISSION.items.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 text-sm leading-relaxed text-muted-foreground italic sm:text-base"
                >
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Nilai / pilar */}
      <section className="bg-muted/30 py-16 sm:py-20">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-3 text-2xl font-extrabold text-foreground sm:text-3xl">
              Apa yang Kami Bangun
            </h2>
            <p className="mx-auto max-w-lg text-muted-foreground">
              Fondasi produk JepangKu LMS — bukan janji statistik, melainkan arah platform.
            </p>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ABOUT_PILLARS.map((pillar, i) => (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm"
              >
                <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <pillar.icon className="size-6" />
                </div>
                <h3 className="mb-2 text-sm font-bold text-foreground">{pillar.title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {pillar.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tim — placeholder */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-3 text-2xl font-extrabold text-foreground sm:text-3xl">
              Tim di Balik JepangKu
            </h2>
            <p className="mx-auto max-w-lg text-muted-foreground">
              Di balik JepangKu LMS, terdapat tim profesional yang berdedikasi membantu Anda menguasai bahasa Jepang secara efektif.
            </p>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ABOUT_TEAM.map((member, i) => (
              <motion.article
                key={member.initials}
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm"
              >
                <div
                  className={cn(
                    'mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl text-lg font-bold text-primary-foreground shadow-md',
                    TEAM_ACCENT[member.accent],
                  )}
                >
                  {member.initials}
                </div>
                <h3 className="mb-1 text-sm font-bold text-foreground">{member.name}</h3>
                <p className="mb-2 text-xs font-medium text-primary">{member.role}</p>
                <p className="text-xs leading-relaxed text-muted-foreground italic">
                  {member.bio}
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <MarketingCtaBand>
        <p className="mb-3 font-mono text-sm tracking-[0.35em] text-muted-foreground">一緒に頑張ろう</p>
        <h2 className="mb-4 text-2xl font-extrabold text-foreground sm:text-3xl">
          Mulai perjalanan Japanmu
        </h2>
        <p className="mx-auto mb-8 max-w-lg text-muted-foreground">
          Jadilah bagian dari komunitas awal JepangKu — daftar gratis dan mulai dari modul N5.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="h-12 w-full gap-2 px-8 sm:w-auto">
            <Link href="/sign-up">
              <Zap className="size-4" />
              Daftar Gratis
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-12 w-full gap-2 px-8 sm:w-auto">
            <Link href="/kursus">
              Lihat Kursus
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </MarketingCtaBand>

      <MarketingFooter />
    </div>
  );
}
