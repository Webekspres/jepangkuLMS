/**
 * Generate development sample ZIP packages for JLPT Paket Soal import.
 * Output: docs/sample-imports/JLPT_N5_SAMPLE_PACKAGE/ and JLPT_N4_SAMPLE_PACKAGE/
 *
 * Follows current importer format (see docs/JLPT_BANK_IMPORT_SPEC.md).
 * Run: bun scripts/generate-jlpt-sample-import-packages.ts
 */
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import ExcelJS from 'exceljs';

type Level = 'N5' | 'N4';
type Correct = 'A' | 'B' | 'C' | 'D';

type TextQ = {
  kode: string;
  pertanyaan: string;
  penjelasan: string;
  a: string;
  b: string;
  c: string;
  d: string;
  benar: Correct;
};

type ChokaiQ = TextQ & {
  kodeAudio: string;
  urutan: number;
};

type AudioRow = {
  kode: string;
  file: string;
  mulai: string;
  selesai: string;
  instruksi: string;
};

const ROOT = path.join(process.cwd(), 'docs', 'sample-imports');
const SILENT_MP3 = path.join(ROOT, '_assets', 'placeholder-silent.mp3');

/**
 * Write a simple data sheet with headers on row 1.
 * Avoids addDataSheet's 3-row layout which the current importer header-detector
 * can miss when a sheet only has one HEADER_HINT (e.g. Audio with only kode_audio).
 * Use "Pilihan A" (not "A") so fuzzy pick() does not confuse letter columns with "bagian".
 */
function addSimpleSheet(
  workbook: ExcelJS.Workbook,
  name: string,
  headers: string[],
  rows: Array<Array<string | number>>,
) {
  const sheet = workbook.addWorksheet(name);
  sheet.addRow(headers);
  for (const row of rows) sheet.addRow(row);
  headers.forEach((_, i) => {
    sheet.getColumn(i + 1).width = Math.min(40, Math.max(12, headers[i]!.length + 2));
  });
}

/** N5 Moji Goi — hiragana/katakana/kanji basics (~18) */
function n5Moji(): TextQ[] {
  return [
    { kode: 'n5-mg-01', pertanyaan: '「本」の読み方はどれですか。', penjelasan: '本＝ほん', a: 'ほん', b: 'もと', c: 'き', d: 'はな', benar: 'A' },
    { kode: 'n5-mg-02', pertanyaan: '「水」の読み方はどれですか。', penjelasan: '水＝みず', a: 'ひ', b: 'みず', c: 'き', d: 'つち', benar: 'B' },
    { kode: 'n5-mg-03', pertanyaan: '「山」の読み方はどれですか。', penjelasan: '山＝やま', a: 'かわ', b: 'うみ', c: 'やま', d: 'もり', benar: 'C' },
    { kode: 'n5-mg-04', pertanyaan: '「人」の読み方はどれですか。', penjelasan: '人＝ひと', a: 'ひと', b: 'いぬ', c: 'ねこ', d: 'とり', benar: 'A' },
    { kode: 'n5-mg-05', pertanyaan: '「日」の読み方はどれですか。', penjelasan: '日＝ひ / にち', a: 'つき', b: 'ひ', c: 'ほし', d: 'そら', benar: 'B' },
    { kode: 'n5-mg-06', pertanyaan: '「月」の読み方はどれですか。', penjelasan: '月＝つき', a: 'ひ', b: 'ほし', c: 'つき', d: 'くも', benar: 'C' },
    { kode: 'n5-mg-07', pertanyaan: '「火」の読み方はどれですか。', penjelasan: '火＝ひ', a: 'みず', b: 'き', c: 'つち', d: 'ひ', benar: 'D' },
    { kode: 'n5-mg-08', pertanyaan: '「木」の読み方はどれですか。', penjelasan: '木＝き', a: 'き', b: 'はやし', c: 'もり', d: 'はな', benar: 'A' },
    { kode: 'n5-mg-09', pertanyaan: '「金」の読み方はどれですか。', penjelasan: '金＝かね / きん', a: 'ぎん', b: 'かね', c: 'どう', d: 'てつ', benar: 'B' },
    { kode: 'n5-mg-10', pertanyaan: '「土」の読み方はどれですか。', penjelasan: '土＝つち', a: 'みず', b: 'ひ', c: 'つち', d: 'き', benar: 'C' },
    { kode: 'n5-mg-11', pertanyaan: '「学校」の読み方はどれですか。', penjelasan: '学校＝がっこう', a: 'がっこう', b: 'がくこう', c: 'がっこうう', d: 'がこう', benar: 'A' },
    { kode: 'n5-mg-12', pertanyaan: '「先生」の読み方はどれですか。', penjelasan: '先生＝せんせい', a: 'せんせい', b: 'せんじょう', c: 'せんせいん', d: 'せんせ', benar: 'A' },
    { kode: 'n5-mg-13', pertanyaan: '「学生」の読み方はどれですか。', penjelasan: '学生＝がくせい', a: 'がっせい', b: 'がくせい', c: 'がくしょう', d: 'がくせいん', benar: 'B' },
    { kode: 'n5-mg-14', pertanyaan: '「友達」の読み方はどれですか。', penjelasan: '友達＝ともだち', a: 'ゆうじん', b: 'ともだち', c: 'しんゆう', d: 'なかま', benar: 'B' },
    { kode: 'n5-mg-15', pertanyaan: '「食べる」の読み方はどれですか。', penjelasan: '食べる＝たべる', a: 'のむ', b: 'ねる', c: 'たべる', d: 'みる', benar: 'C' },
    { kode: 'n5-mg-16', pertanyaan: '「飲む」の読み方はどれですか。', penjelasan: '飲む＝のむ', a: 'のむ', b: 'たべる', c: 'かう', d: 'うる', benar: 'A' },
    { kode: 'n5-mg-17', pertanyaan: '「行く」の読み方はどれですか。', penjelasan: '行く＝いく', a: 'くる', b: 'かえる', c: 'いく', d: 'あるく', benar: 'C' },
    { kode: 'n5-mg-18', pertanyaan: '「見る」の読み方はどれですか。', penjelasan: '見る＝みる', a: 'きく', b: 'はなす', c: 'よむ', d: 'みる', benar: 'D' },
  ];
}

