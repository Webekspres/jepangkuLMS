'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowLeft, FileText } from 'lucide-react';
import { LANDING_SEIGAIHA } from '@/features/marketing/components/landing-data';
import { MarketingFooter } from '@/features/marketing/components/marketing-footer';
import { PublicNavbar } from '@/features/marketing/components/public-navbar';
import type { LegalDocument } from './legal-data';

type LegalDocumentPageProps = {
  document: LegalDocument;
};

export function LegalDocumentPage({ document }: LegalDocumentPageProps) {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <PublicNavbar />

      <section className="relative overflow-hidden bg-linear-to-br from-brand-navy via-secondary to-brand-navy px-4 py-16 text-center sm:py-20 md:px-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(LANDING_SEIGAIHA)}")`,
            backgroundSize: '60px 60px',
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mx-auto max-w-2xl"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/15 px-4 py-2">
            <FileText className="size-4 text-brand-yellow" />
            <span className="text-sm text-brand-yellow">{document.badge}</span>
          </div>
          <h1 className="mb-3 text-[clamp(1.75rem,4vw,2.5rem)] font-extrabold text-white">
            {document.title}
          </h1>
          <p className="text-sm text-white/60">Terakhir diperbarui: {document.lastUpdated}</p>
        </motion.div>
      </section>

      <div className="container mx-auto max-w-3xl px-4 py-10 md:px-8 md:py-14">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Kembali ke Beranda
        </Link>

        <p className="mb-10 rounded-2xl border border-border bg-muted/30 p-5 text-sm leading-relaxed text-muted-foreground">
          {document.intro}
        </p>

        <div className="space-y-8">
          {document.sections.map((section, i) => (
            <motion.section
              key={section.heading}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.03 }}
            >
              <h2 className="mb-3 text-lg font-bold text-foreground">{section.heading}</h2>
              <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                {section.paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
                {section.list && (
                  <ul className="list-disc space-y-1.5 pl-5">
                    {section.list.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.section>
          ))}
        </div>
      </div>

      <MarketingFooter />
    </div>
  );
}
