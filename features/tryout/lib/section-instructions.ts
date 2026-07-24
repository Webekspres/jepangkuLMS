import type { TryoutExamBlockId } from '@/features/admin-cms/lib/tryout-exam-blocks';

export type TryoutBlockInstruction = {
  title: string;
  subtitle: string;
  durationHint: string;
  instructions: string[];
  example: {
    prompt: string;
    options: string[];
    note: string;
  };
};

export const TRYOUT_BLOCK_INSTRUCTIONS: Record<TryoutExamBlockId, TryoutBlockInstruction> = {
  VOCAB: {
    title: 'Language Knowledge (Vocabulary)',
    subtitle: 'Kosakata & kanji',
    durationHint: 'Kerjakan semua soal di bagian ini sebelum lanjut.',
    instructions: [
      'Baca setiap soal dengan teliti — pilih jawaban yang paling tepat di antara empat pilihan.',
      'Kamu bisa berpindah antar soal dalam bagian ini lewat navigator di sisi kanan.',
      'Gunakan tombol "Tandai" jika ingin kembali ke soal yang ragu-ragu.',
      'Setelah selesai, klik "Selesai Bagian" — kamu tidak bisa kembali ke bagian ini.',
    ],
    example: {
      prompt:
        '（　）に なにを いれますか。もっとも よいものを えらんでください。\n\nきのうは あめが（　）から、でかけませんでした。',
      options: ['ふりました', 'ふります', 'ふる', 'ふらない'],
      note: 'Pilih bentuk kata kerja yang paling sesuai dengan konteks kalimat (kemarin hujan turun).',
    },
  },
  GRAMMAR_READING: {
    title: 'Language Knowledge (Grammar) · Reading',
    subtitle: 'Tata bahasa & pemahaman bacaan',
    durationHint: 'Bagian ini menguji tata bahasa dan pemahaman teks.',
    instructions: [
      'Untuk soal tata bahasa, perhatikan partikel dan pola kalimat.',
      'Untuk soal bacaan, baca teks lengkap sebelum memilih jawaban.',
      'Navigator hanya menampilkan nomor soal di bagian ini.',
      'Klik "Selesai Bagian" setelah yakin — lanjut ke Listening.',
    ],
    example: {
      prompt:
        'つぎの ぶんの（　）に はいる ものを えらんでください。\n\nわたしは まいにち ６じに おき（　）、あさごはんを たべます。',
      options: ['て', 'た', 'る', 'ない'],
      note: 'Perhatikan pola kalimat berurutan: bangun → makan sarapan (bentuk て-form).',
    },
  },
  LANG_READING: {
    title: 'Language Knowledge (Vocabulary/Grammar) · Reading',
    subtitle: 'Kosakata, tata bahasa & bacaan (N1–N2)',
    durationHint: 'Satu bagian gabungan — kerjakan semua soal sebelum Listening.',
    instructions: [
      'Bagian ini menggabungkan kosakata, tata bahasa, dan bacaan dalam satu sesi (format resmi N1–N2).',
      'Tidak ada jeda antar jenis soal — navigasi lewat nomor di sisi kanan.',
      'Gunakan "Tandai" untuk soal yang ingin dicek ulang.',
      'Setelah "Selesai Bagian", lanjut ke Listening.',
    ],
    example: {
      prompt:
        '（　）に なにを いれますか。もっとも よいものを えらんでください。\n\nきのうは あめが（　）から、でかけませんでした。',
      options: ['ふりました', 'ふります', 'ふる', 'ふらない'],
      note: 'Contoh soal knowledge — di ujian, vocab dan grammar·reading berurutan dalam satu bagian.',
    },
  },
  LISTENING: {
    title: 'Listening',
    subtitle: 'Pemahaman mendengar',
    durationHint: 'Dengarkan audio dengan seksama sebelum menjawab.',
    instructions: [
      'Mulai audio sekali — audio berjalan terus tanpa jeda atau seek.',
      'Jawab berdasarkan apa yang kamu dengar sambil audio berlangsung.',
      'Navigator menampilkan nomor soal (dan grup Mondai untuk Choukai).',
      'Setelah "Selesai Bagian", tes akan dihitung dan kamu bisa melihat analisa jawaban.',
    ],
    example: {
      prompt: '【Dengarkan audio】\n\nいちばん いい ものを えらんでください。',
      options: ['A', 'B', 'C', 'D'],
      note: 'Contoh format listening — di ujian asli, audio diputar di atas soal.',
    },
  },
};

/** @deprecated Prefer TRYOUT_BLOCK_INSTRUCTIONS — kept for legacy imports. */
export const TRYOUT_SECTION_INSTRUCTIONS = {
  MOJI_GOI: TRYOUT_BLOCK_INSTRUCTIONS.VOCAB,
  BUNPOU_DOKKAI: TRYOUT_BLOCK_INSTRUCTIONS.GRAMMAR_READING,
  CHOKAI: TRYOUT_BLOCK_INSTRUCTIONS.LISTENING,
} as const;