/** N5 Bunpou Dokkai (~18) */
function n5Bunpou(): TextQ[] {
  return [
    { kode: 'n5-bp-01', pertanyaan: 'わたしは 毎日 コーヒー（　）飲みます。', penjelasan: 'を marks the object', a: 'を', b: 'に', c: 'で', d: 'が', benar: 'A' },
    { kode: 'n5-bp-02', pertanyaan: '学校（　）行きます。', penjelasan: 'へ / に for destination; に is common', a: 'を', b: 'に', c: 'が', d: 'と', benar: 'B' },
    { kode: 'n5-bp-03', pertanyaan: 'バス（　）学校へ行きます。', penjelasan: 'で = means/method', a: 'を', b: 'に', c: 'で', d: 'が', benar: 'C' },
    { kode: 'n5-bp-04', pertanyaan: 'これは わたし（　）本です。', penjelasan: 'の = possession', a: 'が', b: 'を', c: 'に', d: 'の', benar: 'D' },
    { kode: 'n5-bp-05', pertanyaan: '机の 上（　）本があります。', penjelasan: 'に for existence location', a: 'に', b: 'を', c: 'が', d: 'と', benar: 'A' },
    { kode: 'n5-bp-06', pertanyaan: '田中さん（　）学生です。', penjelasan: 'は = topic', a: 'を', b: 'は', c: 'に', d: 'で', benar: 'B' },
    { kode: 'n5-bp-07', pertanyaan: '猫（　）います。', penjelasan: 'が with いる', a: 'を', b: 'に', c: 'が', d: 'で', benar: 'C' },
    { kode: 'n5-bp-08', pertanyaan: '友達（　）映画を見ました。', penjelasan: 'と = together with', a: 'を', b: 'に', c: 'で', d: 'と', benar: 'D' },
    { kode: 'n5-bp-09', pertanyaan: 'きのう 何を（　）か。', penjelasan: 'しました', a: 'しました', b: 'します', c: 'する', d: 'して', benar: 'A' },
    { kode: 'n5-bp-10', pertanyaan: 'あした 東京へ（　）。', penjelasan: '行きます', a: '行きました', b: '行きます', c: '行って', d: '行く', benar: 'B' },
    { kode: 'n5-bp-11', pertanyaan: 'この本は（　）ですか。', penjelasan: 'だれの', a: 'どこ', b: 'いつ', c: 'だれの', d: 'いくら', benar: 'C' },
    { kode: 'n5-bp-12', pertanyaan: '今、何時（　）か。', penjelasan: 'ですか', a: 'ます', b: 'です', c: 'だ', d: 'ですか', benar: 'D' },
    { kode: 'n5-bp-13', pertanyaan: 'りんごを（　）ください。', penjelasan: 'ください after て-form', a: 'ください', b: 'ます', c: 'です', d: 'だ', benar: 'A' },
    { kode: 'n5-bp-14', pertanyaan: '日本語が（　）できます。', penjelasan: '少し', a: 'たくさん', b: '少し', c: 'いつも', d: 'ぜんぜん', benar: 'B' },
    { kode: 'n5-bp-15', pertanyaan: '毎日 勉強（　）。', penjelasan: 'します', a: 'します', b: 'あります', c: 'います', d: 'です', benar: 'A' },
    { kode: 'n5-bp-16', pertanyaan: 'これは ペン（　）、あれは えんぴつです。', penjelasan: 'で = and (noun connector in contrast)', a: 'を', b: 'が', c: 'で', d: 'に', benar: 'C' },
    { kode: 'n5-bp-17', pertanyaan: '雨が（　）から、傘を持っていきます。', penjelasan: '降ります', a: '降ります', b: '降って', c: '降った', d: '降る', benar: 'A' },
    { kode: 'n5-bp-18', pertanyaan: 'すみません、駅は（　）ですか。', penjelasan: 'どこ', a: 'なに', b: 'だれ', c: 'いつ', d: 'どこ', benar: 'D' },
  ];
}

