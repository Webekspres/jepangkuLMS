import type { LevelJLPT, PrismaClient } from '@prisma/client';
import { csvRowsToRecords, parseCsv } from '@/lib/csv/parse-csv';
import { sanitizeTryoutAudioGroupId } from '@/lib/media/tryout-audio';
import {
  normalizeTryoutSection,
  type TryoutSectionValue,
} from '@/features/admin-cms/lib/tryout-sections';

export const TRYOUT_IMPORT_COLUMNS = [
  'No',
  'Section',
  'QuestionText',
  'Explanation',
  'Options',
  'CorrectOptionIndex',
  'AudioUrl',
  'AudioGroupId',
] as const;

export const TRYOUT_IMPORT_TEMPLATE_CSV = `${TRYOUT_IMPORT_COLUMNS.join(',')}
1,MOJI_GOI,"（　）に なにを いれますか。","Penjelasan contoh.","Opsi A\\nOpsi B\\nOpsi C\\nOpsi D",2,,
2,BUNPOU_DOKKAI,"文章を読んで答えてください。","Reading tip.","はい\\nいいえ\\nわからない\\nどれも",1,,
3,CHOKAI,"スクリプトを聞いて答えてください。","Listening tip.","A\\nB\\nC\\nD",3,https://example.com/audio-set1.mp3,chokai-set-1
4,CHOKAI,"Soal 2 dalam grup yang sama.","","X\\nY\\nZ\\nW",2,,chokai-set-1
`;

export type TryoutImportRow = {
  rowNumber: number;
  sortHint: number | null;
  section: TryoutSectionValue;
  questionText: string;
  explanation: string | null;
  options: string[];
  correctIndex: number;
  audioUrl: string | null;
  audioGroupId: string | null;
};

export type TryoutImportPreview = {
  ok: boolean;
  rowCount: number;
  validRows: TryoutImportRow[];
  errors: { row: number; message: string }[];
  sectionCounts: Record<TryoutSectionValue, number>;
};

function pickField(record: Record<string, string>, keys: string[]): string {
  for (const key of keys) {
    const val = record[key];
    if (val?.trim()) return val.trim();
  }
  return '';
}

function parseOptionsCell(raw: string): string[] {
  return raw
    .split(/\n|\\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function resolveCorrectIndex(
  raw: string,
  options: string[],
  rowNumber: number,
): { index: number } | { error: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { error: `Baris ${rowNumber}: CorrectOptionIndex wajib diisi.` };
  }

  const asNumber = Number(trimmed);
  if (Number.isInteger(asNumber) && asNumber >= 1 && asNumber <= options.length) {
    return { index: asNumber - 1 };
  }

  const matchIndex = options.findIndex(
    (opt) => opt.toLowerCase() === trimmed.toLowerCase(),
  );
  if (matchIndex >= 0) return { index: matchIndex };

  return {
    error: `Baris ${rowNumber}: CorrectOptionIndex "${raw}" tidak cocok dengan opsi (gunakan 1–${options.length} atau teks opsi).`,
  };
}

export function parseTryoutImportText(csvText: string): TryoutImportPreview {
  const parsed = parseCsv(csvText);
  const records = csvRowsToRecords(parsed.headers, parsed.rows);
  return validateTryoutImportRecords(records);
}

export function parseTryoutImportBuffer(
  buffer: Buffer,
  filename: string,
): TryoutImportPreview {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.csv')) {
    return parseTryoutImportText(buffer.toString('utf-8'));
  }

  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const XLSX = require('xlsx') as typeof import('xlsx');
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]!];
    if (!sheet) {
      return emptyPreview([{ row: 0, message: 'File Excel kosong atau sheet tidak ditemukan.' }]);
    }
    const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' }) as string[][];
    if (rows.length < 2) {
      return emptyPreview([{ row: 0, message: 'File Excel harus punya header + minimal 1 baris data.' }]);
    }
    const headers = rows[0]!.map((h) =>
      String(h)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, ''),
    );
    const dataRows = rows.slice(1).filter((row) => row.some((cell) => String(cell).trim()));
    const records = csvRowsToRecords(headers, dataRows.map((r) => r.map(String)));
    return validateTryoutImportRecords(records);
  }

  return emptyPreview([{ row: 0, message: 'Format tidak didukung. Gunakan .csv atau .xlsx' }]);
}

function emptyPreview(errors: { row: number; message: string }[]): TryoutImportPreview {
  return {
    ok: false,
    rowCount: 0,
    validRows: [],
    errors,
    sectionCounts: { MOJI_GOI: 0, BUNPOU_DOKKAI: 0, CHOKAI: 0 },
  };
}

