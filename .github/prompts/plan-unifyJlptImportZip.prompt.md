# Plan: Unify JLPT Import to ZIP + XLSX

**Date**: July 1, 2026  
**Status**: Ready for implementation  
**Scope**: Consolidate MOJI/GOI/BUNPOU flat .xlsx + CHOKAI .zip into unified .zip format with multi-sheet Excel

---

## Overview

Merge three separate import paths into one unified `.zip + xlsx` format:

- **Current state**: MOJI/GOI/BUNPOU use flat `.xlsx`; CHOKAI uses `.zip` with structured assets
- **Target state**: Single ZIP containing multi-sheet Excel (tabs: MOJI_GOI, BUNPOU_DOKKAI, CHOKAI) + optional `assets/` folder for CHOKAI media
- **API**: One smart `/import` endpoint detects sheets and routes accordingly

---

## Decisions Locked

✅ **ZIP structure**: Single Excel with three sheets + assets/ at root  
✅ **Media support**: CHOKAI only (MOJI/GOI/BUNPOU text-only)  
✅ **Backward compatibility**: BREAKING — old flat .xlsx no longer supported  
✅ **Endpoint consolidation**: Single `/import` with sheet auto-detection

---

## Implementation Steps

### Phase 1: Create Unified ZIP Handler (Parallel with Phase 2)

**1. Create new unified import library** `features/admin-cms/lib/import-unified-tryout.ts`

- Entry point: `parseUnifiedTryoutZip(buffer, sessionId)`
- Logic: Extract ZIP → find Excel at root → read sheet names → per-sheet processing
- Return: Unified result `{ moji?: results, bunpou?: results, chokai?: results, errors: [] }`

**2. Extract sheet-specific parsing** into dedicated functions (_reuse existing logic_)

- `parseMojiGoi(records, sessionId)` — reuse from `import-tryout-questions.ts`
- `parseBunpouDokkai(records, sessionId)` — reuse from `import-tryout-questions.ts`
- `parseChokaiFromZip(records, assets, sessionId)` — adapt from `import-chokai-zip.ts`
- Each returns `{ questions, errors }` struct

**3. Consolidate validation** into `features/admin-cms/lib/import-unified-validation.ts`

- Shared rule engine for question validation (reuse `validateTryoutQuestionRecords`)
- Sheet detection logic:
  - MOJI_GOI/BUNPOU_DOKKAI tabs → text-only mode (ignore media fields)
  - CHOKAI tab → requires assets validation (audio, images)
- Error aggregation: per-sheet + per-row detail

### Phase 2: Update API Endpoint (Parallel with Phase 1)

**4. Refactor** `app/api/admin/tryout/import/route.ts`

- Remove separate handling for MOJI/BUNPOU/CHOKAI
- Import: `parseUnifiedTryoutZip()` from new handler
- POST accepts ZIP only; dry-run query param persists
- Return unified error/success format (same as current `/import-chokai`)
- Respond 400 if not ZIP, 400 if no recognized sheets

**5. Deprecate** `/api/admin/tryout/import-chokai/route.ts`

- Option A: Log deprecation warning, redirect to `/import` with 301
- Option B: Keep stub that accepts .zip and calls unified handler (graceful migration)

### Phase 3: Update Admin UI Components

**6. Update** `features/admin-cms/components/admin-tryout-import-panel.tsx`

- Change file input: accept `.zip` only (was `.xlsx`)
- Update UI text: "Upload JLPT Import ZIP (MOJI, BUNPOU, or CHOKAI)"
- Show preview of detected sheets before upload (optional UX enhancement)

**7. Consolidate** `features/admin-cms/components/admin-tryout-chokai-import-panel.tsx`

- Option A: Merge into unified import panel (single upload → auto-detect CHOKAI)
- Option B: Keep as separate but marked deprecated with redirect to unified panel

### Phase 4: Template Generation & Documentation

**8. Refactor** `features/admin-cms/lib/build-chokai-template-zip.ts` → `build-jlpt-template-zip.ts`

- Generate ZIP with three sheets (MOJI_GOI, BUNPOU_DOKKAI, CHOKAI)
- Include example assets/ folder structure
- Embed sheet-specific instructions in each tab

**9. Update endpoint** `app/api/admin/tryout/template/route.ts`

- Return new multi-sheet ZIP template instead of single .xlsx
- Consider gracefully handling `/chokai-template` requests (redirect or stub)

**10. Update documentation** - [docs/ADMIN_QUIZ.md](docs/ADMIN_QUIZ.md) — new ZIP format & sheet names - [docs/PROGRESS.md](docs/PROGRESS.md) — mark import refactor as complete - Provide admin import checklist: ZIP structure, sheet names, required columns per sheet

