import type { PlacementMondai } from './types';

export type ChokaiMondaiKey = Extract<
  PlacementMondai,
  'CHOKAI_1' | 'CHOKAI_2' | 'CHOKAI_3' | 'CHOKAI_4'
>;

export type ChokaiMondaiInstruction = {
  key: ChokaiMondaiKey;
  number: 1 | 2 | 3 | 4;
  titleJp: string;
  /** Instruction lines (hiragana / as on JLPT sheet) */
  instructionsJp: string[];
  /** Short Indonesian hint under the JP instructions */
  hintId: string;
  exampleKind: 'IMAGE_GRID' | 'TEXT_LIST' | 'SCENE' | 'MEMO';
  exampleNote: string;
};

export const CHOKAI_MONDAI_ORDER: ChokaiMondaiKey[] = [
  'CHOKAI_1',
  'CHOKAI_2',
  'CHOKAI_3',
  'CHOKAI_4',
];

export const CHOKAI_MONDAI_INSTRUCTIONS: Record<ChokaiMondaiKey, ChokaiMondaiInstruction> = {
  CHOKAI_1: {
    key: 'CHOKAI_1',
    number: 1,
    titleJp: 'もんだい 1',
    instructionsJp: [
      'もんだい 1 では、はじめに　しつもんを　きいて　ください。',
      'それから　はなしを　きいて、もんだいようしの　1 から 4 の　なかから、いちばん　いい　ものを　ひとつ　えらんで　ください。',
    ],
    hintId: 'Dengar pertanyaan, lalu dengar cerita — pilih gambar yang paling tepat (1–4).',
    exampleKind: 'IMAGE_GRID',
    exampleNote: 'れい — empat pilihan berupa gambar (placeholder sampai aset sensei siap).',
  },
  CHOKAI_2: {
    key: 'CHOKAI_2',
    number: 2,
    titleJp: 'もんだい 2',
    instructionsJp: [
      'もんだい2では、はじめに しつもんを きいて ください。',
      'それから はなしを きいて、もんだいようしの 1から4 の なかから、いちばん いい ものを ひとつ えらんで ください。',
    ],
    hintId: 'Dengar pertanyaan dan cerita — pilih jawaban teks 1–4.',
    exampleKind: 'TEXT_LIST',
    exampleNote: 'れい — pilihan berupa kata/frasa tertulis.',
  },
  CHOKAI_3: {
    key: 'CHOKAI_3',
    number: 3,
    titleJp: 'もんだい 3',
    instructionsJp: [
      'もんだい３では、えを　みながら　しつもんを　きいて　ください。',
      '（やじるし）の　ひとは　なんと　いいますか。１から３の　なかから、いちばん　いい　ものを　ひとつ　えらんで　ください。',
    ],
    hintId: 'Lihat gambar sambil mendengar — pilih apa yang dikatakan orang bertanda panah (1–3).',
    exampleKind: 'SCENE',
    exampleNote: 'れい — satu gambar scene; jawaban 1 / 2 / 3 diucapkan di audio.',
  },
  CHOKAI_4: {
    key: 'CHOKAI_4',
    number: 4,
    titleJp: 'もんだい 4',
    instructionsJp: [
      'もんだい４は、えなどが　ありません。',
      'ぶんを　きいて、１から３の　なかから、いちばん　いい　ものを　ひとつ　えらんで　ください。',
    ],
    hintId: 'Tanpa gambar — dengar kalimat dan pilih respons terbaik (1–3). Boleh pakai memo.',
    exampleKind: 'MEMO',
    exampleNote: 'れい — area メモ untuk catatan singkat (tidak dinilai).',
  },
};
