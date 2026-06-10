'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  Lock,
  MessageCircle,
  Phone,
  Play,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JLPT_ACCENT } from '@/features/marketing/components/landing-data';
import { MarketingFooter } from '@/features/marketing/components/marketing-footer';
import { PUBLIC_NAV_STICKY_TOP } from '@/features/marketing/components/marketing-nav-layout';
import { PublicNavbar } from '@/features/marketing/components/public-navbar';
import { cn } from '@/lib/utils';
import {
  ADMIN_WA_NUMBER,
  PAYMENT_BCA,
  type CourseDetail,
} from './course-detail-data';

type CourseDetailPageProps = {
  course: CourseDetail;
};

export function CourseDetailPage({ course }: CourseDetailPageProps) {
  const [copied, setCopied] = useState(false);
  const accent = JLPT_ACCENT[course.accent];
  const isFree = course.priceNum === 0;
  const isAvailable = course.availability === 'tersedia';

  const waConsultText = encodeURIComponent(
    `Halo, saya ingin konsultasi mengenai kursus "${course.title}" (${course.price}).`,
  );
  const waPaymentText = encodeURIComponent(
    `Halo, saya ingin konfirmasi pembayaran untuk kursus "${course.title}" (${course.price}).\n\nNama: [nama Anda]\nNo. Rekening tujuan: ${PAYMENT_BCA.bank} ${PAYMENT_BCA.accountNumber} a/n ${PAYMENT_BCA.accountName}\n\nMohon konfirmasi. Terima kasih!`,
  );

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(PAYMENT_BCA.accountNumber).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <PublicNavbar activeHref="/kursus" />

      {/* Sub-nav breadcrumb */}
      <div className="border-b border-border bg-header backdrop-blur-md dark:backdrop-blur-none">
        <div className="container mx-auto flex items-center gap-3 px-4 py-3 md:px-8">
          <Link
            href="/kursus"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Kembali ke Katalog
          </Link>
          <span className="text-muted-foreground/40">/</span>
          <span className="line-clamp-1 text-sm font-medium text-foreground">{course.title}</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 sm:py-10 md:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="space-y-6 lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl shadow-lg"
            >
              <Image
                src={course.thumb}
                alt={course.title}
                width={800}
                height={320}
                className="h-52 w-full object-cover sm:h-64"
                priority
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'rounded-lg px-2.5 py-1 text-xs font-bold text-white',
                    accent.badge,
                  )}
                >
                  {course.level}
                </span>
                {course.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-lg bg-white/20 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div
                className={cn(
                  'absolute top-4 right-4 flex size-10 items-center justify-center rounded-xl text-xs font-bold text-white shadow',
                  accent.badge,
                )}
              >
                {course.badge}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <h1 className="mb-3 text-[clamp(1.25rem,3vw,1.75rem)] font-extrabold text-foreground">
                {course.title}
              </h1>
              <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{course.fullDesc}</p>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Play className="size-4 text-primary" />
                  {course.lessons} pelajaran
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-4 text-emerald-600" />
                  {course.duration} total
                </span>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide',
                    isAvailable
                      ? 'bg-emerald-500/15 text-emerald-600'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {course.availabilityLabel}
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              <h2 className="mb-4 flex items-center gap-2 font-bold text-foreground">
                <BookOpen className="size-5 text-primary" />
                Yang akan kamu pelajari
              </h2>
              <ul className="space-y-2.5">
                {course.whatYouLearn.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-foreground">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Silabus preview locked */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold text-foreground">Silabus Kursus</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Preview modul — daftar & masuk untuk akses penuh
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <Lock className="size-3" />
                  Preview
                </span>
              </div>

              <div className="space-y-4">
                {course.syllabus.map((module) => (
                  <div key={module.title} className="overflow-hidden rounded-xl border border-border">
                    <div className="bg-muted/40 px-4 py-2.5 text-sm font-semibold text-foreground">
                      {module.title}
                    </div>
                    <ul className="divide-y divide-border">
                      {module.items.map((item) => (
                        <li
                          key={item.title}
                          className={cn(
                            'flex items-center justify-between gap-3 px-4 py-3 text-sm',
                            item.locked && 'bg-muted/20',
                          )}
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            {item.locked ? (
                              <Lock className="size-3.5 shrink-0 text-muted-foreground" />
                            ) : (
                              <Play className="size-3.5 shrink-0 text-primary" />
                            )}
                            <span
                              className={cn(
                                'truncate',
                                item.locked ? 'text-muted-foreground' : 'text-foreground',
                              )}
                            >
                              {item.title}
                            </span>
                          </div>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {item.locked ? 'Terdaftar' : item.duration}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar CTA */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className={cn('space-y-4 lg:sticky', PUBLIC_NAV_STICKY_TOP)}
            >
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="mb-1 flex items-baseline justify-between">
                  <span
                    className={cn(
                      'text-2xl font-extrabold',
                      isFree ? 'text-emerald-600' : 'text-primary',
                    )}
                  >
                    {isFree ? 'GRATIS' : course.price}
                  </span>
                  {!isFree && <span className="text-xs text-muted-foreground">sekali bayar</span>}
                </div>
                <p className="mb-5 text-xs text-muted-foreground">
                  {isAvailable
                    ? 'Akses modul yang sudah rilis · Update gratis'
                    : 'Kursus dalam tahap persiapan rilis'}
                </p>

                {!isFree && isAvailable && (
                  <div className="mb-5 flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2.5 text-xs text-muted-foreground">
                    <Shield className="size-4 shrink-0 text-emerald-600" />
                    Garansi uang kembali 7 hari jika tidak puas
                  </div>
                )}

                {isAvailable && isFree ? (
                  <Button asChild className="h-11 w-full gap-2 font-bold">
                    <Link href="/sign-in">
                      <Play className="size-4" />
                      Mulai Belajar Gratis
                    </Link>
                  </Button>
                ) : isAvailable && !isFree ? (
                  <>
                    <div className="mb-4">
                      <p className="mb-3 text-xs font-medium tracking-wider text-muted-foreground uppercase">
                        Transfer via {PAYMENT_BCA.bank}
                      </p>
                      <div className="space-y-2 rounded-xl bg-muted/50 p-3.5">
                        <div>
                          <p className="text-xs text-muted-foreground">Nama Rekening</p>
                          <p className="text-sm font-semibold text-foreground">
                            {PAYMENT_BCA.accountName}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Nomor Rekening</p>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-base font-bold tracking-widest text-foreground">
                              {PAYMENT_BCA.accountNumber}
                            </p>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={handleCopyAccount}
                              className={cn(
                                'h-8 gap-1 rounded-lg px-2.5 text-xs font-medium',
                                copied && 'bg-emerald-500/15 text-emerald-600',
                              )}
                            >
                              {copied ? (
                                <>
                                  <CheckCircle2 className="size-3.5" />
                                  Tersalin
                                </>
                              ) : (
                                <>
                                  <Copy className="size-3.5" />
                                  Salin
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                        <div className="border-t border-border pt-1">
                          <p className="text-xs text-muted-foreground">Jumlah Transfer</p>
                          <p className="text-sm font-bold text-primary">{course.price}</p>
                        </div>
                      </div>
                    </div>
                    <Button
                      asChild
                      variant="secondary"
                      className="mb-3 h-11 w-full gap-2 font-bold"
                    >
                      <a
                        href={`https://wa.me/${ADMIN_WA_NUMBER}?text=${waPaymentText}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="size-4" />
                        Konfirmasi Pembayaran
                      </a>
                    </Button>
                    <Button asChild variant="outline" className="h-11 w-full gap-2 font-bold">
                      <a
                        href={`https://wa.me/${ADMIN_WA_NUMBER}?text=${waConsultText}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Phone className="size-4" />
                        Konsultasi Terlebih Dahulu
                      </a>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild className="mb-3 h-11 w-full gap-2 font-bold">
                      <Link href="/sign-up">
                        Daftar untuk Notifikasi Rilis
                        <ChevronRight className="size-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-11 w-full gap-2 font-semibold">
                      <a
                        href={`https://wa.me/${ADMIN_WA_NUMBER}?text=${waConsultText}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="size-4" />
                        Tanya via WhatsApp
                      </a>
                    </Button>
                  </>
                )}
              </div>

              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <p className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Kursus ini meliputi
                </p>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  {course.includes.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <MarketingFooter />
    </div>
  );
}
