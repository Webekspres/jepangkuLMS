import type { TryoutSectionValue } from '@/features/admin-cms/lib/tryout-sections';

export type TryoutSectionInstruction = {
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

export const TRYOUT_SECTION_INSTRUCTIONS: Record<TryoutSectionValue, TryoutSectionInstruction> = {
    MOJI_GOI: {
        title: 'MOJI GOI',
        subtitle: '文字・語彙 — Kosakata & Kanji',
        durationHint: 'Kerjakan semua soal di bagian ini sebelum lanjut.',
        instructions: [
            'Baca setiap soal dengan teliti — pilih jawaban yang paling tepat di antara empat pilihan.',
            'Kamu bisa berpindah antar soal dalam bagian ini lewat navigator di sisi kanan.',
            'Gunakan tombol "Tandai" jika ingin kembali ke soal yang ragu-ragu.',
            'Setelah selesai, klik "Selesai Bagian" — kamu tidak bisa kembali ke bagian ini.',
        ],
        example: {
            prompt: '（　）に なにを いれますか。もっとも よいものを えらんでください。\n\nきのうは あめが（　）から、でかけませんでした。',
            options: ['ふりました', 'ふります', 'ふる', 'ふらない'],
            note: 'Pilih bentuk kata kerja yang paling sesuai dengan konteks kalimat (kemarin hujan turun).',
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
            'Klik "Selesai Bagian" setelah yakin — lanjut ke CHOKAI (listening).',
        ],
        example: {
            prompt: 'つぎの ぶんの（　）に はいる ものを えらんでください。\n\nわたしは まいにち ６じに おき（　）、あさごはんを たべます。',
            options: ['て', 'た', 'る', 'ない'],
            note: 'Perhatikan pola kalimat berurutan: bangun → makan sarapan (bentuk て-form).',
        },
    },
    CHOKAI: {
        title: 'CHOKAI',
        subtitle: '聴解 — Listening Comprehension',
        durationHint: 'Dengarkan audio dengan seksama sebelum menjawab.',
        instructions: [
            'Klik Putar audio sekali — audio berjalan sampai selesai tanpa jeda atau ulang.',
            'Beberapa soal dalam satu grup memakai satu kali putar yang sama.',
            'Jawab berdasarkan apa yang kamu dengar.',
            'Setelah "Selesai Bagian", tes akan dihitung dan kamu bisa melihat analisa jawaban.',
        ],
        example: {
            prompt: '【Dengarkan audio】\n\nいちばん いい ものを えらんでください。',
            options: ['A', 'B', 'C', 'D'],
            note: 'Contoh format listening — di ujian asli, audio akan diputar di atas soal.',
        },
    },
};
