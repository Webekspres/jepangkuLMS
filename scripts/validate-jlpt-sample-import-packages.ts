import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import JSZip from 'jszip';
import { previewJlptBankZip } from '../features/admin-cms/lib/import-jlpt-bank-zip';
import { prisma } from '../lib/prisma';

async function zipDir(dir: string): Promise<Buffer> {
  const zip = new JSZip();
  zip.file('workbook.xlsx', await readFile(path.join(dir, 'workbook.xlsx')));
  const audioDir = path.join(dir, 'audio');
  for (const name of await readdir(audioDir)) {
    if (!name.endsWith('.mp3')) continue;
    zip.file(`audio/${name}`, await readFile(path.join(audioDir, name)));
  }
  return Buffer.from(await zip.generateAsync({ type: 'nodebuffer' }));
}

let failed = false;
for (const folder of ['JLPT_N5_SAMPLE_PACKAGE', 'JLPT_N4_SAMPLE_PACKAGE']) {
  const dir = path.join('docs/sample-imports', folder);
  const buf = await zipDir(dir);
  const preview = await previewJlptBankZip(prisma, buf);
  console.log('\n===', folder, '===');
  console.log({
    ok: preview.ok,
    packageCode: preview.packageCode,
    level: preview.packageLevel,
    questions: preview.questionCount,
    options: preview.optionCount,
    moji: preview.mojiCount,
    bunpou: preview.bunpouCount,
    chokai: preview.chokaiCount,
    audioFiles: preview.audioFileCount,
    errors: preview.errors.slice(0, 15),
    warnings: preview.warnings.slice(0, 5),
  });
  if (!preview.ok) {
    console.log('ALL ERRORS:', preview.errors);
    failed = true;
  }
}
await prisma.$disconnect();
if (failed) process.exit(1);
