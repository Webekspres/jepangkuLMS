import type { PrismaClient } from '@prisma/client';
import { renumberTryoutQuestionsForSession } from '@/features/admin-cms/lib/renumber-tryout-questions';

type TryoutQuestionSeed = {
  section: 'MOJI_GOI' | 'BUNPOU_DOKKAI' | 'CHOKAI';
  questionText: string;
  explanation: string;
  options: { text: string; isCorrect: boolean }[];
};

/** Soal N5 Fase 1 — urutan per bagian (sortOrder 1..n di dalam section). */
const N5_FASE1_QUESTIONS: TryoutQuestionSeed[] = [
  {
    section: 'MOJI_GOI',
    questionText:
      'つぎのことばの読み方として、もっともよいものを、1・2・3・4からえらんでください。',
    explanation: '「日本語」は「にほんご」と読みます。',
    options: [
      { text: 'えいご', isCorrect: false },
      { text: 'にほんご', isCorrect: true },
      { text: 'かんこくご', isCorrect: false },
      { text: 'ちゅうごくご', isCorrect: false },
    ],
  },
  {
    section: 'MOJI_GOI',
    questionText: '（　）に なにを いれますか。もっとも よいものを えらんでください。',
    explanation: '「〜てから」は「after doing ~」の意味。食べてから = after eating.',
    options: [
      { text: '食べて', isCorrect: true },
      { text: '食べる', isCorrect: false },
      { text: '食べた', isCorrect: false },
      { text: '食べない', isCorrect: false },
    ],
  },
  {
    section: 'MOJI_GOI',
    questionText: 'このことばと だいたい おなじ いみの ことばは どれですか。',
    explanation: 'うれしい (嬉しい) = happy/glad.',
    options: [
      { text: '悲しい', isCorrect: false },
      { text: '怖い', isCorrect: false },
      { text: '嬉しい', isCorrect: true },
      { text: '難しい', isCorrect: false },
    ],
  },
  {
    section: 'MOJI_GOI',
    questionText: 'つぎのことばの使い方として、もっとも よいものを えらんでください。',
    explanation: '「大切な」(たいせつな) = important/precious.',
    options: [
      { text: 'にぎやか', isCorrect: false },
      { text: '大切', isCorrect: true },
      { text: '静か', isCorrect: false },
      { text: '広い', isCorrect: false },
    ],
  },
  {
    section: 'BUNPOU_DOKKAI',
    questionText: '（　）に なにを いれますか。もっとも よいものを えらんでください。',
    explanation: '「〜たいと思っています」 = I am thinking of wanting to ~.',
    options: [
      { text: 'よう', isCorrect: false },
      { text: 'ない', isCorrect: false },
      { text: 'たい', isCorrect: true },
      { text: 'てい', isCorrect: false },
    ],
  },
  {
    section: 'BUNPOU_DOKKAI',
    questionText: '文章を読んで、しつもんに こたえてください。\n田中さんは毎朝６時に起きます。\n\nQ: 田中さんは何時に起きますか。',
    explanation: '「毎朝６時に起きます」から、答えは６時です。',
    options: [
      { text: '５時', isCorrect: false },
      { text: '６時', isCorrect: true },
      { text: '７時', isCorrect: false },
      { text: '８時', isCorrect: false },
    ],
  },
  {
    section: 'BUNPOU_DOKKAI',
    questionText: 'つぎの文の意味として、もっとも よいものを えらんでください。\n彼は 毎日 日本語を 勉強しています。',
    explanation: '「毎日 日本語を 勉強しています」= He studies Japanese every day.',
    options: [
      { text: 'He studied Japanese yesterday.', isCorrect: false },
      { text: 'He studies Japanese every day.', isCorrect: true },
      { text: 'He will study Japanese tomorrow.', isCorrect: false },
      { text: 'He does not study Japanese.', isCorrect: false },
    ],
  },
  {
    section: 'BUNPOU_DOKKAI',
    questionText: '（　）に 入る 言葉は どれですか。\nわたしは 毎朝 コーヒーを（　）。',
    explanation: '「飲みます」= drink (polite present).',
    options: [
      { text: '飲みます', isCorrect: true },
      { text: '飲みました', isCorrect: false },
      { text: '飲みたい', isCorrect: false },
      { text: '飲まない', isCorrect: false },
    ],
  },
  {
    section: 'CHOKAI',
    questionText: '音声を聞いて、もっとも よい 答えを えらんでください。',
    explanation: 'Contoh soal CHOKAI — isi audioUrl saat admin upload.',
    options: [
      { text: 'A', isCorrect: false },
      { text: 'B', isCorrect: true },
      { text: 'C', isCorrect: false },
      { text: 'D', isCorrect: false },
    ],
  },
  {
    section: 'CHOKAI',
    questionText: '音声を聞いて、もっとも よい 答えを えらんでください。（2）',
    explanation: 'Contoh soal CHOKAI kedua.',
    options: [
      { text: 'A', isCorrect: true },
      { text: 'B', isCorrect: false },
      { text: 'C', isCorrect: false },
      { text: 'D', isCorrect: false },
    ],
  },
];

