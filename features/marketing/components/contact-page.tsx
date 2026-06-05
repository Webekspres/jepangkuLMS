'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { Clock, Mail, MessageCircle, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarketingFooter } from '@/features/marketing/components/marketing-footer';
import { MarketingPageHero } from '@/features/marketing/components/marketing-page-hero';
import { PublicNavbar } from '@/features/marketing/components/public-navbar';
import {
  ADMIN_CONTACT,
  CONTACT_FAQ,
  CONTACT_HERO,
  CONTACT_TOPICS,
  CONTACT_WA_DEFAULT_URL,
  getTopicWhatsAppUrl,
} from './contact-data';

export function ContactPage() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <PublicNavbar />

      <MarketingPageHero>
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-2 shadow-sm">
          <MessageCircle className="size-4 text-primary" />
          <span className="text-sm font-medium text-muted-foreground">{CONTACT_HERO.badge}</span>
        </div>
        <h1 className="mb-5 text-[clamp(2rem,5vw,3rem)] font-extrabold text-foreground">
          {CONTACT_HERO.title}
        </h1>
        <p className="mx-auto text-base leading-relaxed text-muted-foreground sm:text-lg">
          {CONTACT_HERO.subtitle}
        </p>
        <Button asChild size="lg" className="mt-8 h-12 gap-2 px-8 text-base font-bold">
          <a href={CONTACT_WA_DEFAULT_URL} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="size-5" />
            Chat via WhatsApp
          </a>
        </Button>
      </MarketingPageHero>

      {/* Contact info cards */}
      <section className="relative z-10 py-12 pt-14 sm:pt-16">
        <div className="container mx-auto grid gap-4 px-4 sm:grid-cols-3 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <Phone className="mb-3 size-5 text-emerald-600" />
            <p className="text-sm font-semibold text-foreground">WhatsApp Admin</p>
            <p className="mt-1 text-sm text-muted-foreground">{ADMIN_CONTACT.waDisplay}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.06 }}
            className="rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <Mail className="mb-3 size-5 text-primary" />
            <p className="text-sm font-semibold text-foreground">Email</p>
            <a
              href={`mailto:${ADMIN_CONTACT.email}`}
              className="mt-1 block text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              {ADMIN_CONTACT.email}
            </a>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.12 }}
            className="rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <Clock className="mb-3 size-5 text-brand-orange" />
            <p className="text-sm font-semibold text-foreground">Jam Operasional</p>
            <p className="mt-1 text-sm text-muted-foreground">{ADMIN_CONTACT.hours}</p>
            <p className="mt-1 text-xs text-muted-foreground">{ADMIN_CONTACT.responseNote}</p>
          </motion.div>
        </div>
      </section>

      {/* Topics */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4 md:px-8">
          <div className="mb-10 text-center">
            <h2 className="mb-2 text-2xl font-extrabold text-foreground sm:text-3xl">
              Pilih Topik Bantuan
            </h2>
            <p className="text-sm text-muted-foreground">
              Klik topik di bawah — pesan WhatsApp akan terisi otomatis
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {CONTACT_TOPICS.map((topic, i) => (
              <motion.a
                key={topic.title}
                href={getTopicWhatsAppUrl(topic.message)}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -3 }}
                className="group flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:border-primary/30 hover:shadow-md"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <topic.icon className="size-5" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{topic.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{topic.desc}</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                    <MessageCircle className="size-3.5" />
                    Chat WhatsApp
                  </span>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border bg-muted/30 py-12 sm:py-16">
        <div className="container mx-auto max-w-2xl px-4 md:px-8">
          <h2 className="mb-8 text-center text-2xl font-extrabold text-foreground">
            Pertanyaan Umum
          </h2>
          <div className="space-y-4">
            {CONTACT_FAQ.map((item, i) => (
              <motion.div
                key={item.q}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <p className="font-semibold text-foreground">{item.q}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 text-center md:px-8">
        <h2 className="mb-2 text-xl font-extrabold text-foreground">Masih bingung mulai dari mana?</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Lihat panduan belajar atau jelajahi katalog kursus terlebih dahulu.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild variant="outline" className="h-11 px-6">
            <Link href="/cara-belajar">Cara Belajar</Link>
          </Button>
          <Button asChild className="h-11 px-6">
            <Link href="/kursus">Lihat Kursus</Link>
          </Button>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
