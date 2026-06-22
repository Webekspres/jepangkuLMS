import type { LevelJLPT, PrismaClient } from '@prisma/client';

const DEFAULT_THUMB =
  'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600';

type LiveClassSeed = {
  title: string;
  description: string;
  senseiName: string;
  senseiLevel: string;
  category: string;
  level: LevelJLPT;
  daysFromNow: number;
  hour: number;
  minute: number;
  durationMinutes: number;
  maxSlots: number;
  filledSlots: number;
  meetingUrl: string;
};

const LIVE_CLASSES: LiveClassSeed[] = [
  {
    title: 'Pola Kalimat N4: てform & Aplikasinya',
    description:
      'Pelajari penggunaan て-form secara menyeluruh — dari sambungan kata kerja hingga bentuk sopan sehari-hari.',
    senseiName: 'Sensei Yuki Tanaka',
    senseiLevel: 'N2 Instructor',
    category: 'Tata Bahasa',
    level: 'N4',
    daysFromNow: 2,
    hour: 19,
    minute: 0,
    durationMinutes: 90,
    maxSlots: 30,
    filledSlots: 22,
    meetingUrl: 'https://zoom.us/j/example1',
  },
  {
    title: 'Kanji Speed Drill — 50 Kanji N5 dalam 60 Menit',
    description:
      'Sesi drill intensif: baca, tulis, dan hafal 50 kanji N5 dengan metode visual mnemonik bersama.',
    senseiName: 'Sensei Hana Matsuda',
    senseiLevel: 'N1 Native',
    category: 'Kanji',
    level: 'N5',
    daysFromNow: 3,
    hour: 20,
    minute: 0,
    durationMinutes: 60,
    maxSlots: 25,
    filledSlots: 25,
    meetingUrl: 'https://zoom.us/j/example2',
  },
  {
    title: 'Daily Conversation: Situasi di Kantor',
    description:
      'Praktik percakapan sehari-hari di lingkungan kerja Jepang — salam, meminta tolong, melapor ke atasan.',
    senseiName: 'Sensei Kenji Watanabe',
    senseiLevel: 'N1 Business',
    category: 'Speaking',
    level: 'N3',
    daysFromNow: 4,
    hour: 18,
    minute: 30,
    durationMinutes: 90,
    maxSlots: 20,
    filledSlots: 13,
    meetingUrl: 'https://zoom.us/j/example3',
  },
  {
    title: 'JLPT N3 Tips & Trik: Dokkai Section',
    description:
      'Strategi menjawab soal membaca N3 — teknik skimming, menemukan kata kunci, dan manajemen waktu.',
    senseiName: 'Sensei Yuki Tanaka',
    senseiLevel: 'N2 Instructor',
    category: 'JLPT Tips',
    level: 'N3',
    daysFromNow: 6,
    hour: 9,
    minute: 0,
    durationMinutes: 90,
    maxSlots: 40,
    filledSlots: 31,
    meetingUrl: 'https://zoom.us/j/example4',
  },
  {
    title: 'Vocabulary Master: 100 Kata N4 Paling Sering Muncul',
    description:
      'Kuasai 100 kosakata N4 yang paling sering keluar di ujian JLPT, lengkap dengan contoh kalimat dan konteks.',
    senseiName: 'Sensei Hana Matsuda',
    senseiLevel: 'N1 Native',
    category: 'Kosa Kata',
    level: 'N4',
    daysFromNow: 7,
    hour: 15,
    minute: 0,
    durationMinutes: 90,
    maxSlots: 35,
    filledSlots: 18,
    meetingUrl: 'https://zoom.us/j/example5',
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

  for (const item of LIVE_CLASSES) {
    const scheduledAt = addDays(now, item.daysFromNow, item.hour, item.minute);
    const endsAt = new Date(scheduledAt.getTime() + item.durationMinutes * 60_000);

    const existing = await prisma.liveClass.findFirst({
      where: { title: item.title },
      select: { id: true },
    });

    const data = {
      title: item.title,
      description: item.description,
      senseiName: item.senseiName,
      senseiLevel: item.senseiLevel,
      category: item.category,
      level: item.level,
      scheduledAt,
      endsAt,
      maxSlots: item.maxSlots,
      filledSlots: item.filledSlots,
      thumbUrl: DEFAULT_THUMB,
      meetingUrl: item.meetingUrl,
      isPublished: true,
    };

    if (existing) {
      await prisma.liveClass.update({ where: { id: existing.id }, data });
    } else {
      await prisma.liveClass.create({ data });
    }
  }
}