/** N5 Choukai text placeholders — 12 Q across 6 audio groups */
function n5Chokai(): { audios: AudioRow[]; questions: ChokaiQ[] } {
  const audios: AudioRow[] = [
    { kode: 'n5-audio-1', file: 'n5-audio-1.mp3', mulai: '0:00', selesai: '0:30', instruksi: '[DEV PLACEHOLDER] Audio asks where Tanaka-san will go.' },
    { kode: 'n5-audio-2', file: 'n5-audio-2.mp3', mulai: '0:00', selesai: '0:30', instruksi: '[DEV PLACEHOLDER] Audio is a short shop dialogue about buying fruit.' },
    { kode: 'n5-audio-3', file: 'n5-audio-3.mp3', mulai: '0:00', selesai: '0:30', instruksi: '[DEV PLACEHOLDER] Audio asks about tomorrow\'s weather.' },
    { kode: 'n5-audio-4', file: 'n5-audio-4.mp3', mulai: '0:00', selesai: '0:30', instruksi: '[DEV PLACEHOLDER] Audio is about meeting time at the station.' },
    { kode: 'n5-audio-5', file: 'n5-audio-5.mp3', mulai: '0:00', selesai: '0:30', instruksi: '[DEV PLACEHOLDER] Audio asks what the woman will eat.' },
    { kode: 'n5-audio-6', file: 'n5-audio-6.mp3', mulai: '0:00', selesai: '0:30', instruksi: '[DEV PLACEHOLDER] Audio is about weekend plans.' },
  ];
  const questions: ChokaiQ[] = [
    { kode: 'n5-ch-01', kodeAudio: 'n5-audio-1', urutan: 1, pertanyaan: '（音声プレースホルダ）田中さんはどこへ行きますか。', penjelasan: 'Assume answer: school', a: '学校', b: '病院', c: '駅', d: '銀行', benar: 'A' },
    { kode: 'n5-ch-02', kodeAudio: 'n5-audio-1', urutan: 2, pertanyaan: '（音声プレースホルダ）だれと行きますか。', penjelasan: 'Assume: with a friend', a: '一人で', b: '友達と', c: '先生と', d: '家族と', benar: 'B' },
    { kode: 'n5-ch-03', kodeAudio: 'n5-audio-2', urutan: 1, pertanyaan: '（音声プレースホルダ）男の人は何を買いますか。', penjelasan: 'Assume: apples', a: 'バナナ', b: 'みかん', c: 'りんご', d: 'パン', benar: 'C' },
    { kode: 'n5-ch-04', kodeAudio: 'n5-audio-2', urutan: 2, pertanyaan: '（音声プレースホルダ）いくらですか。', penjelasan: 'Assume: 300 yen', a: '100円', b: '200円', c: '400円', d: '300円', benar: 'D' },
    { kode: 'n5-ch-05', kodeAudio: 'n5-audio-3', urutan: 1, pertanyaan: '（音声プレースホルダ）あしたの天気はどうですか。', penjelasan: 'Assume: rainy', a: '雨', b: '晴れ', c: 'くもり', d: '雪', benar: 'A' },
    { kode: 'n5-ch-06', kodeAudio: 'n5-audio-3', urutan: 2, pertanyaan: '（音声プレースホルダ）傘は必要ですか。', penjelasan: 'Assume: yes', a: 'いいえ', b: 'はい', c: 'わかりません', d: 'たぶん', benar: 'B' },
    { kode: 'n5-ch-07', kodeAudio: 'n5-audio-4', urutan: 1, pertanyaan: '（音声プレースホルダ）何時に会いますか。', penjelasan: 'Assume: 3 o\'clock', a: '1時', b: '2時', c: '3時', d: '4時', benar: 'C' },
    { kode: 'n5-ch-08', kodeAudio: 'n5-audio-4', urutan: 2, pertanyaan: '（音声プレースホルダ）どこで会いますか。', penjelasan: 'Assume: station', a: '学校', b: 'カフェ', c: '公園', d: '駅', benar: 'D' },
    { kode: 'n5-ch-09', kodeAudio: 'n5-audio-5', urutan: 1, pertanyaan: '（音声プレースホルダ）女の人は何を食べますか。', penjelasan: 'Assume: ramen', a: 'ラーメン', b: 'すし', c: 'カレー', d: 'うどん', benar: 'A' },
    { kode: 'n5-ch-10', kodeAudio: 'n5-audio-5', urutan: 2, pertanyaan: '（音声プレースホルダ）どこで食べますか。', penjelasan: 'Assume: restaurant', a: '家', b: 'レストラン', c: '学校', d: '公園', benar: 'B' },
    { kode: 'n5-ch-11', kodeAudio: 'n5-audio-6', urutan: 1, pertanyaan: '（音声プレースホルダ）週末、何をしますか。', penjelasan: 'Assume: watch a movie', a: '勉強します', b: '働きます', c: '映画を見ます', d: '寝ます', benar: 'C' },
    { kode: 'n5-ch-12', kodeAudio: 'n5-audio-6', urutan: 2, pertanyaan: '（音声プレースホルダ）だれと行きますか。', penjelasan: 'Assume: family', a: '一人で', b: '友達と', c: '先生と', d: '家族と', benar: 'D' },
  ];
  return { audios, questions };
}

