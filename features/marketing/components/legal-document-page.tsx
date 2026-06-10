'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowLeft, FileText } from 'lucide-react';
import { MarketingFooter } from '@/features/marketing/components/marketing-footer';
import { MarketingPageHero } from '@/features/marketing/components/marketing-page-hero';
import { PublicNavbar } from '@/features/marketing/components/public-navbar';
import type { LegalDocument } from './legal-data';

type LegalDocumentPageProps = {
  document: LegalDocument;
};

export function LegalDocumentPage({ document }: LegalDocumentPageProps) {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <PublicNavbar />

      <MarketingPageHero contentClassName="px-4 py-14 text-center sm:py-16 md:px-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-2 shadow-sm">
          <FileText className="size-4 text-primary" />
          <span className="text-sm font-medium text-muted-foreground">{document.badge}</span>
        </div>
        <h1 className="mb-3 text-[clamp(1.75rem,4vw,2.5rem)] font-extrabold text-foreground">
          {document.title}
        </h1>
        <p className="text-sm text-muted-foreground">Terakhir diperbarui: {document.lastUpdated}</p>
      </MarketingPageHero>

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