function validateTryoutImportRecords(
  records: Record<string, string>[],
): TryoutImportPreview {
  const errors: { row: number; message: string }[] = [];
  const validRows: TryoutImportRow[] = [];

  records.forEach((record, index) => {
    const rowNumber = index + 2;
    const sectionRaw = pickField(record, ['section', 'bagian', 'tryoutsection']);
    const section = normalizeTryoutSection(sectionRaw);
    if (!section) {
      errors.push({
        row: rowNumber,
        message: `Section "${sectionRaw || '(kosong)'}" tidak valid. Gunakan MOJI_GOI, BUNPOU_DOKKAI, atau CHOKAI.`,
      });
      return;
    }

    const questionText = pickField(record, ['questiontext', 'question', 'pertanyaan', 'soal']);
    if (!questionText) {
      errors.push({ row: rowNumber, message: 'QuestionText wajib diisi.' });
      return;
    }

    const options = parseOptionsCell(pickField(record, ['options', 'opsi', 'pilihan']));
    if (options.length < 2) {
      errors.push({ row: rowNumber, message: 'Options minimal 2 baris (pisahkan dengan \\n).' });
      return;
    }

    const correctRaw = pickField(record, [
      'correctoptionindex',
      'correct_option_index',
      'correctanswer',
      'jawaban_benar',
    ]);
    const resolved = resolveCorrectIndex(correctRaw, options, rowNumber);
    if ('error' in resolved) {
      errors.push({ row: rowNumber, message: resolved.error });
      return;
    }

    const noRaw = pickField(record, ['no', 'nomor', 'number']);
    const sortHint = noRaw ? Number(noRaw) : null;

    const audioUrlRaw = pickField(record, ['audiourl', 'audio_url', 'audio']);
    const audioGroupRaw = pickField(record, ['audiogroupid', 'audio_group_id', 'audiogroup', 'groupid']);

    let audioGroupId: string | null = null;
    if (audioGroupRaw) {
      audioGroupId = sanitizeTryoutAudioGroupId(audioGroupRaw);
      if (!audioGroupId) {
        errors.push({
          row: rowNumber,
          message: `AudioGroupId "${audioGroupRaw}" tidak valid (huruf/angka, _ atau -, max 64).`,
        });
        return;
      }
    }

    validRows.push({
      rowNumber,
      sortHint: Number.isInteger(sortHint) ? sortHint : null,
      section,
      questionText,
      explanation: pickField(record, ['explanation', 'penjelasan']) || null,
      options,
      correctIndex: resolved.index,
      audioUrl: audioUrlRaw || null,
      audioGroupId,
    });
  });

  resolveImportAudioGroups(validRows, errors);

  const sectionCounts: Record<TryoutSectionValue, number> = {
    MOJI_GOI: 0,
    BUNPOU_DOKKAI: 0,
    CHOKAI: 0,
  };
  for (const row of validRows) {
    sectionCounts[row.section] += 1;
  }

  return {
    ok: errors.length === 0 && validRows.length > 0,
    rowCount: validRows.length,
    validRows,
    errors,
    sectionCounts,
  };
}

function resolveImportAudioGroups(
  rows: TryoutImportRow[],
  errors: { row: number; message: string }[],
) {
  const groupUrls = new Map<string, string>();

  for (const row of rows) {
    if (row.section !== 'CHOKAI') {
      row.audioUrl = null;
      row.audioGroupId = null;
      continue;
    }

    if (row.audioGroupId) {
      if (row.audioUrl) {
        groupUrls.set(row.audioGroupId, row.audioUrl);
        continue;
      }

      const inherited = groupUrls.get(row.audioGroupId);
      if (inherited) {
        row.audioUrl = inherited;
        continue;
      }

      errors.push({
        row: row.rowNumber,
        message: `AudioGroupId "${row.audioGroupId}" butuh AudioUrl di baris pertama grup.`,
      });
      continue;
    }

    if (row.audioUrl && !row.audioGroupId) {
      continue;
    }
  }
}

async function nextSortOrderForSection(
  db: PrismaClient,
  sessionId: string,
  level: LevelJLPT,
  section: TryoutSectionValue,
): Promise<number> {
  const agg = await db.question.aggregate({
    where: {
      tryoutSessionId: sessionId,
      tryoutLevel: level,
      tryoutSection: section,
      type: 'TRYOUT',
    },
    _max: { sortOrder: true },
  });
  return (agg._max.sortOrder ?? 0) + 1;
}

export async function importTryoutQuestions(
  db: PrismaClient,
  input: {
    sessionId: string;
    level: LevelJLPT;
    rows: TryoutImportRow[];
  },
): Promise<{ imported: number }> {
  const session = await db.tryoutSession.findUnique({ where: { id: input.sessionId } });
  if (!session) throw new Error('Sesi tryout tidak ditemukan.');

  const counters: Record<TryoutSectionValue, number> = {
    MOJI_GOI: await nextSortOrderForSection(db, input.sessionId, input.level, 'MOJI_GOI'),
    BUNPOU_DOKKAI: await nextSortOrderForSection(
      db,
      input.sessionId,
      input.level,
      'BUNPOU_DOKKAI',
    ),
    CHOKAI: await nextSortOrderForSection(db, input.sessionId, input.level, 'CHOKAI'),
  };

  await db.$transaction(async (tx) => {
    for (const row of input.rows) {
      const sortOrder = row.sortHint ?? counters[row.section]++;
      if (row.sortHint != null) counters[row.section] = Math.max(counters[row.section], sortOrder + 1);

      await tx.question.create({
        data: {
          type: 'TRYOUT',
          tryoutSessionId: input.sessionId,
          tryoutLevel: input.level,
          tryoutSection: row.section,
          sortOrder,
          questionText: row.questionText,
          explanation: row.explanation,
          audioUrl: row.section === 'CHOKAI' ? row.audioUrl : null,
          audioGroupId: row.section === 'CHOKAI' ? row.audioGroupId : null,
          xpReward: 0,
          options: {
            create: row.options.map((text, index) => ({
              text,
              isCorrect: index === row.correctIndex,
            })),
          },
        },
      });
    }
  });

  return { imported: input.rows.length };
}
