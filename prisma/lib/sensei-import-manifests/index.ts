import type ExcelJS from 'exceljs';
import { N4_SENSEI_MANIFEST } from './n4-manifest';
import { N5_SENSEI_MANIFEST } from './n5-manifest';
import type { SenseiImportManifest, SenseiLevel } from './types';

export const SENSEI_MANIFESTS: Record<SenseiLevel, SenseiImportManifest> = {
    N4: N4_SENSEI_MANIFEST,
    N5: N5_SENSEI_MANIFEST,
};

export function detectSenseiLevel(workbook: ExcelJS.Workbook): SenseiLevel | null {
    const sheetNames = new Set(workbook.worksheets.map((s) => s.name.trim()));
    if (sheetNames.has(N4_SENSEI_MANIFEST.sheets.kanji)) return 'N4';
    if (sheetNames.has(N5_SENSEI_MANIFEST.sheets.kanji)) return 'N5';
    return null;
}

export function getSenseiManifest(level: SenseiLevel): SenseiImportManifest {
    return SENSEI_MANIFESTS[level];
}