/** N4 Moji Goi (~18) — more kanji compounds */
function n4Moji(): TextQ[] {
  return [
    { kode: 'n4-mg-01', pertanyaan: '「経験」の読み方はどれですか。', penjelasan: '経験＝けいけん', a: 'けいけん', b: 'けいげん', c: 'きょうけん', d: 'けいけんん', benar: 'A' },
    { kode: 'n4-mg-02', pertanyaan: '「準備」の読み方はどれですか。', penjelasan: '準備＝じゅんび', a: 'しんび', b: 'じゅんび', c: 'じゅんぴ', d: 'しょうび', benar: 'B' },
    { kode: 'n4-mg-03', pertanyaan: '「説明」の読み方はどれですか。', penjelasan: '説明＝せつめい', a: 'せつめい', b: 'せつみょう', c: 'せつめ', d: 'せつみん', benar: 'A' },
    { kode: 'n4-mg-04', pertanyaan: '「都合」の読み方はどれですか。', penjelasan: '都合＝つごう', a: 'つごう', b: 'てごう', c: 'つこう', d: 'ずごう', benar: 'A' },
    { kode: 'n4-mg-05', pertanyaan: '「連絡」の読み方はどれですか。', penjelasan: '連絡＝れんらく', a: 'れんらく', b: 'れんがく', c: 'れんらっ', d: 'れんらくう', benar: 'A' },
    { kode: 'n4-mg-06', pertanyaan: '「予約」の読み方はどれですか。', penjelasan: '予約＝よやく', a: 'よやく', b: 'ようやく', c: 'よじゃく', d: 'よやくう', benar: 'A' },
    { kode: 'n4-mg-07', pertanyaan: '「失敗」の読み方はどれですか。', penjelasan: '失敗＝しっぱい', a: 'しつぱい', b: 'しっぱい', c: 'しっぱいん', d: 'しっぺい', benar: 'B' },
    { kode: 'n4-mg-08', pertanyaan: '「成功」の読み方はどれですか。', penjelasan: '成功＝せいこう', a: 'せいこう', b: 'しょうこう', c: 'せいごう', d: 'せいこ', benar: 'A' },
    { kode: 'n4-mg-09', pertanyaan: '「意見」の読み方はどれですか。', penjelasan: '意見＝いけん', a: 'いけん', b: 'いげん', c: 'いけんん', d: 'いけい', benar: 'A' },
    { kode: 'n4-mg-10', pertanyaan: '「理由」の読み方はどれですか。', penjelasan: '理由＝りゆう', a: 'りゆう', b: 'りゅう', c: 'りよう', d: 'りゆ', benar: 'A' },
    { kode: 'n4-mg-11', pertanyaan: '「反対」の読み方はどれですか。', penjelasan: '反対＝はんたい', a: 'はんたい', b: 'ほんだい', c: 'はんだい', d: 'はんてい', benar: 'A' },
    { kode: 'n4-mg-12', pertanyaan: '「賛成」の読み方はどれですか。', penjelasan: '賛成＝さんせい', a: 'さんせい', b: 'ざんせい', c: 'さんしょう', d: 'さんせいん', benar: 'A' },
    { kode: 'n4-mg-13', pertanyaan: '「危険」の読み方はどれですか。', penjelasan: '危険＝きけん', a: 'きけん', b: 'きげん', c: 'きけい', d: 'きけんん', benar: 'A' },
    { kode: 'n4-mg-14', pertanyaan: '「安全」の読み方はどれですか。', penjelasan: '安全＝あんぜん', a: 'あんぜん', b: 'あんせん', c: 'あんぜんん', d: 'あんぜ', benar: 'A' },
    { kode: 'n4-mg-15', pertanyaan: '「必要」の読み方はどれですか。', penjelasan: '必要＝ひつよう', a: 'ひつよう', b: 'ひつよー', c: 'ひつよ', d: 'ひつようう', benar: 'A' },
    { kode: 'n4-mg-16', pertanyaan: '「十分」の読み方はどれですか。', penjelasan: '十分＝じゅうぶん', a: 'じゅうぶん', b: 'じゅうふん', c: 'じゅぶん', d: 'じゅうぶんん', benar: 'A' },
    { kode: 'n4-mg-17', pertanyaan: '「特に」の読み方はどれですか。', penjelasan: '特に＝とくに', a: 'とくに', b: 'とっき', c: 'とくい', d: 'とくにん', benar: 'A' },
    { kode: 'n4-mg-18', pertanyaan: '「必ず」の読み方はどれですか。', penjelasan: '必ず＝かならず', a: 'かならず', b: 'かならす', c: 'かなら', d: 'かならずう', benar: 'A' },
  ];
}

