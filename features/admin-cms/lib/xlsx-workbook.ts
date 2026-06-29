import * as XLSX from 'xlsx';

export const XLSX_COLORS = {
    guideBg: 'FFFEF3C7',
    requiredHeaderBg: 'FFFDE68A',
    requiredHeaderText: 'FF78350F',
    optionalHeaderBg: 'FFF1F5F9',
    mainHeaderBg: 'FF0F766E',
    mainHeaderText: 'FFFFFFFF',
    exampleRowBg: 'FFDCFCE7',
} as const;

export function normalizeHeaderKey(raw: unknown): string {
    return String(raw ?? '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
}

export function stripSheetPrefix(name: string): string {
    return name.replace(/^\d+\.\s*/, '').trim();
}

export function readXlsxBuffer(buffer: Buffer): XLSX.WorkBook {
    return XLSX.read(buffer, { type: 'buffer' });
}

export function resolveSheetName(workbook: XLSX.WorkBook, aliases: string[]): string | null {
    const normalizedAliases = new Set(aliases.map((a) => normalizeHeaderKey(stripSheetPrefix(a))));
    for (const name of workbook.SheetNames) {
        const key = normalizeHeaderKey(stripSheetPrefix(name));
        if (normalizedAliases.has(key)) return name;
    }
    return null;
}

export function pickField(record: Record<string, string>, keys: string[]): string {
    for (const key of keys) {
        const val = record[key];
        if (val?.trim()) return val.trim();
    }
    return '';
}

function rowHasContent(row: unknown[]): boolean {
    return row.some((cell) => String(cell ?? '').trim() !== '');
}

function findHeaderRowIndex(rows: unknown[][], headerKeys: string[]): number {
    const need = headerKeys.map(normalizeHeaderKey);
    for (let i = 0; i < Math.min(rows.length, 20); i++) {
        const row = rows[i] ?? [];
        const normalized = row.map((cell) => normalizeHeaderKey(cell));
        const hits = need.filter((key) => normalized.includes(key)).length;
        if (hits >= Math.min(2, need.length)) return i;
    }
    return -1;
}

export function sheetToRecords(
    workbook: XLSX.WorkBook,
    sheetAliases: string[],
    requiredHeaderKeys: string[],
): { records: Record<string, string>[]; headerRow: number } | { error: string } {
    const sheetName = resolveSheetName(workbook, sheetAliases);
    if (!sheetName) {
        return { error: `Tab "${sheetAliases[0]}" tidak ditemukan.` };
    }

    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return { error: `Tab "${sheetName}" kosong.` };

    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
        header: 1,
        defval: '',
        raw: false,
    }) as unknown[][];

    const headerIdx = findHeaderRowIndex(rows, requiredHeaderKeys);
    if (headerIdx < 0) {
        return { error: `Tab "${stripSheetPrefix(sheetName)}": baris judul kolom tidak ditemukan.` };
    }

    const headers = (rows[headerIdx] ?? []).map((cell) => normalizeHeaderKey(cell));
    const records: Record<string, string>[] = [];

    for (let i = headerIdx + 1; i < rows.length; i++) {
        const row = rows[i] ?? [];
        if (!rowHasContent(row)) continue;

        const record: Record<string, string> = {};
        headers.forEach((key, colIdx) => {
            if (!key) return;
            record[key] = String(row[colIdx] ?? '').trim();
        });
        records.push(record);
    }

    return { records, headerRow: headerIdx + 1 };
}

export function parseYesNo(raw: string): boolean {
    const v = raw.trim().toLowerCase();
    return v === 'ya' || v === 'yes' || v === 'y' || v === '1' || v === 'true' || v === 'publik';
}

export function parsePositiveInt(raw: string, fallback?: number): number | null {
    const trimmed = raw.trim();
    if (!trimmed) return fallback ?? null;
    const n = Number.parseInt(trimmed, 10);
    if (!Number.isInteger(n) || n < 1) return null;
    return n;
}

export function formatTabError(sheet: string, row: number, message: string): string {
    return `Tab ${sheet}, baris ${row}: ${message}`;
}
