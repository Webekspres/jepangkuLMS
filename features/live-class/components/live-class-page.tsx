'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import {
  Calendar,
  ChevronRight,
  Clock,
  ExternalLink,
  Filter,
  PlayCircle,
  Search,
  User,
  Video,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JLPT_ACCENT } from '@/features/marketing/components/landing-data';
import { LEVEL_ACCENT } from '@/features/learning/components/courses-data';
import type { LiveClassView, LiveSessionView } from '@/features/student/lib/load-dashboard-extras';
import { buildWhatsAppUrl } from '@/lib/admin-contact';
import { cn } from '@/lib/utils';

function LiveSessionRow({ session }: { session: LiveSessionView }) {
  return (
    <div className="rounded-lg bg-muted/40 p-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-foreground">{session.title}</p>
          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="size-3 text-emerald-500" />
            {session.dateLabel} · {session.timeLabel}
          </p>
        </div>
        {session.status === 'live' ? (
          <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
            LIVE
          </span>
        ) : session.status === 'ended' ? (
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            Selesai
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
            Akan datang
          </span>
        )}
      </div>

      {session.status === 'live' && session.meetingUrl ? (
        <Button asChild size="sm" className="mt-2 h-8 w-full gap-2 bg-secondary hover:bg-secondary/90">
          <a href={session.meetingUrl} target="_blank" rel="noopener noreferrer">
            <Video className="size-3.5" />
            Gabung via Zoom
            <ExternalLink className="size-3 opacity-70" />
          </a>
        </Button>
      ) : session.status === 'ended' && session.recordingUrl ? (
        <Button asChild size="sm" variant="outline" className="mt-2 h-8 w-full gap-2">
          <a href={session.recordingUrl} target="_blank" rel="noopener noreferrer">
            <PlayCircle className="size-3.5" />
            Tonton Rekaman
          </a>
        </Button>
      ) : (
        <Button disabled size="sm" variant="outline" className="mt-2 h-8 w-full">
          {session.status === 'ended' ? 'Rekaman belum tersedia' : 'Belum dimulai'}
        </Button>
      )}
    </div>
  );
}

const CATEGORIES = ['Semua', 'Tata Bahasa', 'Kosa Kata', 'Kanji', 'Speaking', 'JLPT Tips'] as const;

type LiveClassPageProps = {
  classes: LiveClassView[];
};

export function LiveClassPage({ classes }: LiveClassPageProps) {
  const [activeCategory, setActiveCategory] = useState<(typeof CATEGORIES)[number]>('Semua');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return classes.filter((item) => {
      const catMatch = activeCategory === 'Semua' || item.category === activeCategory;
      const searchMatch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.senseiName.toLowerCase().includes(q);
      return catMatch && searchMatch;
    });
  }, [classes, activeCategory, search]);

  const instructorCount = useMemo(
    () => new Set(classes.map((item) => item.senseiName)).size,
    [classes],
  );

  return (
    <div className="space-y-8 pb-10">
      <section
        className="relative overflow-hidden rounded-2xl px-6 py-10 text-center sm:px-10"
        style={{ background: 'linear-gradient(135deg, #1E1B57 0%, #1a2d5a 60%, #2a1b4e 100%)' }}
      >
        <div className="relative z-10 mx-auto max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
            <Video className="size-4 text-brand-yellow" />
            Jadwal Live Class
          </div>
          <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] font-extrabold text-white">
            Belajar Langsung Bersama{' '}
            <span className="bg-linear-to-r from-brand-orange to-brand-yellow bg-clip-text text-transparent">
              Sensei Berpengalaman
            </span>
          </h1>
          <p className="mt-3 text-sm text-white/75 sm:text-base">
            Sesi live via Zoom — tanya jawab langsung, latihan interaktif, dan feedback real-time.
          </p>
          <div className="relative mx-auto mt-6 max-w-md">
            <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-white/40" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari kelas, sensei..."
              className="w-full rounded-2xl border border-white/20 bg-white/10 py-3.5 pr-4 pl-10 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/40"
            />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-center gap-4 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        <span>
          <strong className="text-foreground">{classes.length}+</strong> kelas terjadwal
        </span>
        <span>·</span>
        <span>
          <strong className="text-foreground">{instructorCount}</strong> instruktur aktif
        </span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="size-4 shrink-0 text-muted-foreground" />
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={cn(
              'shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all',
              activeCategory === cat
                ? 'bg-secondary text-secondary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80',
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} kelas tersedia</p>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((cls, index) => {
          const accent = JLPT_ACCENT[LEVEL_ACCENT[cls.level]];
          const fillPct = Math.round((cls.filledSlots / cls.maxSlots) * 100);

          return (
            <motion.article
              key={cls.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
            >
              <div className="relative h-40">
                <Image
                  src={cls.thumbUrl ?? 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600'}
                  alt={cls.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute top-3 left-3 flex gap-1.5">
                  <span className={cn('rounded-md px-2 py-0.5 text-xs font-bold text-white', accent.badge)}>
                    {cls.level}
                  </span>
                  <span className="rounded-md bg-white/20 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                    {cls.category}
                  </span>
                </div>
                {cls.isFull ? (
                  <span className="absolute top-3 right-3 rounded-lg bg-destructive px-2.5 py-1 text-xs font-bold text-white">
                    Penuh
                  </span>
                ) : null}
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs font-medium text-white">
                  <User className="size-3.5" />
                  {cls.senseiName}
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-sm font-bold text-foreground">{cls.title}</h3>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {cls.description}
                </p>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-blue-500" />
                    {cls.sessionCount} pertemuan
                  </span>
                  <span className="font-semibold text-foreground">
                    {cls.priceIdr > 0
                      ? `Rp${cls.priceIdr.toLocaleString('id-ID')}`
                      : 'Gratis'}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>
                      {cls.filledSlots}/{cls.maxSlots} peserta
                    </span>
                    <span>{fillPct}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        cls.isFull ? 'bg-destructive' : fillPct > 75 ? 'bg-amber-500' : 'bg-emerald-500',
                      )}
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 space-y-2 border-t border-border pt-3">
                  {cls.sessions.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Jadwal pertemuan belum tersedia.</p>
                  ) : (
                    cls.sessions.map((session) => (
                      <LiveSessionRow key={session.id} session={session} />
                    ))
                  )}
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          Tidak ada kelas untuk filter ini.
        </div>
      ) : null}

      <section className="rounded-2xl border border-border bg-muted/30 px-6 py-10 text-center">
        <h2 className="text-xl font-extrabold text-foreground">Mau topik kelas khusus?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Request topik live class yang kamu butuhkan langsung ke tim kami.
        </p>
        <Button asChild className="mt-5 gap-2 bg-emerald-600 hover:bg-emerald-700">
          <a
            href={buildWhatsAppUrl('Halo, saya ingin request topik live class:')}
            target="_blank"
            rel="noopener noreferrer"
          >
            Request Kelas
            <ChevronRight className="size-4" />
          </a>
        </Button>
      </section>
    </div>
  );
}