/** N4 Bunpou Dokkai (~18) */
function n4Bunpou(): TextQ[] {
  return [
    { kode: 'n4-bp-01', pertanyaan: '雨が降っている（　）、試合は中止です。', penjelasan: 'ので = because', a: 'ので', b: 'のに', c: 'ても', d: 'たら', benar: 'A' },
    { kode: 'n4-bp-02', pertanyaan: 'この本は おもしろい（　）、長いです。', penjelasan: 'が = but', a: 'を', b: 'が', c: 'に', d: 'で', benar: 'B' },
    { kode: 'n4-bp-03', pertanyaan: '宿題を（　）から、遊びます。', penjelasan: 'して', a: 'する', b: 'した', c: 'して', d: 'します', benar: 'C' },
    { kode: 'n4-bp-04', pertanyaan: '日本へ（　）ことがあります。', penjelasan: '行った', a: '行く', b: '行って', c: '行き', d: '行った', benar: 'D' },
    { kode: 'n4-bp-05', pertanyaan: 'もっと ゆっくり（　）ください。', penjelasan: '話して', a: '話して', b: '話す', c: '話した', d: '話します', benar: 'A' },
    { kode: 'n4-bp-06', pertanyaan: 'この問題は（　）すぎます。', penjelasan: '難し', a: '難しい', b: '難し', c: '難しく', d: '難しかった', benar: 'B' },
    { kode: 'n4-bp-07', pertanyaan: '明日までに レポートを（　）なければなりません。', penjelasan: '出さ', a: '出す', b: '出して', c: '出さ', d: '出した', benar: 'C' },
    { kode: 'n4-bp-08', pertanyaan: 'ここに 名前を（　）ください。', penjelasan: '書いて', a: '書く', b: '書いた', c: '書き', d: '書いて', benar: 'D' },
    { kode: 'n4-bp-09', pertanyaan: '電車が（　）そうです。', penjelasan: '遅れる', a: '遅れる', b: '遅れて', c: '遅れた', d: '遅れ', benar: 'A' },
    { kode: 'n4-bp-10', pertanyaan: '彼は 医者に（　）たいです。', penjelasan: 'なり', a: 'なる', b: 'なり', c: 'なって', d: 'なった', benar: 'B' },
    { kode: 'n4-bp-11', pertanyaan: '窓を（　）もいいですか。', penjelasan: '開けて', a: '開ける', b: '開けた', c: '開けて', d: '開け', benar: 'C' },
    { kode: 'n4-bp-12', pertanyaan: 'まだ 宿題を（　）いません。', penjelasan: 'やって', a: 'やる', b: 'やった', c: 'やり', d: 'やって', benar: 'D' },
    { kode: 'n4-bp-13', pertanyaan: 'この道を（　）と、駅があります。', penjelasan: 'まっすぐ行く', a: 'まっすぐ行く', b: 'まっすぐ行って', c: 'まっすぐ行った', d: 'まっすぐ行き', benar: 'A' },
    { kode: 'n4-bp-14', pertanyaan: '時間があったら、映画を（　）つもりです。', penjelasan: '見る', a: '見て', b: '見る', c: '見た', d: '見ます', benar: 'B' },
    { kode: 'n4-bp-15', pertanyaan: '彼は 英語が（　）そうです。', penjelasan: '上手だ', a: '上手', b: '上手な', c: '上手だ', d: '上手に', benar: 'C' },
    { kode: 'n4-bp-16', pertanyaan: 'この薬を（　）ください。', penjelasan: '飲んで', a: '飲む', b: '飲んだ', c: '飲み', d: '飲んで', benar: 'D' },
    { kode: 'n4-bp-17', pertanyaan: '雨が（　）そうです。', penjelasan: '降り', a: '降り', b: '降る', c: '降って', d: '降った', benar: 'A' },
    { kode: 'n4-bp-18', pertanyaan: '会議は 3時から（　）予定です。', penjelasan: '始まる', a: '始めて', b: '始めた', c: '始まり', d: '始まる', benar: 'D' },
  ];
}

