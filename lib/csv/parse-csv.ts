/** Parser CSV sederhana (RFC 4180) — mendukung koma, quote, dan newline di dalam sel. */

export type CsvParseResult = {
  headers: string[];
  rows: string[][];
};

function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

export function parseCsv(text: string): CsvParseResult {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  const content = text.replace(/^\uFEFF/, '');

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i]!;
    const next = content[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ',') {
      row.push(field);
      field = '';
      continue;
    }

    if (char === '\n') {
      row.push(field);
      field = '';
      if (row.some((cell) => cell.trim().length > 0)) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    if (char === '\r') {
      continue;
    }

    field += char;
  }

  row.push(field);
  if (row.some((cell) => cell.trim().length > 0)) {
    rows.push(row);
  }

  if (rows.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = rows[0]!.map(normalizeHeader);
  const dataRows = rows.slice(1);

  return { headers, rows: dataRows };
}

export function csvRowsToRecords(
  headers: string[],
  rows: string[][],
): Record<string, string>[] {
  return rows.map((cells) => {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      if (!header) return;
      record[header] = (cells[index] ?? '').trim();
    });
    return record;
  });
}