### Phase 5: Migration & Cleanup (Optional)

**11. Archive or mark old import functions** - Keep [features/admin-cms/lib/import-tryout-questions.ts](features/admin-cms/lib/import-tryout-questions.ts) as reference, mark with `ponytail: logic moved to import-unified-tryout.ts` - Keep [features/admin-cms/lib/import-chokai-zip.ts](features/admin-cms/lib/import-chokai-zip.ts) as reference, same comment - Do NOT delete until testing confirms all paths work

**12. Update query client invalidation** (`lib/query-keys.ts`) - Ensure single endpoint properly invalidates tryout-related caches - Test cache invalidation on successful import

---

## File Structure Changes

### New Files (Create)

```
features/admin-cms/lib/
├── import-unified-tryout.ts         (new) — unified ZIP entry point + sheet routing
└── import-unified-validation.ts     (new) — consolidated validation engine
```

### Files to Modify

```
app/api/admin/tryout/
├── import/route.ts                  — consolidate endpoints, remove separate MOJI/CHOKAI handling
├── template/route.ts                — return multi-sheet ZIP template
└── import-chokai/route.ts           — deprecate (redirect or stub)

features/admin-cms/
├── components/
│   ├── admin-tryout-import-panel.tsx           — ZIP input only
│   └── admin-tryout-chokai-import-panel.tsx    — consolidate or deprecate
└── lib/
    └── build-chokai-template-zip.ts            — refactor to multi-sheet ZIP generation
```

### Files to Keep as Reference (Mark with ponytail)

```
features/admin-cms/lib/
├── import-tryout-questions.ts       — logic extracted to unified handler
├── import-chokai-zip.ts             — logic extracted to unified handler
└── import-tryout-tryout-rows.ts     — validation logic extracted to unified handler
```

### No Changes (Reuse Utilities)

```
features/admin-cms/lib/
├── xlsx-workbook.ts                 — sheet resolution, header normalization
└── chokai-excel-columns.ts          — Chokai-specific parsing (time, image detection)

lib/
├── media/tryout-audio.ts            — audio key building
├── media/tryout-chokai-image.ts     — image upload
└── media/ffmpeg.ts                  — audio slicing
```

---

## Testing Strategy

### Unit Tests (`tests/unit/`)

- [ ] Parse multi-sheet ZIP → returns all three sections correctly
- [ ] ZIP without recognized sheets → 400 error with helpful message
- [ ] Dry-run mode: no DB insert, preview response only
- [ ] CHOKAI sheet without assets/ folder → validation error
- [ ] MOJI_GOI/BUNPOU with audio fields in Excel → ignored (text-only mode)
- [ ] Sheet name variations (e.g., `Moji GOI`, `MOJI_GOI`, `moji-goi`) → all normalized correctly
- [ ] Duplicate sheet names → error
- [ ] Empty sheets → skipped or error (decide)

### Integration Tests (Playwright E2E, `tests/e2e/`)

- [ ] Upload JLPT ZIP from admin panel
- [ ] Verify preview shows detected sheets + row count per section
- [ ] Confirm questions imported correctly per section
- [ ] Verify audio clip slicing only happens for CHOKAI
- [ ] Old .xlsx files rejected with clear error message
- [ ] Deprecated `/import-chokai` endpoint gracefully migrates (if keeping stub)

### Manual UAT

- [ ] Admin uploads ZIP with all three sections populated
- [ ] Admin uploads ZIP with only CHOKAI (with audio)
- [ ] Admin uploads ZIP with only MOJI_GOI (text-only, no assets/)
- [ ] Error messages are clear and actionable
- [ ] Audio deduplication still works (clip cache keys unchanged)
- [ ] R2 uploads for audio & images working

### Regression Checks

- [ ] Existing CHOKAI imports via deprecated endpoint still work (if backward compat stub)
- [ ] Audio asset deduplication still works (clip cache keys unchanged)
- [ ] R2 uploads succeed
- [ ] Session-level question counts correct after import
- [ ] Dry-run preview matches final import results

---

## Data Model: ZIP + Excel Structure

### ZIP Layout

```
jlpt-import.zip
├── jlpt.xlsx                    (required, at root)
└── assets/                      (optional, only for CHOKAI)
    ├── chokai_001/
    │   ├── audio.mp3            (required for each folder)
    │   ├── a.png, b.png, c.png, d.png  (for IMAGE type questions)
    │   └── stem.png             (optional, displayed above question)
    ├── chokai_002/
    │   └── ...
```

