/**
 * JLPT Paket Soal ZIP import — Paket + Stimuli / Questions / Options.
 * One ZIP = one package: upsert bank atoms, REPLACE package items.
 */
import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import type { LevelJLPT, PrismaClient, TryoutSectionCode } from '@prisma/client';
import { contentLockedMessage } from '@/features/admin-cms/lib/jlpt-question-set-stats';
import { normalizeTryoutSection } from '@/features/admin-cms/lib/tryout-sections';
import {
  normalizeChokaiAnswerOptionKind,
  parseChokaiTimeToSeconds,
} from '@/features/admin-cms/lib/chokai-excel-columns';
import {
  resolveJlptBankAudioMime,
  resolveJlptBankImageMime,
  uploadJlptBankAsset,
} from '@/lib/media/jlpt-bank-assets';
import {
  deleteJlptBankObjectKeysIfOrphaned,
  trackReplacedJlptBankKey,
} from '@/lib/media/jlpt-bank-r2-cleanup';
import { probeAudioDurationSec } from '@/lib/media/ffmpeg';
import { normalizeHeaderKey, stripSheetPrefix } from '@/features/admin-cms/lib/xlsx-workbook';
import { addDataSheet, addGuideSheet } from '@/features/admin-cms/lib/xlsx-template-builder';

type RowRecord = Record<string, string>;

export type JlptBankImportResult = {
  ok: boolean;
  message: string;
  stimuliUpserted: number;
  questionsUpserted: number;
  optionsUpserted: number;
  packageCode?: string;
  packageId?: string;
  errors: string[];
};

/** Known data-sheet header keys — used to find the real header row (row 3 in new templates). */
const HEADER_HINTS = [
  'kode_paket',
  'package_code',
  'kode_audio',
  'stimulus_code',
  'kode_soal',
  'question_code',
  'kode_pilihan',
  'option_key',
  'judul',
  'title',
  'bagian',
  'section',
  'jawaban_benar',
  'is_correct',
  'gambar_stimulus',
  'pilihan_a',
];

function sheetToRecords(sheet: ExcelJS.Worksheet): RowRecord[] {
  const rawRows: string[][] = [];
  sheet.eachRow({ includeEmpty: true }, (row) => {
    const cells: string[] = [];
    for (let i = 1; i <= Math.max(row.cellCount, 1); i++) {
      cells.push(String(row.getCell(i).text ?? '').trim());
    }
    rawRows.push(cells);
  });

  let headerIdx = -1;
  for (let i = 0; i < Math.min(rawRows.length, 12); i++) {
    const normalized = (rawRows[i] ?? []).map((c) => normalizeHeaderKey(c));
    const hits = HEADER_HINTS.filter((h) => normalized.includes(h)).length;
    if (hits >= 2) {
      headerIdx = i;
      break;
    }
  }
  // Legacy templates: first row is headers
  if (headerIdx < 0 && rawRows.length > 0) {
    headerIdx = 0;
  }
  if (headerIdx < 0) return [];

  const headers = (rawRows[headerIdx] ?? []).map((h) => normalizeHeaderKey(h));
  const rows: RowRecord[] = [];
  for (let i = headerIdx + 1; i < rawRows.length; i++) {
    const cells = rawRows[i] ?? [];
    if (cells.every((c) => !c)) continue;
    // Skip leftover guide/legend rows that somehow appear after headers
    const first = (cells[0] ?? '').toLowerCase();
    if (first.startsWith('kolom berwarna') || first.startsWith('satu baris')) continue;
    const record: RowRecord = {};
    headers.forEach((h, col) => {
      if (!h) return;
      record[h] = cells[col] ?? '';
    });
    rows.push(record);
  }
  return rows;
}

function pick(record: RowRecord, keys: string[]): string {
  for (const key of keys) {
    const want = normalizeHeaderKey(key);
    const exact = record[want];
    if (exact?.trim()) return exact.trim();
    // Single-letter keys (A–D) must be exact — avoid matching "bagian", "kode_soal", etc.
    if (want.length <= 1) continue;
    const found = Object.entries(record).find(
      ([k, v]) => v?.trim() && (k === want || k.includes(want) || want.includes(k)),
    );
    if (found?.[1]) return found[1].trim();
  }
  return '';
}

/** Exact header lookup for option columns A–D (and aliases). */
function pickOptionLetter(record: RowRecord, letter: 'A' | 'B' | 'C' | 'D'): string {
  const aliases = [
    letter.toLowerCase(),
    `pilihan_${letter.toLowerCase()}`,
    `option_${letter.toLowerCase()}`,
    `pilihan${letter.toLowerCase()}`,
  ];
  for (const alias of aliases) {
    const val = record[alias];
    if (val?.trim()) return val.trim();
  }
  return '';
}

function parseLevel(raw: string): LevelJLPT | null {
  const u = raw.trim().toUpperCase();
  if (u === 'N5' || u === 'N4' || u === 'N3' || u === 'N2' || u === 'N1') return u;
  return null;
}

function parseStatus(raw: string): 'DRAFT' | 'ACTIVE' | 'RETIRED' {
  const u = raw.trim().toUpperCase();
  if (['DRAFT', 'DRAF', 'KONSEP'].includes(u)) return 'DRAFT';
  if (['RETIRED', 'ARSIP', 'ARCHIVED'].includes(u)) return 'RETIRED';
  if (['ACTIVE', 'AKTIF'].includes(u)) return 'ACTIVE';
  return 'ACTIVE';
}

function parsePackageStatus(raw: string): 'DRAFT' | 'READY' | 'ARCHIVED' {
  const u = raw.trim().toUpperCase();
  if (['READY', 'SIAP'].includes(u)) return 'READY';
  if (['ARCHIVED', 'ARSIP', 'RETIRED'].includes(u)) return 'ARCHIVED';
  if (['DRAFT', 'DRAF', 'KONSEP'].includes(u)) return 'DRAFT';
  return 'DRAFT';
}

function parseBool(raw: string): boolean | null {
  const k = raw.trim().toLowerCase();
  if (['ya', 'yes', 'true', '1', 'benar'].includes(k)) return true;
  if (['tidak', 'no', 'false', '0', 'salah'].includes(k)) return false;
  return null;
}

function optionSortKey(raw: string): number {
  const k = raw.trim().toUpperCase();
  if (/^[A-D]$/.test(k)) return k.charCodeAt(0) - 65;
  if (/^[1-4]$/.test(k)) return Number(k) - 1;
  return 0;
}

type InlineOption = {
  key: string;
  text: string;
  isCorrect: boolean;
  sortOrder: number;
};

/** Parse Jawaban Benar dropdown: A–D (also accepts 1–4 as A–D). */
function parseCorrectLetter(raw: string): 'A' | 'B' | 'C' | 'D' | null {
  const u = raw.trim().toUpperCase();
  if (u === 'A' || u === 'B' || u === 'C' || u === 'D') return u;
  if (u === '1') return 'A';
  if (u === '2') return 'B';
  if (u === '3') return 'C';
  if (u === '4') return 'D';
  return null;
}

/**
 * New template: options live on the question row (columns A–D + Jawaban Benar).
 * Returns null if the row has no inline option columns filled (use legacy Options sheet).
 */
