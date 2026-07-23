/**
 * Generate `features/placement/data/placement-paper.ts` from docs/Asset N5.xlsx
 * sheet `N5 - Placement Test` (言語知識（文法）・読解 only — Choukai deferred).
 *
 * Usage: bun run placement:generate
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import ExcelJS from 'exceljs';

const ROOT = join(import.meta.dir, '..');
const XLSX_PATH = join(ROOT, 'docs', 'Asset N5.xlsx');
const OUT_PATH = join(ROOT, 'features', 'placement', 'data', 'placement-bunpou.generated.ts');
const SHEET_NAME = 'N5 - Placement Test';

const OPTION_SUFFIX = ['a', 'b', 'c', 'd'] as const;

function cellText(value: ExcelJS.CellValue): string {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim();
  }
  if (typeof value === 'object' && 'richText' in value && Array.isArray(value.richText)) {
    return value.richText.map((t: { text?: string }) => t.text ?? '').join('').trim();
  }
  if (typeof value === 'object' && 'text' in value && typeof value.text === 'string') {
    return value.text.trim();
  }
  if (typeof value === 'object' && 'result' in value && value.result != null) {
    return String(value.result).trim();
  }
  if (typeof value === 'object' && 'hyperlink' in value) {
    const rich = value as ExcelJS.CellHyperlinkValue;
    if (typeof rich.text === 'string') return rich.text.trim();
    if (typeof rich.hyperlink === 'string') return rich.hyperlink.trim();
  }
  return String(value).trim();
}

function parseOptions(raw: string): string[] {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const opts: string[] = [];
  for (const line of lines) {
    const m = line.match(/^\d+\.\s*(.+)$/);
    opts.push(m ? m[1]!.trim() : line);
  }
  if (opts.length !== 4) {
    throw new Error(`Expected 4 options, got ${opts.length}: ${raw.slice(0, 80)}`);
  }
  return opts;
}

function parseCorrectIndex(raw: string): number {
  const m = raw.match(/^(\d+)\./);
  if (!m) throw new Error(`Cannot parse correct answer: ${raw}`);
  const n = Number(m[1]);
  if (n < 1 || n > 4) throw new Error(`Correct answer out of range: ${raw}`);
  return n - 1;
}

type ParsedQ = {
  order: number;
  prompt: string;
  optionLabels: string[];
  correctIndex: number;
  explanation: string;
};

function parseSheet(ws: ExcelJS.Worksheet): ParsedQ[] {
  const questions: ParsedQ[] = [];

  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;

    const noRaw = cellText(row.getCell(1).value);
    const prompt = cellText(row.getCell(2).value);
    const optionsRaw = cellText(row.getCell(3).value);
    const answerRaw = cellText(row.getCell(4).value);

    // Stop at Choukai block
    if (prompt === '聴解' || prompt.startsWith('聴解')) return;
    if (/^Mondai\s*1/i.test(prompt)) return;
    if (/^https?:\/\//i.test(prompt)) return;

    const no = Number(noRaw);
    if (!Number.isFinite(no) || no < 1 || !optionsRaw || !answerRaw) return;

    questions.push({
      order: no,
      prompt,
      optionLabels: parseOptions(optionsRaw),
      correctIndex: parseCorrectIndex(answerRaw),
      explanation: cellText(row.getCell(5).value),
    });
  });

  questions.sort((a, b) => a.order - b.order);
  return questions;
}

function escapeTsString(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

function emitBunpouQuestions(questions: ParsedQ[]): string {
  const lines: string[] = [];
  lines.push(`import type { PlacementQuestion } from './types';`);
  lines.push('');
  lines.push(`/**`);
  lines.push(` * Generated from docs/Asset N5.xlsx → sheet "${SHEET_NAME}".`);
  lines.push(` * Bunpou · Dokkai only. Regen: bun run placement:generate`);
  lines.push(` * Merged with Choukai stubs in placement-paper.ts`);
  lines.push(` */`);
  lines.push(`export const PLACEMENT_BUNPOU_QUESTIONS: PlacementQuestion[] = [`);

  for (const q of questions) {
    const id = `bunpou-${q.order}`;
    lines.push(`  {`);
    lines.push(`    id: '${id}',`);
    lines.push(`    section: 'BUNPOU_DOKKAI',`);
    lines.push(`    mondai: 'BUNPOU',`);
    lines.push(`    order: ${q.order},`);
    lines.push(`    prompt: \`${escapeTsString(q.prompt)}\`,`);
    lines.push(`    optionKind: 'TEXT',`);
    lines.push(`    options: [`);
    q.optionLabels.forEach((label, i) => {
      const oid = `${id}-${OPTION_SUFFIX[i]}`;
      lines.push(`      { id: '${oid}', label: \`${escapeTsString(label)}\` },`);
    });
    lines.push(`    ],`);
    lines.push(`    correctOptionId: '${id}-${OPTION_SUFFIX[q.correctIndex]}',`);
    if (q.explanation) {
      lines.push(`    explanation: \`${escapeTsString(q.explanation)}\`,`);
    }
    lines.push(`  },`);
  }

  lines.push(`];`);
  lines.push('');
  return lines.join('\n');
}

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(XLSX_PATH);
  const ws = wb.worksheets.find((w) => w.name === SHEET_NAME);
  if (!ws) {
    throw new Error(`Sheet not found: ${SHEET_NAME}. Available: ${wb.worksheets.map((w) => w.name).join(', ')}`);
  }

  const questions = parseSheet(ws);
  if (questions.length === 0) {
    throw new Error('No Bunpou questions parsed from sheet.');
  }
  if (questions.length !== 26) {
    console.warn(`Expected 26 questions, got ${questions.length}`);
  }

  writeFileSync(OUT_PATH, emitBunpouQuestions(questions), 'utf8');
  console.log(`Wrote ${questions.length} Bunpou questions → ${OUT_PATH}`);
}

await main();
