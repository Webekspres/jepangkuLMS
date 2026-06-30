import type { PrismaClient } from '@prisma/client';
import JSZip from 'jszip';
import {
    CHOKAI_DEFAULT_IMAGE_QUESTION_HINT,
    chokaiClipDedupeKey,
    normalizeChokaiAnswerOptionKind,
    parseChokaiTimeToSeconds,
    resolveChokaiOptionImageFiles,
    type ChokaiAnswerOptionKind,
} from '@/features/admin-cms/lib/chokai-excel-columns';
import { probeAudioDurationSec, sliceAudioToMp3 } from '@/lib/media/ffmpeg';
import { uploadToR2 } from '@/lib/r2';
import {
    buildTryoutChokaiClipKey,
    buildTryoutChokaiMasterKey,
    sanitizeTryoutAudioGroupId,
} from '@/lib/media/tryout-audio';
import { uploadTryoutChokaiImage } from '@/lib/media/tryout-chokai-image';
import { pickField, readXlsxBuffer, sheetToRecords } from '@/features/admin-cms/lib/xlsx-workbook';

export type ChokaiImportOption = {
    text: string;
    imageFilename: string | null;
};

export type ChokaiImportRow = {
    rowNumber: number;
    sortHint: number | null;
    folder: string;
    answerOptionKind: ChokaiAnswerOptionKind;
    questionText: string;
    explanation: string | null;
    options: ChokaiImportOption[];
    correctIndex: number;
    audioId: string;
    startSec: number;
    endSec: number | null;
    audioGroupId: string | null;
};

export type ChokaiImportPreviewRow = {
    rowNumber: number;
    folder: string;
    answerOptionKind: ChokaiAnswerOptionKind;
    jawaban: string;
    audioRange: string;
    optionSummary: string;
    ok: boolean;
    message?: string;
};

export type ChokaiImportPreview = {
    ok: boolean;
    rowCount: number;
    rows: ChokaiImportPreviewRow[];
    errors: { row: number; message: string }[];
};

type ZipAssets = Map<string, Map<string, Buffer>>;

function formatRowError(row: number, message: string) {
    return { row, message: `Baris ${row}: ${message}` };
}

function resolveCorrectIndex(
  raw: string,
  optionCount: number,
): { index: number } | { error: string } {
    const trimmed = raw.trim();
    if (!trimmed) return { error: 'Jawaban wajib diisi.' };

    const letterMap: Record<string, number> = { a: 0, b: 1, c: 2, d: 3 };
    const letter = letterMap[trimmed.toLowerCase()];
    if (letter != null && letter < optionCount) return { index: letter };

    return { error: `Jawaban "${raw}" tidak valid (gunakan A–D).` };
}

async function extractChokaiZip(buffer: Buffer): Promise<
    | { ok: true; xlsx: Buffer; assets: ZipAssets }
    | { ok: false; error: string }