### Excel Sheet Layout

**Sheet: MOJI_GOI** (text-only)

```
| Pertanyaan | Pilihan_A | Pilihan_B | Pilihan_C | Pilihan_D | Jawaban_Benar | Penjelasan |
|-----------|----------|----------|----------|----------|---------------|-----------|
| 猫は...   | 飼う     | 飼える   | 飼われる | 飼わせる | C             | 文法...    |
```

**Sheet: BUNPOU_DOKKAI** (text-only)

```
| Soal | Options (newline-separated) | Jawaban | Penjelasan |
|------|--------------------------|--------|-----------|
| 私は毎日...| A. 歩く\nB. 歩いた | A | 現在形... |
```

**Sheet: CHOKAI** (with optional media)

```
| Folder | Tipe_Jawaban | Audio_ID | Mulai | Selesai | Pertanyaan | A | B | C | D | Jawaban | Penjelasan |
|--------|------------|----------|-------|--------|-----------|---|---|---|---|---------| ----------|
| chokai_001 | Gambar | audio_01 | 0:05 | 0:15 | 女は... | (image) | (image) | (image) | (image) | A | ... |
| chokai_002 | Teks | audio_02 | | | 男は... | 選択肢A | 選択肢B | 選択肢C | 選択肢D | B | ... |
```

---

## Considerations & Open Questions

1. **Sheet name matching**: How strict should sheet name detection be?
   - Current: Fuzzy matching via `resolveSheetName()` with aliases
   - Recommendation: Keep fuzzy to reduce admin errors (MOJI_GOI, moji goi, moji-goi all work)

2. **Empty sheets**: If admin includes a CHOKAI sheet with no rows, should we:
   - Silently skip it?
   - Return warning but continue?
   - Error and reject entire ZIP?
   - Recommendation: Warning (logged) + skip, continue with other sheets

3. **Asset organization**: For CHOKAI, must admin create `assets/` even if questions are text-only?
   - Current: If CHOKAI sheet present but no assets/, validation passes (text-only fallback)
   - Recommendation: Validate that if question row specifies folder + image type, assets/[folder] must exist

4. **Admin UX**: Show "sheet preview" dialog after upload (before commit)?
   - Recommendation: Yes, show detected sheets + row count; allows admin to confirm before processing

5. **Migration timeline**: Should old `/import-chokai` endpoint be:
   - Killed immediately (breaking change)?
   - Kept as deprecated stub for 1 month?
   - Kept as redirect?
   - Recommendation: Stub that logs deprecation warning, calls unified handler (graceful migration)

6. **Error granularity**: Per-sheet error aggregation or detailed row-by-row?
   - Current: `/import-chokai` returns per-row errors in dry-run
   - Recommendation: Aggregate summary on first view, expandable details (UX-friendly)

---

## Success Criteria

- ✅ Single `/import` endpoint handles all three sections (MOJI, BUNPOU, CHOKAI)
- ✅ ZIP format is validated before processing (required Excel + optional assets/)
- ✅ Dry-run mode works for preview before commit
- ✅ CHOKAI audio clipping & R2 uploads still work
- ✅ Old flat .xlsx format rejected with clear error
- ✅ Admin UI clearly indicates ZIP-only input
- ✅ All existing CHOKAI imports pass regression tests
- ✅ Error messages are helpful (sheet name, row number, validation rule)
- ✅ Template ZIP includes example structure + instructions
- ✅ Deprecated `/import-chokai` endpoint handled gracefully (or removed)

---

## Not in Scope

- Custom media (images/audio) for MOJI/GOI/BUNPOU (text-only by design)
- Batch import of multiple sessions in one ZIP (one session per ZIP)
- Automatic section detection from file names (must use sheet names)
- Data migration from old .xlsx imports (admins must re-upload as ZIP)

---

## Timeline Estimate

- **Phase 1 & 2** (Unified handler + API refactor): 2–3 hours
- **Phase 3** (UI updates): 1 hour
- **Phase 4** (Templates & docs): 1 hour
- **Phase 5** (Cleanup & testing): 1–2 hours
- **Total**: ~5–7 hours (including thorough testing)

---

## Notes for Implementation

- **Reuse, don't rewrite**: Extract logic from existing handlers; preserve tested validation rules
- **Backward compat**: BREAKING change; admins must know old format won't work
- **Error clarity**: Include sheet name + row number in every error message
- **Dry-run is essential**: Always let admin preview before commit
- **Document ZIPstructure**: Embed examples in template + ADMIN_QUIZ.md