/** N4 Choukai placeholders — 12 Q / 6 audios */
function n4Chokai(): { audios: AudioRow[]; questions: ChokaiQ[] } {
  const audios: AudioRow[] = [
    { kode: 'n4-audio-1', file: 'n4-audio-1.mp3', mulai: '0:00', selesai: '0:35', instruksi: '[DEV PLACEHOLDER] Office dialogue about a meeting schedule change.' },
    { kode: 'n4-audio-2', file: 'n4-audio-2.mp3', mulai: '0:00', selesai: '0:35', instruksi: '[DEV PLACEHOLDER] Phone call about a restaurant reservation.' },
    { kode: 'n4-audio-3', file: 'n4-audio-3.mp3', mulai: '0:00', selesai: '0:35', instruksi: '[DEV PLACEHOLDER] Conversation about lost luggage at the airport.' },
    { kode: 'n4-audio-4', file: 'n4-audio-4.mp3', mulai: '0:00', selesai: '0:35', instruksi: '[DEV PLACEHOLDER] Classmates discussing a group project deadline.' },
    { kode: 'n4-audio-5', file: 'n4-audio-5.mp3', mulai: '0:00', selesai: '0:35', instruksi: '[DEV PLACEHOLDER] Customer asking about return policy at a store.' },
    { kode: 'n4-audio-6', file: 'n4-audio-6.mp3', mulai: '0:00', selesai: '0:35', instruksi: '[DEV PLACEHOLDER] Neighbors talking about a noisy construction site.' },
  ];
  const questions: ChokaiQ[] = [
    { kode: 'n4-ch-01', kodeAudio: 'n4-audio-1', urutan: 1, pertanyaan: '（音声プレースホルダ）会議はいつになりましたか。', penjelasan: 'Assume: Thursday 2pm', a: '木曜日の午後2時', b: '水曜日の午前10時', c: '金曜日の午後3時', d: '月曜日の午後1時', benar: 'A' },
    { kode: 'n4-ch-02', kodeAudio: 'n4-audio-1', urutan: 2, pertanyaan: '（音声プレースホルダ）会議室はどこですか。', penjelasan: 'Assume: 3F', a: '1階', b: '3階', c: '地下', d: '屋上', benar: 'B' },
    { kode: 'n4-ch-03', kodeAudio: 'n4-audio-2', urutan: 1, pertanyaan: '（音声プレースホルダ）予約は何名ですか。', penjelasan: 'Assume: 4 people', a: '2名', b: '3名', c: '4名', d: '5名', benar: 'C' },
    { kode: 'n4-ch-04', kodeAudio: 'n4-audio-2', urutan: 2, pertanyaan: '（音声プレースホルダ）何時に行きますか。', penjelasan: 'Assume: 7pm', a: '5時', b: '6時', c: '8時', d: '7時', benar: 'D' },
    { kode: 'n4-ch-05', kodeAudio: 'n4-audio-3', urutan: 1, pertanyaan: '（音声プレースホルダ）荷物はどこでなくなりましたか。', penjelasan: 'Assume: airport', a: '空港', b: 'ホテル', c: '駅', d: 'タクシー', benar: 'A' },
    { kode: 'n4-ch-06', kodeAudio: 'n4-audio-3', urutan: 2, pertanyaan: '（音声プレースホルダ）次に何をしますか。', penjelasan: 'Assume: fill a form', a: '帰る', b: '用紙に書く', c: '買う', d: '寝る', benar: 'B' },
    { kode: 'n4-ch-07', kodeAudio: 'n4-audio-4', urutan: 1, pertanyaan: '（音声プレースホルダ）提出期限はいつですか。', penjelasan: 'Assume: next Monday', a: '今日', b: '明日', c: '来週の月曜日', d: '来月', benar: 'C' },
    { kode: 'n4-ch-08', kodeAudio: 'n4-audio-4', urutan: 2, pertanyaan: '（音声プレースホルダ）だれが資料を作りますか。', penjelasan: 'Assume: Yamada', a: '田中', b: '佐藤', c: '鈴木', d: '山田', benar: 'D' },
    { kode: 'n4-ch-09', kodeAudio: 'n4-audio-5', urutan: 1, pertanyaan: '（音声プレースホルダ）返品は何日以内ですか。', penjelasan: 'Assume: within 7 days', a: '7日以内', b: '14日以内', c: '30日以内', d: '当日のみ', benar: 'A' },
    { kode: 'n4-ch-10', kodeAudio: 'n4-audio-5', urutan: 2, pertanyaan: '（音声プレースホルダ）レシートは必要ですか。', penjelasan: 'Assume: yes', a: 'いいえ', b: 'はい', c: 'どちらでも', d: 'わからない', benar: 'B' },
    { kode: 'n4-ch-11', kodeAudio: 'n4-audio-6', urutan: 1, pertanyaan: '（音声プレースホルダ）工事はいつまでですか。', penjelasan: 'Assume: end of this month', a: '来週まで', b: '来年まで', c: '今月末まで', d: '今日まで', benar: 'C' },
    { kode: 'n4-ch-12', kodeAudio: 'n4-audio-6', urutan: 2, pertanyaan: '（音声プレースホルダ）苦情はどこに出しますか。', penjelasan: 'Assume: city office', a: '警察', b: '学校', c: '病院', d: '市役所', benar: 'D' },
  ];
  return { audios, questions };
}