function optionsFromQuestionRow(row: RowRecord): InlineOption[] | { error: string } | null {
  const letters = ['A', 'B', 'C', 'D'] as const;
  const texts = letters.map((letter) => pickOptionLetter(row, letter));
  const filledCount = texts.filter(Boolean).length;
  if (filledCount === 0) return null;

  const correctRaw = pick(row, ['jawaban_benar', 'correct', 'correct_answer', 'kunci']);
  const correctLetter = parseCorrectLetter(correctRaw);
  if (!correctLetter) {
    return { error: 'Jawaban Benar wajib (dropdown A/B/C/D).' };
  }
  if (filledCount < 2) {
    return { error: 'Minimal isi 2 pilihan (A dan B).' };
  }
  const correctIdx = letters.indexOf(correctLetter);
  if (!texts[correctIdx]) {
    return { error: `Jawaban Benar ${correctLetter} tetapi kolom ${correctLetter} kosong.` };
  }

  const opts: InlineOption[] = [];
  letters.forEach((letter, idx) => {
    const text = texts[idx];
    if (!text) return;
    opts.push({
      key: letter,
      text,
      isCorrect: letter === correctLetter,
      sortOrder: idx,
    });
  });
  return opts;
}

function legacyOptionsForQuestion(optionRows: RowRecord[], code: string): InlineOption[] | { error: string } {
  const rows = optionRows.filter(
    (o) => pick(o, ['kode_soal', 'question_code', 'code']).toUpperCase() === code,
  );
  if (rows.length < 2) return { error: 'minimal 2 opsi.' };
  const opts: InlineOption[] = [];
  for (const o of rows) {
    const flag = parseBool(pick(o, ['jawaban_benar', 'is_correct', 'benar', 'jawaban']));
    if (flag == null) return { error: 'Jawaban Benar harus Ya/Tidak (sheet Pilihan lama).' };
    const key = pick(o, ['kode_pilihan', 'option_key', 'key', 'huruf']) || 'A';
    const text = pick(o, ['teks', 'text', 'pilihan']) || key;
    opts.push({
      key,
      text,
      isCorrect: flag,
      sortOrder: optionSortKey(key),
    });
  }
  if (opts.filter((o) => o.isCorrect).length !== 1) {
    return { error: 'tepat satu jawaban benar.' };
  }
  return opts;
}

function resolveQuestionOptions(
  row: RowRecord,
  code: string,
  optionRows: RowRecord[],
): InlineOption[] | { error: string } {
  const inline = optionsFromQuestionRow(row);
  if (inline && 'error' in inline) return inline;
  if (inline) return inline;
  if (optionRows.length > 0) {
    const legacy = legacyOptionsForQuestion(optionRows, code);
    if ('error' in legacy) return { error: `Pilihan untuk ${code}: ${legacy.error}` };
    return legacy;
  }
  return { error: `Pilihan untuk ${code}: isi kolom A–D + Jawaban Benar di sheet Soal.` };
}

function pickGambarStimulus(row: RowRecord): string {
  return pick(row, [
    'gambar_stimulus',
    'gambar_soal',
    'stem_image_file',
    'stem_image',
    'stimulus_image',
    'nama_file_gambar_stimulus',
  ]);
}

function findZipFile(zip: JSZip, folder: 'audio' | 'images', filename: string): JSZip.JSZipObject | null {
  const target = filename.replace(/^.*[\\/]/, '').toLowerCase();
  const entries = Object.keys(zip.files);
  for (const path of entries) {
    const lower = path.replace(/\\/g, '/').toLowerCase();
    if (zip.files[path].dir) continue;
    if (!lower.includes(`/${folder}/`) && !lower.startsWith(`${folder}/`)) continue;
    const base = lower.split('/').pop() ?? '';
    if (base === target) return zip.files[path];
  }
  return null;
}

async function loadWorkbookFromZip(buffer: Buffer): Promise<{
  zip: JSZip;
  workbook: ExcelJS.Workbook;
  errors: string[];
}> {
  const errors: string[] = [];
  const zip = await JSZip.loadAsync(buffer);
  const xlsxPath = Object.keys(zip.files).find((p) => {
    const lower = p.toLowerCase().replace(/\\/g, '/');
    return !zip.files[p].dir && (lower.endsWith('workbook.xlsx') || lower.endsWith('jlpt.xlsx') || lower.endsWith('.xlsx'));
  });
  if (!xlsxPath) {
    errors.push('workbook.xlsx tidak ditemukan di dalam ZIP.');
    return { zip, workbook: new ExcelJS.Workbook(), errors };
  }
  const xlsxBuf = Buffer.from(await zip.files[xlsxPath].async('uint8array'));
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(xlsxBuf as unknown as ExcelJS.Buffer);
  return { zip, workbook, errors };
}

function findSheet(workbook: ExcelJS.Workbook, names: string[]): ExcelJS.Worksheet | undefined {
  const want = new Set(names.map((n) => normalizeHeaderKey(stripSheetPrefix(n))));
  return workbook.worksheets.find((s) => {
    const key = normalizeHeaderKey(stripSheetPrefix(s.name));
    return want.has(key);
  });
}

const MOJI_SHEET_ALIASES = [
  'moji_goi',
  'moji goi',
  'moji',
  'kosakata_kanji',
  'kosakata & kanji',
  'kosakata dan kanji',
  'kosakata',
];
const BUNPOU_SHEET_ALIASES = [
  'bunpou_dokkai',
  'bunpou dokkai',
  'bunpou',
  'tata_bahasa_bacaan',
  'tata bahasa & bacaan',
  'tata bahasa dan bacaan',
  'tata bahasa',
  'dokkai',
];
const CHOKAI_SOAL_SHEET_ALIASES = [
  'choukai',
  'chokai',
  'soal_choukai',
  'soal choukai',
  'soal_chokai',
  'listening',
];
const UNIFIED_SOAL_ALIASES = ['questions', 'question', 'soal'];

/**
 * Prefer section sheets (Moji / Bunpou / Choukai). Fall back to unified Soal sheet.
 * Rows from section sheets get `bagian` injected when missing.
 */
function collectQuestionRows(workbook: ExcelJS.Workbook): {
  questionRows: RowRecord[];
  usedSectionSheets: boolean;
} {
  const mojiSheet = findSheet(workbook, MOJI_SHEET_ALIASES);
  const bunpouSheet = findSheet(workbook, BUNPOU_SHEET_ALIASES);
  const chokaiSheet = findSheet(workbook, CHOKAI_SOAL_SHEET_ALIASES);
  const usedSectionSheets = Boolean(mojiSheet || bunpouSheet || chokaiSheet);

  if (usedSectionSheets) {
    const rows: RowRecord[] = [];
    const pushWithSection = (
      sheet: ExcelJS.Worksheet | undefined,
      sectionLabel: string,
    ) => {
      if (!sheet) return;
      for (const row of sheetToRecords(sheet)) {
        if (!pick(row, ['bagian', 'section'])) {
          rows.push({ ...row, bagian: sectionLabel });
        } else {
          rows.push(row);
        }
      }
    };
    pushWithSection(mojiSheet, 'Kosakata & Kanji');
    pushWithSection(bunpouSheet, 'Tata Bahasa & Bacaan');
    pushWithSection(chokaiSheet, 'Choukai');
    return { questionRows: rows, usedSectionSheets: true };
  }

  const unified = findSheet(workbook, UNIFIED_SOAL_ALIASES);
  return {
    questionRows: unified ? sheetToRecords(unified) : [],
    usedSectionSheets: false,
  };
}

export type JlptPaketImportPreview = {
  ok: boolean;
  packageCode: string | null;
  packageTitle: string | null;
  packageLevel: LevelJLPT | null;
  packageStatus: 'DRAFT' | 'READY' | 'ARCHIVED';
  stimulusCount: number;
  questionCount: number;
  optionCount: number;
  mojiCount: number;
  bunpouCount: number;
  chokaiCount: number;
  audioFileCount: number;
  imageFileCount: number;
  existingPackageId: string | null;
  willReplace: boolean;
  isContentLocked: boolean;
  jlptCompleteness: string;
  errors: string[];
  warnings: string[];
};

