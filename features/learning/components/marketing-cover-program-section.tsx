'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import type { MarketingCoverItem } from '@/features/learning/lib/load-marketing-catalog-extras';
import { AUTH_ROUTES } from '@/lib/auth/constants';
import { isUnoptimizedImageSrc } from '@/lib/media/image-src';

type MarketingCoverProgramSectionProps = {
  title: string;
  subtitle: string;
  items: MarketingCoverItem[];
  emptyTitle: string;
  emptyDescription: string;
};

/**
 * Teaser grid: cover + “Lihat Detail” → daftar (belum login).
 * Dipakai di katalog marketing `/kursus` untuk Live Class & Tryout.
 * Section selalu tampil; data kosong → EmptyState.
 */
export function MarketingCoverProgramSection({
  title,
  subtitle,
  items,
  emptyTitle,
  emptyDescription,
}: MarketingCoverProgramSectionProps) {
  return (
    <section className="container mx-auto px-4 pb-12 md:px-8">
      <div className="mb-6">
        <h2 className="text-xl font-extrabold text-foreground sm:text-2xl">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>

      {items.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} className="py-8 sm:py-10" />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4 }}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-lg"
            >
              <div className="relative h-44">
                <Image
                  src={item.coverSrc}
                  alt={item.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  unoptimized={isUnoptimizedImageSrc(item.coverSrc)}
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
                <span className="absolute top-3 right-3 rounded-md bg-secondary px-2 py-0.5 text-xs font-bold text-secondary-foreground">
                  {item.level}
                </span>
                <h3 className="absolute right-3 bottom-3 left-3 line-clamp-2 text-sm font-bold text-white">
                  {item.title}
                </h3>
              </div>

              <div className="p-4">
                <Button asChild className="h-10 w-full gap-1.5">
                  <Link href={AUTH_ROUTES.signUp}>
                    Lihat Detail
                    <ChevronRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </section>
  );
}
