'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ChevronRight, Clock, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import type { MarketingCoverItem } from '@/features/learning/lib/load-marketing-catalog-extras';
import { formatIdr, isFreeCourse } from '@/lib/lms/format-price';
import { isUnoptimizedImageSrc } from '@/lib/media/image-src';
import { cn } from '@/lib/utils';

type MarketingCoverProgramSectionProps = {
  title: string;
  subtitle: string;
  items: MarketingCoverItem[];
  emptyTitle: string;
  emptyDescription: string;
};

/**
 * Grid kartu Live Class / Tryout di katalog marketing `/kursus`.
 * Layout selaras kartu kursus: cover, desc, harga, Lihat Detail → detail publik.
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
          {items.map((item, i) => {
            const priceLabel = formatIdr(item.priceIdr);
            const isFree = isFreeCourse(item.priceIdr);

            return (
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
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
                  <span className="absolute bottom-3 left-3 rounded-md bg-secondary px-2 py-0.5 text-xs font-bold text-secondary-foreground">
                    {item.level}
                  </span>
                </div>

                <div className="p-5">
                  <h3 className="mb-2 text-sm font-bold text-foreground">{item.title}</h3>
                  <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>

                  {item.metaLabel ? (
                    <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {item.metaLabel}
                      </span>
                    </div>
                  ) : null}

                  <div className="flex items-center justify-end">
                    <span
                      className={cn(
                        'text-sm font-bold',
                        isFree ? 'text-emerald-600' : 'text-primary',
                      )}
                    >
                      {priceLabel}
                    </span>
                  </div>

                  <Button asChild className="mt-4 h-10 w-full gap-1.5">
                    <Link href={item.detailHref}>
                      <Play className="size-4" />
                      Lihat Detail
                      <ChevronRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}
    </section>
  );
}
