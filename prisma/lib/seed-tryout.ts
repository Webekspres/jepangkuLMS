import type { PrismaClient, TryoutSectionCode } from '@prisma/client';

type TryoutQuestionSeed = {
  section: TryoutSectionCode;
  questionText: string;
  explanation: string;
  options: { text: string; isCorrect: boolean }[];
};

/** Soal N5 Fase 1 — urutan per bagian. */
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
    questionText:
      '文章を読んで、しつもんに こたえてください。\n田中さんは毎朝６時に起きます。\n\nQ: 田中さんは何時に起きますか。',
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
    questionText:
      'つぎの文の意味として、もっとも よいものを えらんでください。\n彼は 毎日 日本語を 勉強しています。',
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
    explanation: 'Contoh soal CHOKAI — isi audio via bank import.',
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

const SECTION_ABBR: Record<TryoutSectionCode, string> = {
  MOJI_GOI: 'MG',
  BUNPOU_DOKKAI: 'BD',
  CHOKAI: 'CH',
};

/**
 * Ensure fase-1 has a ListeningStimulus for CHOKAI and a READY Paket Soal.
 * If migration already backfilled MIG-* questions, reuse them (no duplicate N5-* rows).
 */
async function seedFase1N5Bank(prisma: PrismaClient, sessionId: string): Promise<void> {
  const stimulus = await prisma.listeningStimulus.upsert({
    where: { code: 'N5-CH-S001' },
    create: {
      code: 'N5-CH-S001',
      level: 'N5',
      status: 'ACTIVE',
      instructionText: 'Contoh stimulus seed — unggah audio via bank import.',
      audioStartMs: 0,
    },
    update: {
      instructionText: 'Contoh stimulus seed — unggah audio via bank import.',
    },
  });

  const existingBank = await prisma.jlptQuestion.count({
    where: { level: 'N5' },
  });

  if (existingBank === 0) {
    const counters: Record<TryoutSectionCode, number> = {
      MOJI_GOI: 0,
      BUNPOU_DOKKAI: 0,
      CHOKAI: 0,
    };

    for (const q of N5_FASE1_QUESTIONS) {
      counters[q.section] += 1;
      const code = `N5-${SECTION_ABBR[q.section]}-${String(counters[q.section]).padStart(3, '0')}`;
      await prisma.jlptQuestion.create({
        data: {
          code,
          level: 'N5',
          section: q.section,
          status: 'ACTIVE',
          questionText: q.questionText,
          explanation: q.explanation,
          answerOptionKind: 'TEXT',
          listeningStimulusId: q.section === 'CHOKAI' ? stimulus.id : null,
          stimulusSortOrder: q.section === 'CHOKAI' ? counters.CHOKAI : 0,
          options: {
            create: q.options.map((opt, index) => ({
              text: opt.text,
              isCorrect: opt.isCorrect,
              sortOrder: index,
            })),
          },
        },
      });
    }
  } else {
    // Attach orphan CHOKAI bank rows to the seed stimulus.
    const chokai = await prisma.jlptQuestion.findMany({
      where: { level: 'N5', section: 'CHOKAI' },
      orderBy: [{ stimulusSortOrder: 'asc' }, { code: 'asc' }],
    });
    let order = 0;
    for (const row of chokai) {
      order += 1;
      await prisma.jlptQuestion.update({
        where: { id: row.id },
        data: { listeningStimulusId: stimulus.id, stimulusSortOrder: order },
      });
    }
  }

  const pkg = await prisma.jlptQuestionSet.upsert({
    where: { code: 'N5-PKG-SEED' },
    create: {
      code: 'N5-PKG-SEED',
      title: 'Paket Seed N5 Fase 1',
      level: 'N5',
      description: 'Paket seed untuk sesi fase-1',
      source: 'Seed',
      status: 'READY',
    },
    update: {
      title: 'Paket Seed N5 Fase 1',
      status: 'READY',
    },
  });

  await prisma.jlptQuestionSetItem.deleteMany({ where: { questionSetId: pkg.id } });

  const moji = await prisma.jlptQuestion.findMany({
    where: { level: 'N5', section: 'MOJI_GOI', status: 'ACTIVE' },
    orderBy: { code: 'asc' },
    take: 4,
  });
  for (let i = 0; i < moji.length; i++) {
    await prisma.jlptQuestionSetItem.create({
      data: {
        questionSetId: pkg.id,
        section: 'MOJI_GOI',
        sortOrder: i + 1,
        jlptQuestionId: moji[i]!.id,
      },
    });
  }

  const bunpou = await prisma.jlptQuestion.findMany({
    where: { level: 'N5', section: 'BUNPOU_DOKKAI', status: 'ACTIVE' },
    orderBy: { code: 'asc' },
    take: 4,
  });
  for (let i = 0; i < bunpou.length; i++) {
    await prisma.jlptQuestionSetItem.create({
      data: {
        questionSetId: pkg.id,
        section: 'BUNPOU_DOKKAI',
        sortOrder: i + 1,
        jlptQuestionId: bunpou[i]!.id,
      },
    });
  }

  await prisma.jlptQuestionSetItem.create({
    data: {
      questionSetId: pkg.id,
      section: 'CHOKAI',
      sortOrder: 1,
      listeningStimulusId: stimulus.id,
    },
  });

  await prisma.tryoutSession.update({
    where: { id: sessionId },
    data: { questionSetId: pkg.id },
  });
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
      await seedFase1N5Bank(prisma, row.id);
    }
  }
}