async function buildWorkbook(input: {
  level: Level;
  packageCode: string;
  title: string;
  moji: TextQ[];
  bunpou: TextQ[];
  chokai: { audios: AudioRow[]; questions: ChokaiQ[] };
}): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'JepangKu LMS Sample Generator';

  // Panduan — not parsed as data
  const guide = workbook.addWorksheet('001. Panduan');
  guide.getCell('A1').value = `DEVELOPMENT SAMPLE — JLPT ${input.level}`;
  guide.getCell('A2').value =
    'Follows docs/JLPT_BANK_IMPORT_SPEC.md. Choukai audio = silent stubs. NOT production content.';
  guide.getColumn(1).width = 100;

  // Row-1 headers (importer-friendly). Use "Pilihan A" not "A" to avoid pick() fuzzy bugs.
  addSimpleSheet(
    workbook,
    '002. Paket',
    ['Kode Paket', 'Judul', 'Level', 'Deskripsi', 'Sumber', 'Tahun', 'Status'],
    [
      [
        input.packageCode,
        input.title,
        input.level,
        `Development/demo sample package for ${input.level} tryout import testing.`,
        'JepangKu Dev Sample',
        2026,
        'DRAFT',
      ],
    ],
  );

  addSimpleSheet(
    workbook,
    '003. Audio Chokai',
    ['Kode Audio', 'Level', 'Nama File Audio', 'Mulai', 'Selesai', 'Instruksi', 'Status'],
    input.chokai.audios.map((a) => [
      a.kode,
      input.level,
      a.file,
      a.mulai,
      a.selesai,
      a.instruksi,
      'ACTIVE',
    ]),
  );

  const textHeaders = [
    'Kode Soal',
    'Level',
    'Bagian',
    'Pertanyaan',
    'Penjelasan',
    'Tipe Jawaban',
    'Pilihan A',
    'Pilihan B',
    'Pilihan C',
    'Pilihan D',
    'Jawaban Benar',
    'Status',
  ];

  addSimpleSheet(
    workbook,
    '004. Moji Goi',
    textHeaders,
    input.moji.map((q) => [
      q.kode,
      input.level,
      'Kosakata & Kanji',
      q.pertanyaan,
      q.penjelasan,
      'Teks',
      q.a,
      q.b,
      q.c,
      q.d,
      q.benar,
      'ACTIVE',
    ]),
  );

  addSimpleSheet(
    workbook,
    '005. Bunpou Dokkai',
    textHeaders,
    input.bunpou.map((q) => [
      q.kode,
      input.level,
      'Tata Bahasa & Bacaan',
      q.pertanyaan,
      q.penjelasan,
      'Teks',
      q.a,
      q.b,
      q.c,
      q.d,
      q.benar,
      'ACTIVE',
    ]),
  );

  addSimpleSheet(
    workbook,
    '006. Choukai',
    [
      'Kode Soal',
      'Level',
      'Bagian',
      'Kode Audio',
      'Urutan dalam Audio',
      'Pertanyaan',
      'Penjelasan',
      'Tipe Jawaban',
      'Pilihan A',
      'Pilihan B',
      'Pilihan C',
      'Pilihan D',
      'Jawaban Benar',
      'Status',
    ],
    input.chokai.questions.map((q) => [
      q.kode,
      input.level,
      'Choukai',
      q.kodeAudio,
      q.urutan,
      q.pertanyaan,
      q.penjelasan,
      'Teks',
      q.a,
      q.b,
      q.c,
      q.d,
      q.benar,
      'ACTIVE',
    ]),
  );

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

function readme(level: Level, packageCode: string, counts: { moji: number; bunpou: number; chokai: number; audio: number }): string {
  return `# JLPT ${level} Sample Import Package

**Purpose:** Development / demo / E2E testing seed for JepangKu LMS Paket Soal ZIP import.

**Not** production educational content. Teachers have not supplied real workbooks or audio.

## Package identity

| Field | Value |
|-------|-------|
| Kode Paket | \`${packageCode}\` |
| Level | ${level} |
| Status | \`DRAFT\` |
| Sumber | JepangKu Dev Sample |
| Tahun | 2026 |

## Contents

| Section | Count |
|---------|------:|
| Moji Goi | ${counts.moji} |
| Bunpou Dokkai | ${counts.bunpou} |
| Choukai | ${counts.chokai} |
| Audio stimuli | ${counts.audio} |

## Format (current importer)

Matches \`docs/JLPT_BANK_IMPORT_SPEC.md\`:

- \`workbook.xlsx\` sheets: \`001. Panduan\`, \`002. Paket\`, \`003. Audio Chokai\`, \`004. Moji Goi\`, \`005. Bunpou Dokkai\`, \`006. Choukai\`
- \`audio/*.mp3\` — **required by importer validation** (file must exist in ZIP)
- \`images/\` — empty (Choukai is TEXT-only in this sample)

## What is intentionally placeholder

1. **Choukai audio** — silent stub MP3 files (\`*-audio-*.mp3\`). Not real listening content.
2. **Choukai questions** — Japanese stems describe the *assumed* audio scenario; marked with \`（音声プレースホルダ）\`.
3. **Audio Instruksi** — English/Japanese notes for developers, not student-facing JLPT copy.
4. **Moji / Bunpou** — realistic JLPT-style items for ${level}, but authored for engineering QA, not a full mock exam paper.

## How to import

1. Zip the folder contents so the archive root contains \`workbook.xlsx\` + \`audio/\` (not an extra parent folder), **or** zip the folder and ensure the importer finds \`workbook.xlsx\` inside.
2. Admin → Paket Soal JLPT → Import → Pratinjau → Impor ke Database.

Suggested zip command (from this folder):

\`\`\`bash
# from docs/sample-imports/JLPT_${level}_SAMPLE_PACKAGE
zip -r ../JLPT_${level}_SAMPLE_PACKAGE.zip workbook.xlsx audio README.md
\`\`\`

## Replace later

When teacher assets arrive:

- Replace silent MP3s with real recordings (keep filenames or update Excel \`Nama File Audio\`).
- Rewrite Choukai questions/options to match real transcripts.
- Optionally set package Status to \`READY\` after QA.
- Review Japanese copy with content owners before any student-facing use.

## Importer notes discovered

- Preview/import **rejects** missing \`audio/<filename>\` even for TEXT Choukai — stubs are mandatory for a valid ZIP.
- Section is inferred from sheet name (\`004. Moji Goi\` etc.); no \`Bagian\` column needed.
- Options live on the question row (\`Pilihan A\`–\`Pilihan D\` + \`Jawaban Benar\`).
- Explicit \`Bagian\` column is included for importer robustness (section sheets also inject section).

## Importer quirks documented (do not invent a new format)

1. Header detection requires ≥2 known header keys on the header row — sample uses **row-1 headers** (not the 3-row styled template layout).
2. Single-letter columns named \`A\` can confuse fuzzy field matching with \`bagian\` — sample uses \`Pilihan A\` … \`Pilihan D\` (aliases accepted by importer).
3. Missing \`audio/<filename>\` fails validation even for TEXT Choukai — silent stubs are required.
`;
}

