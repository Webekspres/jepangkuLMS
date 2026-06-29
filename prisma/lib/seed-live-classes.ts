import type { LevelJLPT, PrismaClient } from '@prisma/client';

const DEFAULT_THUMB =
  'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600';

type LiveSessionSeed = {
  title: string;
  daysFromNow: number;
  hour: number;
  minute: number;
  durationMinutes: number;
  meetingUrl: string;
};

type LiveClassSeed = {
  title: string;
  description: string;
  senseiName: string;
  senseiLevel: string;
  category: string;
  level: LevelJLPT;
  priceIdr: number;
  maxSlots: number;
  filledSlots: number;
  sessions: LiveSessionSeed[];
};

const LIVE_CLASSES: LiveClassSeed[] = [
  {
    title: 'Batch N4: Tata Bahasa Intensif',
    description:
      'Program 3 pertemuan menguasai pola kalimat inti N4 — て-form, bentuk sopan, dan aplikasi sehari-hari.',
    senseiName: 'Sensei Yuki Tanaka',
    senseiLevel: 'N2 Instructor',
    category: 'Tata Bahasa',
    level: 'N4',
    priceIdr: 150_000,
    maxSlots: 30,
    filledSlots: 22,
    sessions: [
      {
        title: 'Pertemuan 1 — て-form & Sambungan Kata Kerja',
        daysFromNow: 2,
        hour: 19,
        minute: 0,
        durationMinutes: 90,
        meetingUrl: 'https://zoom.us/j/n4grammar-1',
      },
      {
        title: 'Pertemuan 2 — Bentuk Sopan & Keigo Dasar',
        daysFromNow: 4,
        hour: 19,
        minute: 0,
        durationMinutes: 90,
        meetingUrl: 'https://zoom.us/j/n4grammar-2',
      },
      {
        title: 'Pertemuan 3 — Latihan Soal & Review',
        daysFromNow: 6,
        hour: 19,
        minute: 0,
        durationMinutes: 90,
        meetingUrl: 'https://zoom.us/j/n4grammar-3',
      },
    ],
  },
  {
    title: 'Kanji Speed Drill N5',
    description:
      'Sesi drill intensif: baca, tulis, dan hafal kanji N5 dengan metode visual mnemonik bersama.',
    senseiName: 'Sensei Hana Matsuda',
    senseiLevel: 'N1 Native',
    category: 'Kanji',
    level: 'N5',
    priceIdr: 0,
    maxSlots: 25,
    filledSlots: 18,
    sessions: [
      {
        title: 'Pertemuan 1 — 50 Kanji Dasar',
        daysFromNow: 3,
        hour: 20,
        minute: 0,
        durationMinutes: 60,
        meetingUrl: 'https://zoom.us/j/kanjidrill-1',
      },
      {
        title: 'Pertemuan 2 — 50 Kanji Lanjutan',
        daysFromNow: 5,
        hour: 20,
        minute: 0,
        durationMinutes: 60,
        meetingUrl: 'https://zoom.us/j/kanjidrill-2',
      },
    ],
  },
  {
    title: 'Daily Conversation: Situasi di Kantor',
    description:
      'Praktik percakapan sehari-hari di lingkungan kerja Jepang — salam, meminta tolong, melapor ke atasan.',
    senseiName: 'Sensei Kenji Watanabe',
    senseiLevel: 'N1 Business',
    category: 'Speaking',
    level: 'N3',
    priceIdr: 200_000,
    maxSlots: 20,
    filledSlots: 13,
    sessions: [
      {
        title: 'Pertemuan 1 — Salam & Perkenalan Formal',
        daysFromNow: 4,
        hour: 18,
        minute: 30,
        durationMinutes: 90,
        meetingUrl: 'https://zoom.us/j/bizconvo-1',
      },
      {
        title: 'Pertemuan 2 — Melapor & Meminta Tolong',
        daysFromNow: 8,
        hour: 18,
        minute: 30,
        durationMinutes: 90,
        meetingUrl: 'https://zoom.us/j/bizconvo-2',
      },
    ],
  },
];

function addDays(base: Date, days: number, hour: number, minute: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

export async function seedLiveClasses(prisma: PrismaClient): Promise<void> {
  const now = new Date();

  for (const program of LIVE_CLASSES) {
    const programData = {
      title: program.title,
      description: program.description,
      senseiName: program.senseiName,
      senseiLevel: program.senseiLevel,
      category: program.category,
      level: program.level,
      priceIdr: program.priceIdr,
      maxSlots: program.maxSlots,
      filledSlots: program.filledSlots,
      thumbUrl: DEFAULT_THUMB,
      isPublished: true,
    };

    const existing = await prisma.liveClass.findFirst({
      where: { title: program.title },
      select: { id: true },
    });

    const liveClassId = existing
      ? (await prisma.liveClass.update({ where: { id: existing.id }, data: programData })).id
      : (await prisma.liveClass.create({ data: programData })).id;

    // Idempotent: bersihkan sesi lama lalu buat ulang dari definisi seed.
    await prisma.liveClassSession.deleteMany({ where: { liveClassId } });

    await prisma.liveClassSession.createMany({
      data: program.sessions.map((session) => {
        const scheduledAt = addDays(now, session.daysFromNow, session.hour, session.minute);
        return {
          liveClassId,
          title: session.title,
          scheduledAt,
          endsAt: new Date(scheduledAt.getTime() + session.durationMinutes * 60_000),
          meetingUrl: session.meetingUrl,
        };
      }),
    });
  }
}