const SESSIONS = [
  {
    code: 'fase-1',
    title: 'Simulasi JLPT — Fase 1',
    phaseLabel: 'Fase 1',
    level: 'N5' as const,
    description: 'Sesi simulasi perdana — cocok untuk pemanasan dan mengukur baseline.',
    sortOrder: 1,
    isActive: true,
    priceIdr: 0,
  },
  {
    code: 'fase-2',
    title: 'Simulasi JLPT N4 — Fase 2',
    phaseLabel: 'Fase 2',
    level: 'N4' as const,
    description: 'Sesi lanjutan dengan distribusi soal lebih menantang.',
    sortOrder: 2,
    isActive: true,
    priceIdr: 0,
  },
  {
    code: 'fase-3',
    title: 'Simulasi JLPT N3 — Fase 3',
    phaseLabel: 'Fase 3',
    level: 'N3' as const,
    description: 'Simulasi intensif menjelang ujian resmi.',
    sortOrder: 3,
    isActive: false,
    priceIdr: 0,
  },
  {
    code: 'fase-4',
    title: 'Simulasi JLPT N2 — Fase 4',
    phaseLabel: 'Fase 4',
    level: 'N2' as const,
    description: 'Final drill — kondisi ujian penuh.',
    sortOrder: 4,
    isActive: false,
    priceIdr: 0,
  },
] as const;

async function seedFase1N5Questions(prisma: PrismaClient, sessionId: string): Promise<void> {
  const existingCount = await prisma.question.count({
    where: { tryoutSessionId: sessionId, type: 'TRYOUT' },
  });

  if (existingCount === 0) {
    const counters: Record<TryoutQuestionSeed['section'], number> = {
      MOJI_GOI: 0,
      BUNPOU_DOKKAI: 0,
      CHOKAI: 0,
    };

    for (const q of N5_FASE1_QUESTIONS) {
      counters[q.section] += 1;
      await prisma.question.create({
        data: {
          type: 'TRYOUT',
          tryoutSessionId: sessionId,
          tryoutSection: q.section,
          sortOrder: counters[q.section],
          questionText: q.questionText,
          explanation: q.explanation,
          xpReward: 10,
          options: {
            create: q.options.map((opt) => ({
              text: opt.text,
              isCorrect: opt.isCorrect,
            })),
          },
        },
      });
    }
  }

  await renumberTryoutQuestionsForSession(sessionId, prisma);
}

export async function seedTryoutSessions(prisma: PrismaClient): Promise<void> {
  for (const session of SESSIONS) {
    const row = await prisma.tryoutSession.upsert({
      where: { code: session.code },
      create: {
        code: session.code,
        title: session.title,
        phaseLabel: session.phaseLabel,
        level: session.level,
        description: session.description,
        sortOrder: session.sortOrder,
        isActive: session.isActive,
        priceIdr: session.priceIdr,
        timeLimitMinutes: 120,
        scheduledAt: new Date(),
      },
      update: {
        title: session.title,
        phaseLabel: session.phaseLabel,
        level: session.level,
        description: session.description,
        sortOrder: session.sortOrder,
        isActive: session.isActive,
        priceIdr: session.priceIdr,
      },
    });

    if (session.code === 'fase-1') {
      await seedFase1N5Questions(prisma, row.id);
    }
  }
}
