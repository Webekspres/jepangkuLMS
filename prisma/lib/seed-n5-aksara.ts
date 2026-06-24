import type { PrismaClient } from '@prisma/client';

type AksaraRow = {
  kosakata: string;
  furigana: string;
  romaji: string;
  arti: string;
};

/** Flashcard Hiragana/Katakana — diisi ke MaterialKosakata (cocok untuk komponen flashcard). */
const PENGENALAN: AksaraRow[] = [
  { kosakata: 'ひらがな', furigana: 'ひらがな', romaji: 'hiragana', arti: 'Hiragana — aksara fonetik Jepang' },
  { kosakata: 'カタカナ', furigana: 'かたかな', romaji: 'katakana', arti: 'Katakana — aksara untuk kata serapan' },
  { kosakata: '漢字', furigana: 'かんじ', romaji: 'kanji', arti: 'Kanji — karakter ideografis Tionghoa-Jepang' },
  { kosakata: 'こんにちは', furigana: 'こんにちは', romaji: 'konnichiwa', arti: 'Halo / selamat siang' },
  { kosakata: 'ありがとう', furigana: 'ありがとう', romaji: 'arigatou', arti: 'Terima kasih' },
];

const HIRAGANA_A_TA: AksaraRow[] = [
  ['あ', 'a', 'a'], ['い', 'i', 'i'], ['う', 'u', 'u'], ['え', 'e', 'e'], ['お', 'o', 'o'],
  ['か', 'ka', 'ka'], ['き', 'ki', 'ki'], ['く', 'ku', 'ku'], ['け', 'ke', 'ke'], ['こ', 'ko', 'ko'],
  ['さ', 'sa', 'sa'], ['し', 'shi', 'shi'], ['す', 'su', 'su'], ['せ', 'se', 'se'], ['そ', 'so', 'so'],
  ['た', 'ta', 'ta'],
].map(([k, r, arti]) => ({ kosakata: k, furigana: k, romaji: r, arti: `Hiragana ${arti}` }));

const HIRAGANA_NA_N: AksaraRow[] = [
  ['な', 'na'], ['に', 'ni'], ['ぬ', 'nu'], ['ね', 'ne'], ['の', 'no'],
  ['は', 'ha'], ['ひ', 'hi'], ['ふ', 'fu'], ['へ', 'he'], ['ほ', 'ho'],
  ['ま', 'ma'], ['み', 'mi'], ['む', 'mu'], ['め', 'me'], ['も', 'mo'],
  ['や', 'ya'], ['ゆ', 'yu'], ['よ', 'yo'],
  ['ら', 'ra'], ['り', 'ri'], ['る', 'ru'], ['れ', 're'], ['ろ', 'ro'],
  ['わ', 'wa'], ['を', 'wo'], ['ん', 'n'],
].map(([k, r]) => ({ kosakata: k, furigana: k, romaji: r, arti: `Hiragana ${r}` }));

const HIRAGANA_DAKUTEN: AksaraRow[] = [
  ['が', 'ga'], ['ぎ', 'gi'], ['ぐ', 'gu'], ['げ', 'ge'], ['ご', 'go'],
  ['ざ', 'za'], ['じ', 'ji'], ['ず', 'zu'], ['ぜ', 'ze'], ['ぞ', 'zo'],
  ['だ', 'da'], ['ぢ', 'ji'], ['づ', 'zu'], ['で', 'de'], ['ど', 'do'],
  ['ば', 'ba'], ['び', 'bi'], ['ぶ', 'bu'], ['べ', 'be'], ['ぼ', 'bo'],
  ['ぱ', 'pa'], ['ぴ', 'pi'], ['ぷ', 'pu'], ['ぺ', 'pe'], ['ぽ', 'po'],
  ['きゃ', 'kya'], ['しゅ', 'shu'], ['ちょ', 'cho'],
].map(([k, r]) => ({ kosakata: k, furigana: k, romaji: r, arti: `Hiragana ${r}` }));

