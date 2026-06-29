import type { TryoutSectionValue } from '@/features/admin-cms/lib/tryout-sections';
import type { TryoutImportRow } from '@/features/admin-cms/lib/import-tryout-questions';
import { sanitizeTryoutAudioGroupId } from '@/lib/media/tryout-audio';
import { normalizeTryoutSection } from '@/features/admin-cms/lib/tryout-sections';
import { formatTabError, pickField } from '@/features/admin-cms/lib/xlsx-workbook';

function parseOptionsFromRecord(record: Record<string, string>): string[] {
    const fromLetters = ['pilihan_a', 'pilihan_b', 'pilihan_c', 'pilihan_d'].map((k) =>
        pickField(record, [k]),
    );
    if (fromLetters.some(Boolean)) return fromLetters.filter(Boolean);

    const joined = pickField(record, ['options', 'opsi', 'pilihan']);
    if (!joined) return [];
    return joined
        .split(/\n|\\n/)
        .map((line) => line.trim())
        .filter(Boolean);
}

function resolveCorrectIndex(
    raw: string,
    options: string[],
    rowNumber: number,
    tabLabel: string,
): { index: number } | { error: string } {
    const trimmed = raw.trim();
    if (!trimmed) {
        return { error: formatTabError(tabLabel, rowNumber, 'Jawaban Benar wajib diisi.') };
    }

    const letterMap: Record<string, number> = { a: 0, b: 1, c: 2, d: 3 };
    const letter = letterMap[trimmed.toLowerCase()];
    if (letter != null && letter < options.length) return { index: letter };

    const asNumber = Number(trimmed);
    if (Number.isInteger(asNumber) && asNumber >= 1 && asNumber <= options.length) {
        return { index: asNumber - 1 };
    }

    const matchIndex = options.findIndex((opt) => opt.toLowerCase() === trimmed.toLowerCase());
    if (matchIndex >= 0) return { index: matchIndex };

    return {
        error: formatTabError(
            tabLabel,
            rowNumber,
            `Jawaban Benar "${raw}" tidak cocok dengan pilihan (gunakan A–D atau teks opsi).`,
        ),
    };
}

export function validateTryoutQuestionRecords(
    records: Record<string, string>[],
    fixedSection: TryoutSectionValue | null,
    headerRow: number,
    tabLabel: string,
): { validRows: TryoutImportRow[]; errors: { row: number; message: string }[] } {
    const errors: { row: number; message: string }[] = [];
    const validRows: TryoutImportRow[] = [];

    records.forEach((record, index) => {
        const rowNumber = headerRow + index + 1;
        const sectionRaw = fixedSection ?? pickField(record, ['section', 'bagian']);
        const section = fixedSection ?? normalizeTryoutSection(sectionRaw);

        if (!section) {
            errors.push({
                row: rowNumber,
                message: formatTabError(tabLabel, rowNumber, `Bagian "${sectionRaw || '(kosong)'}" tidak dikenali.`),
            });
            return;
        }

        if (section === 'CHOKAI') {
            errors.push({
                row: rowNumber,
                message: formatTabError(tabLabel, rowNumber, 'Soal mendengarkan (Chokai) tidak didukung di impor ini.'),
            });
            return;
        }

        const questionText = pickField(record, ['pertanyaan', 'questiontext', 'soal']);
        if (!questionText) {
            errors.push({ row: rowNumber, message: formatTabError(tabLabel, rowNumber, 'Pertanyaan wajib diisi.') });
            return;
        }

        const options = parseOptionsFromRecord(record);
        if (options.length < 2) {
            errors.push({
                row: rowNumber,
                message: formatTabError(tabLabel, rowNumber, 'Isi minimal Pilihan A dan B.'),
            });
            return;
        }

        const resolved = resolveCorrectIndex(
            pickField(record, ['jawaban_benar', 'jawaban', 'correctoptionindex']),
            options,
            rowNumber,
            tabLabel,
        );
        if ('error' in resolved) {
            errors.push({ row: rowNumber, message: resolved.error });
            return;
        }

        const noRaw = pickField(record, ['no', 'nomor']);
        const sortHint = noRaw ? Number(noRaw) : null;

        const audioGroupRaw = pickField(record, ['audiogroupid', 'audio_group_id']);
        let audioGroupId: string | null = null;
        if (audioGroupRaw) {
            audioGroupId = sanitizeTryoutAudioGroupId(audioGroupRaw);
            if (!audioGroupId) {
                errors.push({
                    row: rowNumber,
                    message: formatTabError(tabLabel, rowNumber, 'Kode grup audio tidak valid.'),
                });
                return;
            }
        }

        validRows.push({
            rowNumber,
            sortHint: Number.isInteger(sortHint) ? sortHint : null,
            section,
            questionText,
            explanation: pickField(record, ['penjelasan', 'explanation']) || null,
            options,
            correctIndex: resolved.index,
            audioUrl: null,
            audioGroupId,
        });
    });

    return { validRows, errors };
}

export function validateTryoutImportRecords(
    records: Record<string, string>[],
): { validRows: TryoutImportRow[]; errors: { row: number; message: string }[] } {
    return validateTryoutQuestionRecords(records, null, 1, 'Impor');
}