/**
 * Dry-run validation — no R2 upload, no DB writes.
 */
export async function previewJlptBankZip(
  prisma: PrismaClient,
  buffer: Buffer,
): Promise<JlptPaketImportPreview> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const empty: JlptPaketImportPreview = {
    ok: false,
    packageCode: null,
    packageTitle: null,
    packageLevel: null,
    packageStatus: 'DRAFT',
    stimulusCount: 0,
    questionCount: 0,
    optionCount: 0,
    mojiCount: 0,
    bunpouCount: 0,
    chokaiCount: 0,
    audioFileCount: 0,
    imageFileCount: 0,
    existingPackageId: null,
    willReplace: false,
    isContentLocked: false,
    jlptCompleteness: '0/3',
    errors: [],
    warnings: [],
  };

  if (buffer.byteLength > 50 * 1024 * 1024) {
    return { ...empty, errors: ['ZIP maksimal 50 MB.'] };
  }

  const { zip, workbook, errors: loadErrors } = await loadWorkbookFromZip(buffer);
  errors.push(...loadErrors);
  if (loadErrors.length) {
    return { ...empty, errors };
  }

  const paketSheet = findSheet(workbook, [
    'paket',
    'set',
    'package',
    'question_set',
  ]);
  const stimuliSheet = findSheet(workbook, [
    'stimuli',
    'stimulus',
    'listening_stimulus',
    'audio_chokai',
    'audio chokai',
  ]);
  const optionsSheet = findSheet(workbook, [
    'options',
    'option',
    'opsi',
    'pilihan',
    'pilihan_jawaban',
    'pilihan jawaban',
  ]);
  const { questionRows, usedSectionSheets } = collectQuestionRows(workbook);

  if (!paketSheet) {
    errors.push('Sheet Paket (atau Set/Package) wajib ada — satu ZIP = satu paket.');
  }
  if (questionRows.length === 0) {
    errors.push(
      usedSectionSheets
        ? 'Sheet soal section kosong — isi Moji Goi / Bunpou Dokkai / Choukai.'
        : 'Sheet soal wajib ada (004–006 Moji/Bunpou/Choukai, atau Soal terpadu).',
    );
  }

  const paketRows = paketSheet ? sheetToRecords(paketSheet) : [];
  const stimulusRows = stimuliSheet ? sheetToRecords(stimuliSheet) : [];
  const optionRows = optionsSheet ? sheetToRecords(optionsSheet) : [];

  if (paketRows.length === 0) {
    errors.push('Sheet Paket kosong — isi satu baris kode paket.');
  } else if (paketRows.length > 1) {
    errors.push('Satu ZIP hanya boleh satu baris Paket (multi-paket belum didukung).');
  }

  const paketRow = paketRows[0];
  const packageCode = paketRow
    ? pick(paketRow, ['kode_paket', 'package_code', 'paket_code', 'set_code', 'code']).toUpperCase()
    : '';
  if (paketRow && !packageCode) errors.push('Paket: kode paket wajib.');
  const packageTitle =
    (paketRow && pick(paketRow, ['judul', 'title', 'name'])) || packageCode || null;
  const packageLevel = paketRow ? parseLevel(pick(paketRow, ['level', 'tingkat', 'level_jlpt'])) : null;
  if (paketRow && !packageLevel) errors.push('Paket: level wajib (N5–N1).');
  const statusRaw = paketRow ? pick(paketRow, ['status', 'status_paket']) : '';
  const packageStatus = parsePackageStatus(statusRaw);

  const stimulusCodes = new Set<string>();
  for (const row of stimulusRows) {
    const code = pick(row, ['kode_audio', 'stimulus_code', 'code']).toUpperCase();
    if (!code) {
      errors.push('Stimuli: kode audio kosong.');
      continue;
    }
    if (stimulusCodes.has(code)) errors.push(`Stimuli: duplikat ${code}`);
    stimulusCodes.add(code);

    const level = parseLevel(pick(row, ['level', 'tingkat', 'level_jlpt']));
    const audioFile = pick(row, ['nama_file_audio', 'audio_file', 'audio']);
    if (!level) errors.push(`Stimuli ${code}: level wajib.`);
    if (!audioFile) errors.push(`Stimuli ${code}: nama file audio wajib.`);
    else if (!findZipFile(zip, 'audio', audioFile)) {
      errors.push(`Audio tidak ditemukan: audio/${audioFile}`);
    }
    const imageFile = pick(row, ['nama_file_gambar', 'image_file', 'image']);
    if (imageFile && !findZipFile(zip, 'images', imageFile)) {
      errors.push(`Gambar tidak ditemukan: images/${imageFile}`);
    }
    if (packageLevel && level && level !== packageLevel) {
      errors.push(`Stimuli ${code}: level harus sama dengan paket (${packageLevel}).`);
    }
  }

  const questionCodes = new Set<string>();
  let mojiCount = 0;
  let bunpouCount = 0;
  let chokaiQuestionCount = 0;
  const chokaiStimuliInQuestions = new Set<string>();

  for (const row of questionRows) {
    const code = pick(row, ['kode_soal', 'question_code', 'code']).toUpperCase();
    if (!code) {
      errors.push('Soal: kode soal kosong.');
      continue;
    }
    if (questionCodes.has(code)) errors.push(`Soal: duplikat ${code}`);
    questionCodes.add(code);

    const level = parseLevel(pick(row, ['level', 'tingkat', 'level_jlpt']));
    const section = normalizeTryoutSection(pick(row, ['bagian', 'section']));
    if (!level || !section) {
      errors.push(`Soal ${code}: level/bagian tidak valid.`);
      continue;
    }
    if (packageLevel && level !== packageLevel) {
      errors.push(`Soal ${code}: level harus sama dengan paket (${packageLevel}).`);
    }
    const stimCode = pick(row, ['kode_audio', 'stimulus_code']).toUpperCase();
    if (section === 'CHOKAI') {
      chokaiQuestionCount += 1;
      if (!stimCode) errors.push(`Soal ${code}: Choukai wajib isi kode audio.`);
      else {
        chokaiStimuliInQuestions.add(stimCode);
        if (!stimulusCodes.has(stimCode)) {
          warnings.push(
            `Kode audio ${stimCode} tidak ada di sheet Audio Chokai (akan dicek di DB saat impor).`,
          );
        }
      }
    } else if (stimCode) {
      errors.push(`Soal ${code}: kode audio hanya untuk Choukai.`);
    }
    if (section === 'MOJI_GOI') mojiCount += 1;
    if (section === 'BUNPOU_DOKKAI') bunpouCount += 1;

    const text = pick(row, ['pertanyaan', 'question_text', 'text']);
    if (!text) errors.push(`Soal ${code}: pertanyaan wajib.`);

    const kindRaw = pick(row, ['tipe_jawaban', 'answer_option_kind']);
    const kind = kindRaw ? normalizeChokaiAnswerOptionKind(kindRaw) : 'TEXT';
    if (kindRaw && !kind) {
      errors.push(`Soal ${code}: tipe jawaban tidak valid (pilih Teks atau Gambar).`);
    }

    const resolved = resolveQuestionOptions(row, code, optionRows);
    if ('error' in resolved) {
      errors.push(
        resolved.error.startsWith('Pilihan') || resolved.error.startsWith('Jawaban')
          ? `Soal ${code}: ${resolved.error}`
          : `Soal ${code}: ${resolved.error}`,
      );
    }

    const gambarStimulus = pickGambarStimulus(row);
    if (kind === 'IMAGE' && !gambarStimulus) {
      errors.push(`Soal ${code}: Tipe Jawaban Gambar wajib isi Gambar Stimulus.`);
    }
    if (gambarStimulus && !findZipFile(zip, 'images', gambarStimulus)) {
      errors.push(`Gambar stimulus tidak ditemukan: images/${gambarStimulus}`);
    }
  }

  for (const code of stimulusCodes) {
    if (!chokaiStimuliInQuestions.has(code)) {
      errors.push(`Stimuli ${code}: tidak punya pertanyaan (orphan).`);
    }
  }

  let existingPackageId: string | null = null;
  let willReplace = false;
  let isContentLocked = false;
  if (packageCode) {
    const existing = await prisma.jlptQuestionSet.findUnique({
      where: { code: packageCode },
      include: { _count: { select: { sessions: { where: { isActive: true } }, items: true } } },
    });
    if (existing) {
      existingPackageId = existing.id;
      willReplace = existing._count.items > 0;
      isContentLocked = existing._count.sessions > 0;
      if (isContentLocked) {
        errors.push(contentLockedMessage(existing.title, existing._count.sessions));
      } else if (willReplace) {
        warnings.push(
          `Paket ${packageCode} sudah ada — isi item akan diganti (replace) saat impor.`,
        );
      }
    }
  }

  const chokaiCount = chokaiQuestionCount;
  const filled = [mojiCount > 0, bunpouCount > 0, chokaiCount > 0].filter(Boolean).length;

  // Count referenced media files present in zip
  let audioFileCount = 0;
  let imageFileCount = 0;
  let optionCount = 0;
  const seenAudio = new Set<string>();
  const seenImage = new Set<string>();
  for (const row of stimulusRows) {
    const audioFile = pick(row, ['nama_file_audio', 'audio_file', 'audio']);
    if (audioFile && findZipFile(zip, 'audio', audioFile) && !seenAudio.has(audioFile.toLowerCase())) {
      seenAudio.add(audioFile.toLowerCase());
      audioFileCount += 1;
    }
    // Legacy: image on Audio sheet still counted if present
    const imageFile = pick(row, ['nama_file_gambar', 'image_file', 'image']);
    if (imageFile && findZipFile(zip, 'images', imageFile) && !seenImage.has(imageFile.toLowerCase())) {
      seenImage.add(imageFile.toLowerCase());
      imageFileCount += 1;
    }
  }
  for (const row of questionRows) {
    const code = pick(row, ['kode_soal', 'question_code', 'code']).toUpperCase();
    if (code) {
      const resolved = resolveQuestionOptions(row, code, optionRows);
      if (!('error' in resolved)) optionCount += resolved.length;
    }
    const gambarStimulus = pickGambarStimulus(row);
    if (
      gambarStimulus &&
      findZipFile(zip, 'images', gambarStimulus) &&
      !seenImage.has(gambarStimulus.toLowerCase())
    ) {
      seenImage.add(gambarStimulus.toLowerCase());
      imageFileCount += 1;
    }
  }

  return {
    ok: errors.length === 0,
    packageCode: packageCode || null,
    packageTitle,
    packageLevel,
    packageStatus,
    stimulusCount: stimulusRows.length,
    questionCount: questionRows.length,
    optionCount,
    mojiCount,
    bunpouCount,
    chokaiCount,
    audioFileCount,
    imageFileCount,
    existingPackageId,
    willReplace,
    isContentLocked,
    jlptCompleteness: `${filled}/3`,
    errors,
    warnings,
  };
}