const KATAKANA_GOJUON: AksaraRow[] = [
  ['ア', 'a'], ['イ', 'i'], ['ウ', 'u'], ['エ', 'e'], ['オ', 'o'],
  ['カ', 'ka'], ['キ', 'ki'], ['ク', 'ku'], ['ケ', 'ke'], ['コ', 'ko'],
  ['サ', 'sa'], ['シ', 'shi'], ['ス', 'su'], ['セ', 'se'], ['ソ', 'so'],
  ['タ', 'ta'], ['チ', 'chi'], ['ツ', 'tsu'], ['テ', 'te'], ['ト', 'to'],
  ['ナ', 'na'], ['ニ', 'ni'], ['ヌ', 'nu'], ['ネ', 'ne'], ['ノ', 'no'],
  ['ハ', 'ha'], ['ヒ', 'hi'], ['フ', 'fu'], ['ヘ', 'he'], ['ホ', 'ho'],
  ['マ', 'ma'], ['ミ', 'mi'], ['ム', 'mu'], ['メ', 'me'], ['モ', 'mo'],
  ['ヤ', 'ya'], ['ユ', 'yu'], ['ヨ', 'yo'],
  ['ラ', 'ra'], ['リ', 'ri'], ['ル', 'ru'], ['レ', 're'], ['ロ', 'ro'],
  ['ワ', 'wa'], ['ヲ', 'wo'], ['ン', 'n'],
].map(([k, r]) => ({ kosakata: k, furigana: k, romaji: r, arti: `Katakana ${r}` }));

const KATAKANA_DAKUTEN: AksaraRow[] = [
  ['ガ', 'ga'], ['ギ', 'gi'], ['グ', 'gu'], ['ゲ', 'ge'], ['ゴ', 'go'],
  ['ザ', 'za'], ['ジ', 'ji'], ['ズ', 'zu'], ['ゼ', 'ze'], ['ゾ', 'zo'],
  ['ダ', 'da'], ['ヂ', 'ji'], ['ヅ', 'zu'], ['デ', 'de'], ['ド', 'do'],
  ['バ', 'ba'], ['ビ', 'bi'], ['ブ', 'bu'], ['ベ', 'be'], ['ボ', 'bo'],
  ['パ', 'pa'], ['ピ', 'pi'], ['プ', 'pu'], ['ペ', 'pe'], ['ポ', 'po'],
  ['キャ', 'kya'], ['シュ', 'shu'], ['トゥ', 'tu'],
].map(([k, r]) => ({ kosakata: k, furigana: k, romaji: r, arti: `Katakana ${r}` }));

const LESSON_AKSARA_ROWS: Record<string, AksaraRow[]> = {
  'pengenalan-aksara-jepang': PENGENALAN,
  'hiragana-a-ta': HIRAGANA_A_TA,
  'hiragana-na-n': HIRAGANA_NA_N,
  'hiragana-dakuten-handakuten': HIRAGANA_DAKUTEN,
  'katakana-lengkap': KATAKANA_GOJUON,
  'katakana-dakuten-yoon': KATAKANA_DAKUTEN,
};

export async function seedN5AksaraMateri(
  prisma: PrismaClient,
  lessonIdsBySlug: Record<string, string>,
) {
  let total = 0;

  for (const [slug, rows] of Object.entries(LESSON_AKSARA_ROWS)) {
    const lessonId = lessonIdsBySlug[slug];
    if (!lessonId) continue;

    await prisma.materialKosakata.deleteMany({ where: { lessonId } });

    if (rows.length === 0) continue;

    await prisma.materialKosakata.createMany({
      data: rows.map((row) => ({
        lessonId,
        kosakata: row.kosakata,
        furigana: row.furigana,
        romaji: row.romaji,
        arti: row.arti,
        contohKalimat: null,
        categoryId: null,
      })),
    });
    total += rows.length;
  }

  return total;
}