async function writePackage(dirName: string, level: Level, packageCode: string, title: string) {
  const outDir = path.join(ROOT, dirName);
  const audioDir = path.join(outDir, 'audio');
  const imagesDir = path.join(outDir, 'images');
  await mkdir(audioDir, { recursive: true });
  await mkdir(imagesDir, { recursive: true });

  const moji = level === 'N5' ? n5Moji() : n4Moji();
  const bunpou = level === 'N5' ? n5Bunpou() : n4Bunpou();
  const chokai = level === 'N5' ? n5Chokai() : n4Chokai();

  const xlsx = await buildWorkbook({ level, packageCode, title, moji, bunpou, chokai });
  await writeFile(path.join(outDir, 'workbook.xlsx'), xlsx);

  const silent = await readFile(SILENT_MP3);
  for (const a of chokai.audios) {
    await writeFile(path.join(audioDir, a.file), silent);
  }
  await writeFile(
    path.join(audioDir, 'PLACEHOLDER_AUDIO.txt'),
    'These .mp3 files are silent technical stubs so the importer finds the filenames listed in sheet 003.\nReplace with real JLPT listening audio before any student-facing use.\n',
  );
  await writeFile(
    path.join(imagesDir, 'README.txt'),
    'No images in this TEXT-only Choukai sample. Folder kept for ZIP layout compatibility.\n',
  );

  await writeFile(
    path.join(outDir, 'README.md'),
    readme(level, packageCode, {
      moji: moji.length,
      bunpou: bunpou.length,
      chokai: chokai.questions.length,
      audio: chokai.audios.length,
    }),
  );

  console.log(`Wrote ${dirName}: moji=${moji.length} bunpou=${bunpou.length} chokai=${chokai.questions.length} audio=${chokai.audios.length}`);
}

async function main() {
  await mkdir(path.join(ROOT, '_assets'), { recursive: true });
  try {
    await readFile(SILENT_MP3);
  } catch {
    // Minimal MPEG frame stub
    const hex =
      'FFFB900000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
    await writeFile(SILENT_MP3, Buffer.from(hex, 'hex'));
  }

  await writePackage('JLPT_N5_SAMPLE_PACKAGE', 'N5', 'N5-SAMPLE-2026', 'JLPT N5 Sample Tryout Package 2026');
  await writePackage('JLPT_N4_SAMPLE_PACKAGE', 'N4', 'N4-SAMPLE-2026', 'JLPT N4 Sample Tryout Package 2026');

  await writeFile(
    path.join(ROOT, 'README.md'),
    `# Sample JLPT Paket Soal Imports

Development-only ZIP packages for testing \`/admin/tryout/paket/import\`.

| Folder | Kode Paket | Level |
|--------|------------|-------|
| [JLPT_N5_SAMPLE_PACKAGE](./JLPT_N5_SAMPLE_PACKAGE/) | \`N5-SAMPLE-2026\` | N5 |
| [JLPT_N4_SAMPLE_PACKAGE](./JLPT_N4_SAMPLE_PACKAGE/) | \`N4-SAMPLE-2026\` | N4 |

Regenerate:

\`\`\`bash
bun scripts/generate-jlpt-sample-import-packages.ts
\`\`\`

See each package \`README.md\` for placeholders and import steps.
`,
  );
}

await main();
