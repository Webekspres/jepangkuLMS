'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  EnrolledCourseCard,
  KURSUS_SAYA_TABS,
  KursusSayaExploreCta,
  isEnrolledCourseCompleted,
  type KursusSayaTab,
} from '@/features/student/components/kursus-saya';
import type { KursusEnrollmentCard } from '@/features/student/lib/load-student-learning-data';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';

export type StudentKursusSayaPageProps = {
  enrolledCards: KursusEnrollmentCard[];
};

const TAB_EMPTY_COPY: Record<Exclude<KursusSayaTab, 'semua'>, { title: string; description: string }> =
  {
    berjalan: {
      title: 'Belum ada kursus sedang berjalan',
      description: 'Kursus yang sedang kamu pelajari akan muncul di tab ini.',
    },
    selesai: {
      title: 'Belum ada kursus selesai',
      description: 'Selesaikan semua pelajaran di kursusmu untuk melihatnya di sini.',
    },
  };

function filterByTab(cards: KursusEnrollmentCard[], tab: KursusSayaTab) {
  if (tab === 'semua') return cards;
  if (tab === 'selesai') {
    return cards.filter((card) =>
      isEnrolledCourseCompleted(card.enrollment.status, card.enrollment.progress),
    );
  }
  return cards.filter(
    (card) => !isEnrolledCourseCompleted(card.enrollment.status, card.enrollment.progress),
  );
}

function EnrolledCourseList({ cards }: { cards: KursusEnrollmentCard[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card, index) => (
        <EnrolledCourseCard
          key={card.course.slug}
          course={card.course}
          progress={card.enrollment.progress}
          continueLessonSlug={card.enrollment.continueLessonSlug || null}
          status={card.enrollment.status}
          index={index}
        />
      ))}
    </div>
  );
}

export function StudentKursusSayaPage({ enrolledCards }: StudentKursusSayaPageProps) {
  const [activeTab, setActiveTab] = useState<KursusSayaTab>('semua');

  if (enrolledCards.length === 0) {
    return (
      <div className="pb-10">
        <header className="mb-8 space-y-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-brand-navy  md:text-3xl">
            Kursus Saya
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Lanjutkan belajar dari titik terakhir atau buka detail kursus untuk melihat materi
            lengkap.
          </p>
        </header>

        <EmptyState
          className="rounded-2xl border border-dashed border-border bg-card/50"
          title="Belum ada kursus terdaftar"
          description="Daftar kursus dari katalog untuk mulai belajar bahasa Jepang sesuai levelmu."
          action={
            <Button asChild className="gap-2">
              <Link href={STUDENT_ROUTES.kursus}>
                <Compass className="size-4" />
                Jelajahi katalog kursus
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="pb-10">
      <header className="mb-6 space-y-2 md:mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-brand-navy  md:text-3xl">
          Kursus Saya
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
          Lanjutkan belajar dari titik terakhir atau buka detail kursus untuk melihat materi
          lengkap.
        </p>
      </header>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as KursusSayaTab)}
        className="gap-6"
      >
        <TabsList variant="line" className="w-full justify-start">
          {KURSUS_SAYA_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {KURSUS_SAYA_TABS.map((tab) => {
          const tabCards = filterByTab(enrolledCards, tab.value);

          return (
            <TabsContent key={tab.value} value={tab.value} className="mt-0">
              {tabCards.length > 0 ? (
                <EnrolledCourseList cards={tabCards} />
              ) : tab.value === 'semua' ? null : (
                <div className="rounded-2xl border border-dashed border-border bg-card/40 px-6 py-12 text-center">
                  <p className="font-semibold text-foreground">{TAB_EMPTY_COPY[tab.value].title}</p>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {TAB_EMPTY_COPY[tab.value].description}
                  </p>
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      <KursusSayaExploreCta />
    </div>
  );
}
