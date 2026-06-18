import type { LevelJLPT, PrismaClient } from '@prisma/client';

type TryoutQuestionSeed = {
  sortOrder: number;
  section: 'MOJI_GOI' | 'BUNPOU_DOKKAI' | 'CHOKAI';
  questionText: string;
  explanation: string;
  options: { text: string; isCorrect: boolean }[];
};

const N5_FASE1_QUESTIONS: TryoutQuestionSeed[] = [
  {
    sortOrder: 1,
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
    sortOrder: 2,
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
    sortOrder: 3,
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
    sortOrder: 4,
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
    sortOrder: 5,
    section: 'CHOKAI',
    questionText:
      'スクリプトを読んで、しつもんに こたえてください。\n女：「すみません、図書館はどこですか。」\n男：「あそこの建物の隣にあります。」\n\nQ: 図書館はどこにありますか？',
    explanation: '「隣」(となり) = next to.',
    options: [
      { text: '建物の中', isCorrect: false },
      { text: '建物の隣', isCorrect: true },
      { text: '建物の前', isCorrect: false },
      { text: '建物の後ろ', isCorrect: false },
    ],
  },
  {
    sortOrder: 6,
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
    sortOrder: 7,
    section: 'BUNPOU_DOKKAI',
    questionText: '（　）に なにを いれますか。もっとも よいものを えらんでください。',
    explanation: '「〜できるようになりたい」= want to become able to ~.',
    options: [
      { text: '話せる', isCorrect: true },
      { text: '話す', isCorrect: false },
      { text: '話した', isCorrect: false },
      { text: '話して', isCorrect: false },
    ],
  },
  {
    sortOrder: 8,
    section: 'BUNPOU_DOKKAI',
    questionText:
      '文章を読んで、しつもんに こたえてください。\n日本では、春になると桜の花が咲きます。\n\nQ: 花見はいつですか？',
    explanation: '「春になると桜の花が咲きます」から、花見は春に行われます。',
    options: [
      { text: '冬', isCorrect: false },
      { text: '春', isCorrect: true },
      { text: '夏', isCorrect: false },
      { text: '秋', isCorrect: false },
    ],
  },
  {
    sortOrder: 9,
    section: 'CHOKAI',
    questionText:
      'スクリプトを読んで、もっとも よいものを えらんでください。\nA：「明日、一緒に買い物しませんか。」\nB：「すみません、明日はちょっと…。」\n\nQ: Bさんは明日どうしますか？',
    explanation: '「ちょっと…」は丁寧な断り方。Bさんは断っています。',
    options: [
      { text: '買い物に行く', isCorrect: false },
      { text: '断る（行けない）', isCorrect: true },
      { text: '一緒に行く', isCorrect: false },
      { text: '後で連絡する', isCorrect: false },
    ],
  },
  {
    sortOrder: 10,
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
];

const SESSIONS: {
  code: string;
  title: string;
  phaseLabel: string;
  description: string;
  sortOrder: number;
}[] = [
  {
    code: 'fase-1',
    title: 'Simulasi JLPT — Fase 1',
    phaseLabel: 'Fase 1',
    description: 'Sesi simulasi perdana — cocok untuk pemanasan dan mengukur baseline.',
    sortOrder: 1,
  },
  {
    code: 'fase-2',
    title: 'Simulasi JLPT — Fase 2',
    phaseLabel: 'Fase 2',
    description: 'Sesi lanjutan dengan distribusi soal lebih menantang.',
    sortOrder: 2,
  },
  {
    code: 'fase-3',
    title: 'Simulasi JLPT — Fase 3',
    phaseLabel: 'Fase 3',
    description: 'Simulasi intensif menjelang ujian resmi.',
    sortOrder: 3,
  },
  {
    code: 'fase-4',
    title: 'Simulasi JLPT — Fase 4',
    phaseLabel: 'Fase 4',
    description: 'Final drill — kondisi ujian penuh.',
    sortOrder: 4,
  },
];

export async function seedTryoutSessions(prisma: PrismaClient): Promise<void> {
  for (const session of SESSIONS) {
    const row = await prisma.tryoutSession.upsert({
      where: { code: session.code },
      create: {
        ...session,
        isActive: session.code === 'fase-1' || session.code === 'fase-2',
        timeLimitMinutes: 120,
        scheduledAt: new Date(),
      },
      update: {
        title: session.title,
        phaseLabel: session.phaseLabel,
        description: session.description,
        sortOrder: session.sortOrder,
      },
    });

    if (session.code !== 'fase-1') continue;

    const existingCount = await prisma.question.count({
      where: { tryoutSessionId: row.id, tryoutLevel: 'N5' },
    });

    if (existingCount > 0) continue;

    for (const q of N5_FASE1_QUESTIONS) {
      await prisma.question.create({
        data: {
          type: 'TRYOUT',
          tryoutSessionId: row.id,
          tryoutLevel: 'N5',
          tryoutSection: q.section,
          sortOrder: q.sortOrder,
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
}
