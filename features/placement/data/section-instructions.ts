import type { PlacementSectionCode } from './types';

export type PlacementSectionInstruction = {
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

export const PLACEMENT_SECTION_INSTRUCTIONS: Record<
  PlacementSectionCode,
  PlacementSectionInstruction
> = {
  MOJI_GOI: {
    title: 'MOJI GOI',
    subtitle: '文字・語彙 — Kosakata & Kanji',
    durationHint: 'Kerjakan semua soal di bagian ini sebelum lanjut.',
    instructions: [
      'Baca setiap soal dengan teliti — pilih jawaban yang paling tepat.',
      'Kamu bisa bolak-balik antar soal dalam bagian ini lewat Sebelumnya / Berikutnya atau navigator.',
      'Setelah selesai, klik "Selesai Bagian" untuk lanjut ke bagian berikutnya.',
    ],
    example: {
      prompt:
        '（　）に なにを いれますか。もっとも よいものを えらんでください。\n\nきのうは あめが（　）から、でかけませんでした。',
      options: ['ふりました', 'ふります', 'ふる', 'ふらない'],
      note: 'Pilih bentuk kata yang paling sesuai konteks.',
    },
  },
  BUNPOU_DOKKAI: {
    title: 'BUNPOU DOKKAI',
    subtitle: '文法・読解 — Tata Bahasa & Pemahaman Bacaan',
    durationHint: 'Bagian ini menguji tata bahasa dan pemahaman teks.',
    instructions: [
      'Untuk soal tata bahasa, perhatikan partikel dan pola kalimat.',
      'Untuk soal bacaan, baca teks lengkap sebelum memilih jawaban.',
      'Navigator hanya menampilkan nomor soal di bagian ini.',
      'Klik "Selesai Bagian" setelah yakin — lanjut ke 聴解 (listening).',
    ],
    example: {
      prompt:
        'つぎの ぶんの（　）に はいる ものを えらんでください。\n\nわたしは まいにち ６じに おき（　）、あさごはんを たべます。',
      options: ['て', 'た', 'る', 'ない'],
      note: 'Perhatikan pola kalimat berurutan (bentuk て).',
    },
  },
  CHOKAI: {
    title: 'CHOKAI',
    subtitle: '聴解 — Listening Comprehension',
    durationHint: 'Audio master berjalan kontinu — seperti pita ujian.',
    instructions: [
      'Klik "Mulai mendengar" sekali. Audio tetap jalan saat ganti soal atau intro Mondai.',
      'Choukai dibagi Mondai 1–4. Tiap Mondai diawali layar instruksi (れい), lalu soal.',
      'Navigator mengelompokkan Intro + nomor soal per Mondai.',
      'Mondai 1: gambar · Mondai 2: teks · Mondai 3–4: pilih 1/2/3 (opsi di audio).',
    ],
    example: {
      prompt: '【Dengarkan audio】\n\nいちばん いい ものを えらんでください。',
      options: ['1', '2', '3', '4'],
      note: 'Format listening — jawab berdasarkan apa yang kamu dengar.',
    },
  },
};