> {
    let zip: JSZip;
    try {
        zip = await JSZip.loadAsync(buffer);
    } catch {
        return { ok: false, error: 'File ZIP tidak bisa dibaca.' };
    }

    let xlsx: Buffer | null = null;
    const assets: ZipAssets = new Map();

    for (const [path, entry] of Object.entries(zip.files)) {
        if (entry.dir) continue;
        const normalized = path.replace(/\\/g, '/').replace(/^\.\//, '');

        if (/^chokai\.xlsx$/i.test(normalized)) {
            xlsx = Buffer.from(await entry.async('arraybuffer'));
            continue;
        }

        const assetMatch = /^assets\/([^/]+)\/(.+)$/i.exec(normalized);
        if (assetMatch) {
            const folder = assetMatch[1]!;
            const filename = assetMatch[2]!;
            if (!assets.has(folder)) assets.set(folder, new Map());
            assets.get(folder)!.set(filename, Buffer.from(await entry.async('arraybuffer')));
        }
    }

    if (!xlsx) {
        return { ok: false, error: 'chokai.xlsx tidak ditemukan di akar ZIP.' };
    }

    return { ok: true, xlsx, assets };
}

function listFolderFiles(assets: ZipAssets, folder: string): Set<string> {
    return new Set(assets.get(folder)?.keys() ?? []);
}

function getFolderFile(assets: ZipAssets, folder: string, filename: string): Buffer | null {
    const files = assets.get(folder);
    if (!files) return null;
    const lower = filename.toLowerCase();
    for (const [name, buf] of files) {
        if (name.toLowerCase() === lower) return buf;
    }
    return null;
}

function resolveAudioFile(assets: ZipAssets, folder: string): Buffer | null {
    return getFolderFile(assets, folder, 'audio.mp3');
}

function resolveStemImage(assets: ZipAssets, folder: string): { filename: string; buffer: Buffer } | null {
    for (const name of ['stem.png', 'stem.jpg', 'stem.jpeg', 'stem.webp']) {
        const buf = getFolderFile(assets, folder, name);
        if (buf) return { filename: name, buffer: buf };
    }
    return null;
}

export function parseChokaiExcelRecords(
    xlsx: Buffer,
    assets: ZipAssets,
): { validRows: ChokaiImportRow[]; previewRows: ChokaiImportPreviewRow[]; errors: { row: number; message: string }[] } {
    const errors: { row: number; message: string }[] = [];
    const validRows: ChokaiImportRow[] = [];
    const previewRows: ChokaiImportPreviewRow[] = [];

    let workbook: ReturnType<typeof readXlsxBuffer>;
    try {
        workbook = readXlsxBuffer(xlsx);
    } catch {
        return {
            validRows: [],
            previewRows: [],
            errors: [formatRowError(0, 'chokai.xlsx tidak bisa dibaca.')],
        };
    }

    const sheet = sheetToRecords(workbook, workbook.SheetNames, ['folder', 'tipe_jawaban']);
    if ('error' in sheet) {
        return { validRows: [], previewRows: [], errors: [formatRowError(0, sheet.error)] };
    }

    if (sheet.records.length === 0) {
        return { validRows: [], previewRows: [], errors: [formatRowError(0, 'Isi minimal satu baris soal.')] };
    }

    sheet.records.forEach((record, index) => {
        const rowNumber = sheet.headerRow + index + 1;
        const rowErrors: string[] = [];
        const folder = pickField(record, ['folder']);
        const kindRaw = pickField(record, ['tipe_jawaban', 'tipejawaban']);
        const kind = normalizeChokaiAnswerOptionKind(kindRaw);

        if (!folder) {
            rowErrors.push('Folder wajib diisi.');
        } else if (!assets.has(folder)) {
            rowErrors.push(`Folder assets/${folder} tidak ada di ZIP.`);
        }

        if (!kind) {
            rowErrors.push(`Tipe Jawaban "${kindRaw || '(kosong)'}" harus Teks atau Gambar.`);
        }

        if (folder && !resolveAudioFile(assets, folder)) {
            rowErrors.push(`audio.mp3 tidak ditemukan di assets/${folder}/.`);
        }

        const audioIdRaw = pickField(record, ['audio_id', 'audioid']);
        const audioId = audioIdRaw || folder || '';

        const mulaiRaw = pickField(record, ['mulai', 'start']);
        const selesaiRaw = pickField(record, ['selesai', 'end']);
        const startSec = mulaiRaw ? parseChokaiTimeToSeconds(mulaiRaw) : 0;
        if (mulaiRaw && startSec == null) {
            rowErrors.push(`Mulai "${mulaiRaw}" tidak valid.`);
        }
        const endSec = selesaiRaw ? parseChokaiTimeToSeconds(selesaiRaw) : null;
        if (selesaiRaw && endSec == null) {
            rowErrors.push(`Selesai "${selesaiRaw}" tidak valid.`);
        }
        if (startSec != null && endSec != null && endSec <= startSec) {
            rowErrors.push('Selesai harus lebih besar dari Mulai.');
        }

        const audioGroupRaw = pickField(record, ['audio_group', 'audiogroup']);
        let audioGroupId: string | null = null;
        if (audioGroupRaw) {
            audioGroupId = sanitizeTryoutAudioGroupId(audioGroupRaw);
            if (!audioGroupId) rowErrors.push('Audio Group tidak valid.');
        }

        const pertanyaan = pickField(record, ['pertanyaan', 'questiontext', 'soal']);
        const penjelasan = pickField(record, ['penjelasan', 'explanation']) || null;

        const optionTexts = ['a', 'b', 'c', 'd'].map((k) =>
            pickField(record, [`pilihan_${k}`, k, `opsi_${k}`]),
        );

        let options: ChokaiImportOption[] = [];
        let optionSummary = '';

        if (kind === 'IMAGE' && folder) {
            const imageFiles = resolveChokaiOptionImageFiles(listFolderFiles(assets, folder));
            if (imageFiles.length < 2) {
                rowErrors.push('Tipe Jawaban Gambar membutuhkan minimal a.png dan b.png di folder.');
            }
            options = imageFiles.map(({ letter, filename }, idx) => ({
                text: optionTexts[['A', 'B', 'C', 'D'].indexOf(letter)] || optionTexts[idx] || `Opsi ${letter}`,
                imageFilename: filename,
            }));
            optionSummary = imageFiles.map((f) => f.letter).join(' ');
        } else if (kind === 'TEXT') {
            const filled = optionTexts.filter(Boolean);
            if (filled.length < 2) rowErrors.push('Isi minimal Pilihan A dan B.');
            if (!pertanyaan) rowErrors.push('Pertanyaan wajib untuk Tipe Jawaban Teks.');
            options = optionTexts
                .map((text) => ({ text, imageFilename: null as string | null }))
                .filter((o) => o.text);
            optionSummary = 'Teks';
        }

        const jawabanRaw = pickField(record, ['jawaban', 'jawaban_benar']);
        const resolved =
            options.length >= 2 ? resolveCorrectIndex(jawabanRaw, options.length) : { error: 'Opsi tidak lengkap.' };
        if ('error' in resolved) rowErrors.push(resolved.error);

        const questionText =
            kind === 'IMAGE' ? pertanyaan || CHOKAI_DEFAULT_IMAGE_QUESTION_HINT : pertanyaan;

        const noRaw = pickField(record, ['no', 'nomor']);
        const sortHint = noRaw ? Number(noRaw) : null;

        const audioRange =
            endSec != null
                ? `${mulaiRaw || '0:00'} – ${selesaiRaw}`
                : mulaiRaw
                    ? `${mulaiRaw} – akhir`
                    : 'penuh';

        for (const msg of rowErrors) {
            errors.push(formatRowError(rowNumber, msg));
        }

        const rowOk = rowErrors.length === 0 && kind != null && Boolean(folder);

        previewRows.push({
            rowNumber,
            folder: folder || '(kosong)',
            answerOptionKind: kind ?? 'TEXT',
            jawaban: jawabanRaw.toUpperCase(),
            audioRange,
            optionSummary,
            ok: rowOk,
            message: rowErrors[0],
        });

        if (!rowOk || !kind || !folder || 'error' in resolved) return;

        validRows.push({
            rowNumber,
            sortHint: Number.isInteger(sortHint) ? sortHint : null,
            folder,
            answerOptionKind: kind,
            questionText,
            explanation: penjelasan,
            options,
            correctIndex: resolved.index,
            audioId,
            startSec: startSec ?? 0,
            endSec,
            audioGroupId,
        });
    });

    return { validRows, previewRows, errors };
}

export async function previewChokaiZipImport(buffer: Buffer): Promise<ChokaiImportPreview> {
    const extracted = await extractChokaiZip(buffer);
    if (!extracted.ok) {
        return { ok: false, rowCount: 0, rows: [], errors: [formatRowError(0, extracted.error)] };
    }

    const { validRows, previewRows, errors } = parseChokaiExcelRecords(extracted.xlsx, extracted.assets);
    return {
        ok: errors.length === 0 && validRows.length > 0,
        rowCount: validRows.length,
        rows: previewRows,
        errors,
    };
}

async function resolveClipUrl(
    sessionCode: string,
    audioId: string,
    masterBuffer: Buffer,
    startSec: number,
    endSec: number,
    clipCache: Map<string, string>,
): Promise<string> {
    const key = chokaiClipDedupeKey(audioId, startSec, endSec);
    const cached = clipCache.get(key);
    if (cached) return cached;

    const duration = await probeAudioDurationSec(masterBuffer);
    const effectiveEnd = endSec > 0 ? endSec : duration;
    if (effectiveEnd <= startSec || effectiveEnd > duration + 0.05) {
        throw new Error(
            `Cuplikan audio ${audioId} (${startSec}s–${effectiveEnd}s) di luar durasi file (${duration.toFixed(1)}s).`,
        );
    }

    const clipBuffer =
        startSec <= 0.01 && Math.abs(effectiveEnd - duration) < 0.05
            ? masterBuffer
            : await sliceAudioToMp3(masterBuffer, startSec, effectiveEnd);

    const objectKey = buildTryoutChokaiClipKey(sessionCode, audioId, startSec, effectiveEnd);
    const url = await uploadToR2(clipBuffer, objectKey, 'audio/mpeg');
    clipCache.set(key, url);
    return url;
}

export async function importChokaiZip(
    db: PrismaClient,
    input: {
        sessionId: string;
        sessionCode: string;
        buffer: Buffer;
    },
): Promise<{ imported: number }> {
    const extracted = await extractChokaiZip(input.buffer);
    if (!extracted.ok) throw new Error(extracted.error);

    const { xlsx, assets } = extracted;
    const { validRows, errors } = parseChokaiExcelRecords(xlsx, assets);
    if (errors.length > 0 || validRows.length === 0) {
        throw new Error(errors[0]?.message ?? 'Tidak ada baris valid.');
    }

    const masterCache = new Map<string, Buffer>();
    const clipCache = new Map<string, string>();
    const imageUrlCache = new Map<string, string>();

    async function getMasterBuffer(audioId: string, folder: string): Promise<Buffer> {
        const cached = masterCache.get(audioId);
        if (cached) return cached;
        const buf = resolveAudioFile(assets, folder);
        if (!buf) throw new Error(`audio.mp3 tidak ada di folder ${folder}.`);
        masterCache.set(audioId, buf);
        await uploadToR2(buf, buildTryoutChokaiMasterKey(input.sessionCode, audioId), 'audio/mpeg');
        return buf;
    }

    await db.question.deleteMany({
        where: {
            tryoutSessionId: input.sessionId,
            tryoutSection: 'CHOKAI',
            type: 'TRYOUT',
        },
    });

    let sortOrder = 0;

    for (const row of validRows) {
        sortOrder = row.sortHint ?? sortOrder + 1;
        const master = await getMasterBuffer(row.audioId, row.folder);
        const duration = await probeAudioDurationSec(master);
        const endSec = row.endSec ?? duration;
        const audioUrl = await resolveClipUrl(
            input.sessionCode,
            row.audioId,
            master,
            row.startSec,
            endSec,
            clipCache,
        );

        let questionImageUrl: string | null = null;
        if (row.answerOptionKind === 'TEXT') {
            const stem = resolveStemImage(assets, row.folder);
            if (stem) {
                const cacheKey = `${row.folder}:stem`;
                questionImageUrl =
                    imageUrlCache.get(cacheKey) ??
                    (await uploadTryoutChokaiImage(stem.buffer, row.folder, stem.filename));
                imageUrlCache.set(cacheKey, questionImageUrl);
            }
        }

        const optionPayload = await Promise.all(
            row.options.map(async (opt, index) => {
                let imageUrl: string | null = null;
                if (opt.imageFilename) {
                    const cacheKey = `${row.folder}:${opt.imageFilename}`;
                    const cached = imageUrlCache.get(cacheKey);
                    if (cached) {
                        imageUrl = cached;
                    } else {
                        const buf = getFolderFile(assets, row.folder, opt.imageFilename);
                        if (!buf) throw new Error(`Gambar ${opt.imageFilename} hilang di folder ${row.folder}.`);
                        imageUrl = await uploadTryoutChokaiImage(buf, row.folder, opt.imageFilename);
                        imageUrlCache.set(cacheKey, imageUrl);
                    }
                }
                return {
                    text: opt.text,
                    imageUrl,
                    isCorrect: index === row.correctIndex,
                };
            }),
        );

        await db.question.create({
            data: {
                type: 'TRYOUT',
                tryoutSessionId: input.sessionId,
                tryoutSection: 'CHOKAI',
                sortOrder,
                questionText: row.questionText,
                explanation: row.explanation,
                audioUrl,
                audioGroupId: row.audioGroupId,
                imageUrl: questionImageUrl,
                answerOptionKind: row.answerOptionKind,
                xpReward: 0,
                options: { create: optionPayload },
            },
        });
    }

    return { imported: validRows.length };
}