export async function importJlptBankZip(
  prisma: PrismaClient,
  buffer: Buffer,
): Promise<JlptBankImportResult> {
  const errors: string[] = [];
  const { zip, workbook, errors: loadErrors } = await loadWorkbookFromZip(buffer);
  errors.push(...loadErrors);
  if (errors.length) {
    return {
      ok: false,
      message: 'Paket tidak valid.',
      stimuliUpserted: 0,
      questionsUpserted: 0,
      optionsUpserted: 0,
      errors,
    };
  }

  const paketSheet = findSheet(workbook, [
    'paket',
    'set',
    'package',
    'question_set',
  ]);
  const stimuliSheet = findSheet(workbook, [
    'stimuli',
    'stimulus',
    'listening_stimulus',
    'audio_chokai',
    'audio chokai',
  ]);
  const optionsSheet = findSheet(workbook, [
    'options',
    'option',
    'opsi',
    'pilihan',
    'pilihan_jawaban',
    'pilihan jawaban',
  ]);
  const { questionRows, usedSectionSheets } = collectQuestionRows(workbook);

  if (!paketSheet) {
    errors.push('Sheet Paket (atau Set/Package) wajib ada — satu ZIP = satu paket.');
  }
  if (questionRows.length === 0) {
    errors.push(
      usedSectionSheets
        ? 'Sheet soal section kosong — isi Moji Goi / Bunpou Dokkai / Choukai.'
        : 'Sheet soal wajib ada (004–006 Moji/Bunpou/Choukai, atau Soal terpadu).',
    );
  }

  const paketRows = paketSheet ? sheetToRecords(paketSheet) : [];
  const stimulusRows = stimuliSheet ? sheetToRecords(stimuliSheet) : [];
  const optionRows = optionsSheet ? sheetToRecords(optionsSheet) : [];

  if (paketRows.length === 0) {
    errors.push('Sheet Paket kosong — isi satu baris kode paket.');
  } else if (paketRows.length > 1) {
    errors.push('Satu ZIP hanya boleh satu baris Paket (multi-paket belum didukung).');
  }

  const paketRow = paketRows[0];
  const packageCode = paketRow
    ? pick(paketRow, ['kode_paket', 'package_code', 'paket_code', 'set_code', 'code']).toUpperCase()
    : '';
  if (paketRow && !packageCode) {
    errors.push('Paket: kode paket wajib.');
  }
  const packageTitle =
    (paketRow && pick(paketRow, ['judul', 'title', 'name'])) || packageCode || 'Paket';
  const packageLevel = paketRow
    ? parseLevel(pick(paketRow, ['level', 'tingkat', 'level_jlpt']))
    : null;
  if (paketRow && !packageLevel) {
    errors.push('Paket: level wajib (N5–N1).');
  }
  const packageDescription =
    (paketRow && pick(paketRow, ['deskripsi', 'description'])) || null;
  const packageSource = (paketRow && pick(paketRow, ['sumber', 'source'])) || null;
  const yearRaw = paketRow ? pick(paketRow, ['tahun', 'year']) : '';
  const packageYear = yearRaw ? Number(yearRaw) : null;
  const packageStatus = parsePackageStatus(
    paketRow ? pick(paketRow, ['status', 'status_paket']) : '',
  );

  const stimulusCodes = new Set<string>();
  for (const row of stimulusRows) {
    const code = pick(row, ['kode_audio', 'stimulus_code', 'code']).toUpperCase();
    if (!code) {
      errors.push('Audio Chokai: kode audio kosong.');
      continue;
    }
    if (stimulusCodes.has(code)) errors.push(`Audio Chokai: duplikat ${code}`);
    stimulusCodes.add(code);
  }

  const questionCodes = new Set<string>();
  for (const row of questionRows) {
    const code = pick(row, ['kode_soal', 'question_code', 'code']).toUpperCase();
    if (!code) {
      errors.push('Soal: kode soal kosong.');
      continue;
    }
    if (questionCodes.has(code)) errors.push(`Soal: duplikat ${code}`);
    questionCodes.add(code);
  }

  // Upload cache: filename → { objectKey, url, durationMs? }
  const audioCache = new Map<string, { objectKey: string; url: string; durationMs: number | null; originalName: string }>();
  const imageCache = new Map<string, { objectKey: string; url: string }>();

  async function ensureAudio(level: string, code: string, filename: string) {
    const key = filename.toLowerCase();
    const cached = audioCache.get(key);
    if (cached) return cached;
    const entry = findZipFile(zip, 'audio', filename);
    if (!entry) throw new Error(`Audio tidak ditemukan: audio/${filename}`);
    const buf = Buffer.from(await entry.async('uint8array'));
    const mime = resolveJlptBankAudioMime({ type: 'audio/mpeg', name: filename });
    if (!mime) throw new Error(`Audio bukan MP3: ${filename}`);
    const uploaded = await uploadJlptBankAsset({
      buffer: buf,
      level,
      kind: 'audio',
      code,
      originalFilename: filename,
      contentType: mime,
    });
    let durationMs: number | null = null;
    try {
      const sec = await probeAudioDurationSec(buf);
      if (sec != null) durationMs = Math.round(sec * 1000);
    } catch {
      /* optional */
    }
    const value = {
      objectKey: uploaded.objectKey,
      url: uploaded.publicUrl,
      durationMs,
      originalName: filename,
    };
    audioCache.set(key, value);
    return value;
  }

  async function ensureImage(
    level: string,
    code: string,
    filename: string,
    kind: 'image' | 'option-image' | 'stem-image',
  ) {
    const key = `${kind}:${filename.toLowerCase()}`;
    const cached = imageCache.get(key);
    if (cached) return cached;
    const entry = findZipFile(zip, 'images', filename);
    if (!entry) throw new Error(`Gambar tidak ditemukan: images/${filename}`);
    const buf = Buffer.from(await entry.async('uint8array'));
    const mime = resolveJlptBankImageMime({ type: '', name: filename });
    if (!mime) throw new Error(`Format gambar tidak didukung: ${filename}`);
    const uploaded = await uploadJlptBankAsset({
      buffer: buf,
      level,
      kind,
      code,
      originalFilename: filename,
      contentType: mime,
    });
    const value = { objectKey: uploaded.objectKey, url: uploaded.publicUrl };
    imageCache.set(key, value);
    return value;
  }

  // Pre-validate questions ↔ stimuli
  for (const row of questionRows) {
    const sectionRaw = pick(row, ['bagian', 'section']);
    const section = normalizeTryoutSection(sectionRaw);
    const stimCode = pick(row, ['kode_audio', 'stimulus_code']).toUpperCase();
    if (section === 'CHOKAI' && !stimCode) {
      errors.push(`Soal ${pick(row, ['kode_soal', 'question_code'])}: Choukai wajib kode audio.`);
    }
    if (section && section !== 'CHOKAI' && stimCode) {
      errors.push(`Soal ${pick(row, ['kode_soal', 'question_code'])}: kode audio hanya untuk Choukai.`);
    }
    if (stimCode && !stimulusCodes.has(stimCode)) {
      // may exist in DB — checked later
    }
  }

  if (errors.length) {
    return {
      ok: false,
      message: 'Validasi gagal.',
      stimuliUpserted: 0,
      questionsUpserted: 0,
      optionsUpserted: 0,
      errors,
    };
  }

  let stimuliUpserted = 0;
  let questionsUpserted = 0;
  let optionsUpserted = 0;
  let packageId: string | undefined;
  const replacedJlptBankKeys: string[] = [];

  const stimulusIdByCode = new Map<string, string>();
  const questionIdByCode = new Map<string, string>();
  /** Ordered composition from Questions sheet (Choukai = unique stimuli in first-seen order). */
  const compositionPlan: Array<
    | { kind: 'question'; section: TryoutSectionCode; questionCode: string }
    | { kind: 'stimulus'; stimulusCode: string }
  > = [];
  const plannedStimuli = new Set<string>();

  for (const row of questionRows) {
    const section = normalizeTryoutSection(
      pick(row, ['bagian', 'section']),
    ) as TryoutSectionCode | null;
    const qCode = pick(row, ['kode_soal', 'question_code', 'code']).toUpperCase();
    const stimCode = pick(row, ['kode_audio', 'stimulus_code']).toUpperCase();
    if (!section || !qCode) continue;
    if (section === 'CHOKAI') {
      if (stimCode && !plannedStimuli.has(stimCode)) {
        plannedStimuli.add(stimCode);
        compositionPlan.push({ kind: 'stimulus', stimulusCode: stimCode });
      }
    } else {
      compositionPlan.push({ kind: 'question', section, questionCode: qCode });
    }
  }

  try {
    // Soft-lock check before any writes
    if (packageCode) {
      const existingPkg = await prisma.jlptQuestionSet.findUnique({
        where: { code: packageCode },
        include: { _count: { select: { sessions: { where: { isActive: true } } } } },
      });
      if (existingPkg && existingPkg._count.sessions > 0) {
        return {
          ok: false,
          message: contentLockedMessage(existingPkg.title, existingPkg._count.sessions),
          stimuliUpserted: 0,
          questionsUpserted: 0,
          optionsUpserted: 0,
          packageCode,
          packageId: existingPkg.id,
          errors: [contentLockedMessage(existingPkg.title, existingPkg._count.sessions)],
        };
      }
    }

    await prisma.$transaction(async (tx) => {
      for (const row of stimulusRows) {
        const code = pick(row, ['kode_audio', 'stimulus_code', 'code']).toUpperCase();
        const level = parseLevel(pick(row, ['level', 'tingkat', 'level_jlpt']));
        const audioFile = pick(row, ['nama_file_audio', 'audio_file', 'audio']);
        if (!level || !audioFile) {
          throw new Error(`Audio Chokai ${code}: level dan nama file audio wajib.`);
        }
        const mulaiRaw = pick(row, ['mulai', 'start']);
        const selesaiRaw = pick(row, ['selesai', 'end']);
        const startSec = mulaiRaw ? parseChokaiTimeToSeconds(mulaiRaw) : 0;
        if (mulaiRaw && startSec == null) throw new Error(`Audio Chokai ${code}: mulai tidak valid.`);
        const endSec = selesaiRaw ? parseChokaiTimeToSeconds(selesaiRaw) : null;
        if (selesaiRaw && endSec == null) throw new Error(`Audio Chokai ${code}: selesai tidak valid.`);
        if (endSec != null && startSec != null && endSec <= startSec) {
          throw new Error(`Audio Chokai ${code}: selesai harus > mulai.`);
        }

        const audio = await ensureAudio(level, code, audioFile);
        if (audio.durationMs != null && endSec != null && endSec * 1000 > audio.durationMs + 500) {
          throw new Error(`Audio Chokai ${code}: selesai melebihi durasi audio.`);
        }

        // Prefer Gambar Stimulus from Soal rows that share this Kode Audio; fall back to legacy Audio sheet image.
        const gambarFromSoal = questionRows
          .filter((q) => pick(q, ['kode_audio', 'stimulus_code']).toUpperCase() === code)
          .map((q) => pickGambarStimulus(q))
          .find((f) => Boolean(f));
        const imageFile =
          gambarFromSoal || pick(row, ['nama_file_gambar', 'image_file', 'image']);
        const image = imageFile ? await ensureImage(level, code, imageFile, 'image') : null;

        const existingStim = await tx.listeningStimulus.findUnique({
          where: { code },
          select: { audioObjectKey: true, imageObjectKey: true },
        });

        const data = {
          level,
          status: parseStatus(pick(row, ['status', 'status_item'])),
          instructionText: pick(row, ['instruksi', 'instruction']) || null,
          internalNote: pick(row, ['catatan', 'internal_note']) || null,
          audioObjectKey: audio.objectKey,
          audioUrl: audio.url,
          audioDurationMs: audio.durationMs,
          audioOriginalName: audio.originalName,
          audioStartMs: Math.round((startSec ?? 0) * 1000),
          audioEndMs: endSec != null ? Math.round(endSec * 1000) : null,
          imageObjectKey: image?.objectKey ?? null,
          imageUrl: image?.url ?? null,
        };

        trackReplacedJlptBankKey(
          replacedJlptBankKeys,
          existingStim?.audioObjectKey,
          data.audioObjectKey,
        );
        trackReplacedJlptBankKey(
          replacedJlptBankKeys,
          existingStim?.imageObjectKey,
          data.imageObjectKey,
        );

        const rowDb = await tx.listeningStimulus.upsert({
          where: { code },
          create: { code, ...data },
          update: data,
        });
        stimulusIdByCode.set(code, rowDb.id);
        stimuliUpserted += 1;
      }

      // Load existing stimuli referenced but not in sheet
      for (const row of questionRows) {
        const stimCode = pick(row, ['kode_audio', 'stimulus_code']).toUpperCase();
        if (stimCode && !stimulusIdByCode.has(stimCode)) {
          const existing = await tx.listeningStimulus.findUnique({ where: { code: stimCode } });
          if (!existing) throw new Error(`Kode audio tidak dikenal: ${stimCode}`);
          stimulusIdByCode.set(stimCode, existing.id);
        }
      }

      const questionsWithStimulus = new Set<string>();

      for (const row of questionRows) {
        const code = pick(row, ['kode_soal', 'question_code', 'code']).toUpperCase();
        const level = parseLevel(pick(row, ['level', 'tingkat', 'level_jlpt']));
        const section = normalizeTryoutSection(
          pick(row, ['bagian', 'section']),
        ) as TryoutSectionCode | null;
        if (!level || !section) throw new Error(`Soal ${code}: level/bagian tidak valid.`);
        if (packageLevel && level !== packageLevel) {
          throw new Error(`Soal ${code}: level harus sama dengan paket (${packageLevel}).`);
        }

        const stimCode = pick(row, ['kode_audio', 'stimulus_code']).toUpperCase();
        const listeningStimulusId = stimCode ? stimulusIdByCode.get(stimCode) ?? null : null;
        if (section === 'CHOKAI' && !listeningStimulusId) {
          throw new Error(`Soal ${code}: kode audio Choukai tidak ditemukan.`);
        }
        if (listeningStimulusId) questionsWithStimulus.add(stimCode);

        const kindRaw = pick(row, ['tipe_jawaban', 'answer_option_kind']);
        const kind = kindRaw ? normalizeChokaiAnswerOptionKind(kindRaw) : 'TEXT';
        if (!kind) throw new Error(`Soal ${code}: tipe jawaban tidak valid (pilih Teks atau Gambar).`);

        const gambarStimulus = pickGambarStimulus(row);
        if (kind === 'IMAGE' && !gambarStimulus) {
          throw new Error(`Soal ${code}: Tipe Jawaban Gambar wajib isi Gambar Stimulus.`);
        }
        // Choukai scene image lives on ListeningStimulus; non-Choukai uses stem image on the question.
        const stemFile =
          section !== 'CHOKAI'
            ? gambarStimulus || pick(row, ['gambar_soal', 'stem_image_file', 'stem_image'])
            : '';
        const stem = stemFile ? await ensureImage(level, code, stemFile, 'stem-image') : null;
        const sortInStimulus =
          Number(pick(row, ['urutan_dalam_audio', 'sort_in_stimulus', 'urutan']) || '0') || 0;

        const existingQuestion = await tx.jlptQuestion.findUnique({
          where: { code },
          select: { stemImageObjectKey: true },
        });

        const qData = {
          level,
          section,
          status: parseStatus(pick(row, ['status', 'status_item'])),
          questionText: pick(row, ['pertanyaan', 'question_text', 'text']),
          explanation: pick(row, ['penjelasan', 'explanation']) || null,
          internalNote: pick(row, ['catatan', 'internal_note']) || null,
          answerOptionKind: kind,
          stemImageObjectKey: stem?.objectKey ?? null,
          stemImageUrl: stem?.url ?? null,
          listeningStimulusId,
          stimulusSortOrder: section === 'CHOKAI' ? sortInStimulus : 0,
        };
        if (!qData.questionText) throw new Error(`Soal ${code}: pertanyaan wajib.`);

        trackReplacedJlptBankKey(
          replacedJlptBankKeys,
          existingQuestion?.stemImageObjectKey,
          qData.stemImageObjectKey,
        );

        const qRow = await tx.jlptQuestion.upsert({
          where: { code },
          create: { code, ...qData },
          update: qData,
        });
        questionIdByCode.set(code, qRow.id);

        // If Choukai + Gambar Stimulus but stimulus had no image yet (e.g. audio already in DB), patch it.
        if (section === 'CHOKAI' && listeningStimulusId && gambarStimulus) {
          const stimImg = await ensureImage(level, stimCode || code, gambarStimulus, 'image');
          const stimBeforeImage = await tx.listeningStimulus.findUnique({
            where: { id: listeningStimulusId },
            select: { imageObjectKey: true },
          });
          trackReplacedJlptBankKey(
            replacedJlptBankKeys,
            stimBeforeImage?.imageObjectKey,
            stimImg.objectKey,
          );
          await tx.listeningStimulus.update({
            where: { id: listeningStimulusId },
            data: {
              imageObjectKey: stimImg.objectKey,
              imageUrl: stimImg.url,
            },
          });
        }

        const resolvedOpts = resolveQuestionOptions(row, code, optionRows);
        if ('error' in resolvedOpts) {
          throw new Error(`Soal ${code}: ${resolvedOpts.error}`);
        }

        const inlineCheck = optionsFromQuestionRow(row);
        const isInline = Array.isArray(inlineCheck);

        const priorOptions = await tx.jlptQuestionOption.findMany({
          where: { questionId: qRow.id },
          select: { imageObjectKey: true },
        });
        for (const priorOption of priorOptions) {
          trackReplacedJlptBankKey(replacedJlptBankKeys, priorOption.imageObjectKey, null);
        }

        await tx.jlptQuestionOption.deleteMany({ where: { questionId: qRow.id } });
        for (const o of resolvedOpts) {
          if (kind === 'TEXT' && !o.text) {
            throw new Error(`Pilihan ${code} ${o.key}: teks wajib untuk tipe Teks.`);
          }

          let imageObjectKey: string | null = null;
          let imageUrl: string | null = null;
          // Legacy Options sheet may still carry per-option images
          if (!isInline) {
            const legacyRow = optionRows.find(
              (r) =>
                pick(r, ['kode_soal', 'question_code', 'code']).toUpperCase() === code &&
                optionSortKey(pick(r, ['kode_pilihan', 'option_key', 'key', 'huruf'])) === o.sortOrder,
            );
            const imageFile = legacyRow
              ? pick(legacyRow, ['nama_file_gambar', 'image_file', 'image'])
              : '';
            if (kind === 'IMAGE' && imageFile) {
              const img = await ensureImage(level, code, imageFile, 'option-image');
              imageObjectKey = img.objectKey;
              imageUrl = img.url;
            } else if (kind === 'IMAGE' && !gambarStimulus && !imageFile) {
              throw new Error(`Pilihan ${code}: gambar opsi atau Gambar Stimulus wajib untuk tipe Gambar.`);
            }
          }

          await tx.jlptQuestionOption.create({
            data: {
              questionId: qRow.id,
              text: o.text || o.key,
              imageObjectKey,
              imageUrl,
              isCorrect: o.isCorrect,
              sortOrder: o.sortOrder,
            },
          });
          optionsUpserted += 1;
        }
        questionsUpserted += 1;
      }

      for (const code of stimulusCodes) {
        if (!questionsWithStimulus.has(code)) {
          throw new Error(`Audio Chokai ${code}: tidak punya pertanyaan (orphan).`);
        }
      }

      if (!packageCode || !packageLevel) {
        throw new Error('Paket: package_code dan level wajib.');
      }
      if (compositionPlan.length === 0) {
        throw new Error('Tidak ada item untuk paket (Questions kosong / tidak valid).');
      }

      const pkg = await tx.jlptQuestionSet.upsert({
        where: { code: packageCode },
        create: {
          code: packageCode,
          title: packageTitle,
          level: packageLevel,
          description: packageDescription || null,
          source: packageSource || null,
          year:
            packageYear != null && Number.isFinite(packageYear)
              ? Math.trunc(packageYear)
              : null,
          status: packageStatus,
        },
        update: {
          title: packageTitle,
          level: packageLevel,
          description: packageDescription || null,
          source: packageSource || null,
          year:
            packageYear != null && Number.isFinite(packageYear)
              ? Math.trunc(packageYear)
              : null,
          status: packageStatus,
        },
      });
      packageId = pkg.id;

      // Soft-lock inside transaction (race-safe)
      const activeCount = await tx.tryoutSession.count({
        where: { questionSetId: pkg.id, isActive: true },
      });
      if (activeCount > 0) {
        throw new Error(contentLockedMessage(pkg.title, activeCount));
      }

      await tx.jlptQuestionSetItem.deleteMany({ where: { questionSetId: pkg.id } });

      const sectionSort: Record<TryoutSectionCode, number> = {
        MOJI_GOI: 0,
        BUNPOU_DOKKAI: 0,
        CHOKAI: 0,
      };

      for (const plan of compositionPlan) {
        if (plan.kind === 'stimulus') {
          const stimulusId = stimulusIdByCode.get(plan.stimulusCode);
          if (!stimulusId) throw new Error(`Stimulus paket tidak ditemukan: ${plan.stimulusCode}`);
          sectionSort.CHOKAI += 1;
          await tx.jlptQuestionSetItem.create({
            data: {
              questionSetId: pkg.id,
              section: 'CHOKAI',
              sortOrder: sectionSort.CHOKAI,
              listeningStimulusId: stimulusId,
            },
          });
          continue;
        }

        const questionId = questionIdByCode.get(plan.questionCode);
        if (!questionId) throw new Error(`Soal paket tidak ditemukan: ${plan.questionCode}`);
        sectionSort[plan.section] += 1;
        await tx.jlptQuestionSetItem.create({
          data: {
            questionSetId: pkg.id,
            section: plan.section,
            sortOrder: sectionSort[plan.section],
            jlptQuestionId: questionId,
          },
        });
      }
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Import gagal.';
    return {
      ok: false,
      message,
      stimuliUpserted: 0,
      questionsUpserted: 0,
      optionsUpserted: 0,
      packageCode: packageCode || undefined,
      errors: [message, ...errors],
    };
  }

  await deleteJlptBankObjectKeysIfOrphaned(replacedJlptBankKeys);

  return {
    ok: true,
    message: `Paket ${packageCode} diimpor: ${stimuliUpserted} stimulus, ${questionsUpserted} soal, ${optionsUpserted} opsi.`,
    stimuliUpserted,
    questionsUpserted,
    optionsUpserted,
    packageCode,
    packageId,
    errors: [],
  };
}

export async function buildJlptBankTemplateZip(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'JepangKu LMS';

  const JLPT_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'];
  const PACKAGE_STATUS = ['DRAFT', 'READY', 'ARCHIVED'];
  const ITEM_STATUS = ['ACTIVE', 'DRAFT', 'RETIRED'];
  const ANSWER_KINDS = ['Teks', 'Gambar'];
  const CORRECT_LETTERS = ['A', 'B', 'C', 'D'];

  const textQuestionCols = [
    { header: 'Kode Soal', key: 'kode_soal', width: 12, required: true },
    {
      header: 'Level',
      key: 'level',
      width: 8,
      required: true,
      listOptions: JLPT_LEVELS,
    },
    { header: 'Pertanyaan', key: 'pertanyaan', width: 36, required: true },
    { header: 'Penjelasan', key: 'penjelasan', width: 22 },
    {
      header: 'Tipe Jawaban',
      key: 'tipe_jawaban',
      width: 12,
      required: true,
      listOptions: ANSWER_KINDS,
    },
    { header: 'A', key: 'a', width: 14, required: true },
    { header: 'B', key: 'b', width: 14, required: true },
    { header: 'C', key: 'c', width: 14 },
    { header: 'D', key: 'd', width: 14 },
    {
      header: 'Jawaban Benar',
      key: 'jawaban_benar',
      width: 12,
      required: true,
      listOptions: CORRECT_LETTERS,
    },
    {
      header: 'Status',
      key: 'status',
      width: 10,
      listOptions: ITEM_STATUS,
    },
  ];

  const chokaiQuestionCols = [
    { header: 'Kode Soal', key: 'kode_soal', width: 12, required: true },
    {
      header: 'Level',
      key: 'level',
      width: 8,
      required: true,
      listOptions: JLPT_LEVELS,
    },
    { header: 'Kode Audio', key: 'kode_audio', width: 12, required: true },
    { header: 'Urutan dalam Audio', key: 'urutan_dalam_audio', width: 14 },
    { header: 'Pertanyaan', key: 'pertanyaan', width: 28, required: true },
    { header: 'Penjelasan', key: 'penjelasan', width: 18 },
    {
      header: 'Tipe Jawaban',
      key: 'tipe_jawaban',
      width: 12,
      required: true,
      listOptions: ANSWER_KINDS,
    },
    { header: 'A', key: 'a', width: 10, required: true },
    { header: 'B', key: 'b', width: 10, required: true },
    { header: 'C', key: 'c', width: 10 },
    { header: 'D', key: 'd', width: 10 },
    {
      header: 'Jawaban Benar',
      key: 'jawaban_benar',
      width: 12,
      required: true,
      listOptions: CORRECT_LETTERS,
    },
    { header: 'Gambar Stimulus', key: 'gambar_stimulus', width: 20 },
    {
      header: 'Status',
      key: 'status',
      width: 10,
      listOptions: ITEM_STATUS,
    },
  ];

  addGuideSheet(
    workbook,
    [
      'APA ITU FILE INI?',
      'Template untuk mengisi satu Paket Soal JLPT. Soal dipisah per bagian ujian (lebih rapi untuk admin).',
      'Satu file ZIP = satu paket. Setelah diisi, unggah di Admin → Paket Soal JLPT → Import.',
      '',
      'ISI ZIP',
      '• workbook.xlsx  → file Excel ini',
      '• audio/         → file MP3 (Choukai)',
      '• images/        → gambar PNG/JPG (Choukai bergambar)',
      '',
      'TAB SOAL (dipisah per section)',
      '• 004. Moji Goi          → kosakata & kanji (teks A–D)',
      '• 005. Bunpou Dokkai     → tata bahasa & bacaan (teks A–D)',
      '• 006. Choukai           → mendengar (Kode Audio + opsi; gambar scene di Gambar Stimulus)',
      'Tidak perlu kolom «Bagian» — section sudah ditentukan oleh nama tab.',
      '',
      'LANGKAH KERJA',
      '1) Baca tab «001. Panduan».',
      '2) Isi «002. Paket» — HANYA SATU BARIS.',
      '3) Isi soal di tab 004 / 005 / 006 sesuai bagian (boleh kosongkan tab yang belum dipakai).',
      '4) Jika ada Choukai: isi «003. Audio Chokai» + taruh MP3 di audio/.',
      '5) Zip ulang → Pratinjau di admin → Impor.',
      '',
      'PILIHAN JAWABAN (di tiap sheet soal)',
      '• Kolom A–D = teks pilihan (minimal A dan B). Jawaban Benar = dropdown A/B/C/D.',
      '• Choukai bergambar: A=1 B=2 C=3 D=4, Jawaban Benar=B, Gambar Stimulus=nama-file.png',
      '',
      'SHEET AUDIO CHOKAI',
      '• Tanpa mendengar → biarkan tab 003 kosong.',
      '• Satu MP3 bisa dipakai banyak soal di tab 006 (Kode Audio sama, Urutan berbeda).',
      '• Mulai/Selesai opsional (cuplikan dari MP3 panjang).',
      '',
      'KODE SEDERHANA: n5-paket-1 / n5-soal-1 / n5-audio-1',
      'Level di semua baris harus sama dengan Level di tab Paket.',
      '',
      'BUTUH BANTUAN? Hubungi tim JepangKu / lihat docs/JLPT_BANK_IMPORT_SPEC.md',
    ],
    { sheetName: '001. Panduan', title: 'Panduan Import Paket Soal JLPT' },
  );

  addDataSheet(
    workbook,
    '002. Paket',
    'FF0F766E',
    'Satu baris saja = satu paket. Kode Paket dipakai jika Anda mengunggah ulang file yang sama.',
    [
      { header: 'Kode Paket', key: 'kode_paket', width: 16, required: true },
      { header: 'Judul', key: 'judul', width: 32, required: true },
      {
        header: 'Level',
        key: 'level',
        width: 10,
        required: true,
        listOptions: JLPT_LEVELS,
      },
      { header: 'Deskripsi', key: 'deskripsi', width: 36 },
      { header: 'Sumber', key: 'sumber', width: 16 },
      { header: 'Tahun', key: 'tahun', width: 10 },
      {
        header: 'Status',
        key: 'status',
        width: 12,
        required: true,
        listOptions: PACKAGE_STATUS,
      },
    ],
    {
      kode_paket: 'n5-paket-1',
      judul: 'Paket N5 Contoh',
      level: 'N5',
      deskripsi: 'Contoh paket — boleh dihapus baris hijau ini',
      sumber: 'Internal',
      tahun: 2026,
      status: 'DRAFT',
    },
  );

  addDataSheet(
    workbook,
    '003. Audio Chokai',
    'FF059669',
    'Hanya untuk Choukai. Satu baris = satu cuplikan audio. Banyak soal di tab 006 boleh memakai Kode Audio yang sama.',
    [
      { header: 'Kode Audio', key: 'kode_audio', width: 14, required: true },
      {
        header: 'Level',
        key: 'level',
        width: 10,
        required: true,
        listOptions: JLPT_LEVELS,
      },
      { header: 'Nama File Audio', key: 'nama_file_audio', width: 28, required: true },
      { header: 'Mulai', key: 'mulai', width: 10 },
      { header: 'Selesai', key: 'selesai', width: 10 },
      { header: 'Instruksi', key: 'instruksi', width: 40 },
      {
        header: 'Status',
        key: 'status',
        width: 12,
        listOptions: ITEM_STATUS,
      },
    ],
    {
      kode_audio: 'n5-audio-1',
      level: 'N5',
      nama_file_audio: 'contoh-chokai.mp3',
      mulai: '0:00',
      selesai: '0:45',
      instruksi: 'Dengarkan audio, lalu pilih jawaban yang benar.',
      status: 'ACTIVE',
    },
  );

  addDataSheet(
    workbook,
    '004. Moji Goi',
    'FF0284C7',
    'Soal kosakata & kanji saja. Satu baris = satu soal + pilihan A–D. Tidak perlu Kode Audio.',
    textQuestionCols,
    {
      kode_soal: 'n5-soal-1',
      level: 'N5',
      pertanyaan: '「日本語」の読み方は？',
      penjelasan: 'にほんご',
      tipe_jawaban: 'Teks',
      a: 'にほんご',
      b: 'えいご',
      c: 'ちゅうごくご',
      d: 'かんこくご',
      jawaban_benar: 'A',
      status: 'ACTIVE',
    },
  );

  addDataSheet(
    workbook,
    '005. Bunpou Dokkai',
    'FF7C3AED',
    'Soal tata bahasa & bacaan saja. Satu baris = satu soal + pilihan A–D. Tidak perlu Kode Audio.',
    textQuestionCols,
    {
      kode_soal: 'n5-soal-2',
      level: 'N5',
      pertanyaan: '（　）に なにを いれますか。',
      penjelasan: 'Partikel を',
      tipe_jawaban: 'Teks',
      a: 'を',
      b: 'に',
      c: 'で',
      d: 'が',
      jawaban_benar: 'A',
      status: 'ACTIVE',
    },
  );

  addDataSheet(
    workbook,
    '006. Choukai',
    'FFDC2626',
    'Soal mendengar. Isi Kode Audio (harus ada di tab 003). Gambar bernomor: A–D = 1–4 + Gambar Stimulus.',
    chokaiQuestionCols,
    {
      kode_soal: 'n5-soal-3',
      level: 'N5',
      kode_audio: 'n5-audio-1',
      urutan_dalam_audio: 1,
      pertanyaan: 'どれですか。',
      penjelasan: '',
      tipe_jawaban: 'Gambar',
      a: '1',
      b: '2',
      c: '3',
      d: '4',
      jawaban_benar: 'B',
      gambar_stimulus: 'contoh-gambar.png',
      status: 'ACTIVE',
    },
  );

  const xlsxBuf = Buffer.from(await workbook.xlsx.writeBuffer());
  const zip = new JSZip();
  zip.file('workbook.xlsx', xlsxBuf);
  zip.folder('audio')?.file(
    'BACA-FOLDER-INI.txt',
    'Taruh file MP3 di folder ini.\nNama file harus sama dengan kolom «Nama File Audio» di tab 003. Audio Chokai.\nContoh: contoh-chokai.mp3\n',
  );
  zip.folder('images')?.file(
    'BACA-FOLDER-INI.txt',
    'Taruh gambar PNG/JPG di folder ini.\nNama file harus sama dengan kolom «Gambar Stimulus» di tab 006. Choukai.\nContoh: contoh-gambar.png\n',
  );
  zip.file(
    'BACA-SAYA.txt',
    `PANDUAN CEPAT — Import Paket Soal JLPT
=====================================

1. Buka workbook.xlsx → baca 001. Panduan
2. Isi 002. Paket (satu baris)
3. Isi soal per bagian:
   - 004. Moji Goi
   - 005. Bunpou Dokkai
   - 006. Choukai
4. Choukai: isi 003. Audio Chokai + MP3 di audio/
5. Zip ulang → Admin Import → Pratinjau → Impor

Kode: n5-paket-1 / n5-soal-1 / n5-audio-1
Choukai bergambar: A=1 B=2 C=3 D=4 | Jawaban=B | Gambar Stimulus=...
`,
  );
  return Buffer.from(await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
}



