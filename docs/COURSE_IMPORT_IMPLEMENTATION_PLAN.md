# Course Import Implementation Plan

## Goal

Refactor the Course Import feature incrementally into a scalable Content Import Framework while keeping the project buildable after every phase and preserving compatibility with the current sensei workbook flow where appropriate.

## Guiding Principles

- Do not break the current admin import flow before the replacement path is ready.
- Separate parsing, validation, normalization, preview, persistence, and reporting.
- Design around the LMS domain model, not around one workbook.
- Preserve backward compatibility through adapters and template versioning.
- Keep destructive import behavior behind strong validation and transaction boundaries.
- Keep V1 intentionally narrow: parser -> validator -> normalizer -> transactional persistence -> adapter -> preview/report.
- Reuse the modern `lessonType` architecture without overbuilding registry frameworks in V1.

## Scope

In scope:

- course import architecture
- workbook adapters
- validation pipeline
- normalized import domain model
- preview/reporting redesign
- transactional persistence strategy
- official workbook template design
- focused tests and docs

Out of scope:

- student lesson runtime behavior
- tryout importer redesign unless intentionally shared later
- content authoring UX outside the import flow
- migrations for unrelated admin CMS areas
- import jobs/history
- multiple import modes beyond documenting current `REPLACE` behavior
- asynchronous/background execution
- formal import-registry abstraction

## Phase 1: Freeze And Document Current Behavior

### Objective

Lock down the current importer behavior so the redesign has a known baseline.

### Changes

- Add/expand tests around current preview and import behavior.
- Document the current sensei workbook contract explicitly.
- Identify which current quirks are contractual vs accidental.

### Target files

- `tests/unit/sensei-course-import.test.ts`
- `tests/helpers/build-sensei-test-workbook.ts`
- `docs/COURSE_IMPORT_ARCHITECTURE.md`

### Deliverables

- stronger regression coverage for existing importer
- explicit documentation of current workbook assumptions

### Safety checks

- preview/import tests pass before redesign starts

## Phase 2: Introduce Shared Domain Import Types

### Objective

Create a normalized LMS import contract independent from workbook structure, while keeping the contract practical for a narrow V1 implementation.

### Changes

- Add new import domain types for:
  - course
  - module
  - lesson
  - typed lesson content payloads
  - validation/reporting issues
- Add template metadata/version typing.
- Add stable external identifier requirements for course/module/lesson.

### Target files

- new files under `features/admin-cms/lib/import-framework/`
- or similar domain-specific folder

Suggested files:

- `normalized-import-types.ts`
- `import-issues.ts`
- `import-template-types.ts`

### Deliverables

- one normalized import object shape
- one issue/report shape
- one stable external ID strategy

### Safety checks

- no production importer behavior changes yet
- project still builds

## Phase 3: Create Validation And Reporting Layer

### Objective

Separate validation from persistence and make issues structured.

### Changes

- Add structural validation stage.
- Add semantic validation stage.
- Distinguish warning vs error.
- Standardize issue codes/messages.
- Validate stable external identifiers and reference integrity.

### Target files

- `features/admin-cms/lib/import-framework/validators/*`
- `features/admin-cms/lib/import-framework/reporters/*`

Suggested files:

- `validate-workbook-structure.ts`
- `validate-normalized-course-import.ts`
- `build-import-report.ts`
- `validate-external-identifiers.ts`

### Deliverables

- reusable validation pipeline
- row/sheet-aware issue reporting

### Safety checks

- validators unit-tested independently
- existing importer still untouched or only wrapped safely

## Phase 4: Build Sensei Adapter On Top Of The New Pipeline

### Objective

Keep compatibility with the current workbook while moving logic into the new architecture.

### Changes

- Implement `sensei-jlpt-v1` parser adapter.
- Move workbook-specific sheet/header logic into the adapter.
- Normalize raw records into the shared import domain model.
- Synthesize compatibility external IDs where the legacy workbook lacks them directly.
- Mark detection source as legacy pattern-based detection.

### Target files

- `features/admin-cms/lib/import-framework/adapters/sensei-jlpt-v1/*`
- existing manifest files may be reused or relocated

Suggested files:

- `detect-course-import-template.ts`
- `parse-sensei-jlpt-v1.ts`
- `normalize-sensei-jlpt-v1.ts`

### Deliverables

- current sensei workbook supported through adapter boundary
- no workbook-specific logic in generic persistence layer
- clear compatibility behavior for legacy IDs and legacy version detection

### Safety checks

- current N4/N5 preview/import tests still pass
- new adapter tests added

## Phase 5: Build Preview Model And New Preview Flow

### Objective

Show normalized content summary before import commit.

### Changes

- Add preview model generated from normalized import data.
- Expose structured errors/warnings in UI and API.
- Stop relying only on count summaries.

### Target files

- `features/admin-cms/actions/cms-import-actions.ts`
- `features/admin-cms/components/admin-course-import-page.tsx`
- `app/api/admin/kursus/import/route.ts`

### Deliverables

- preview generated from validation + normalization pipeline
- improved issue visibility

### Safety checks

- current import UI still works end-to-end
- no commit allowed when preview has blocking errors

## Phase 6: Introduce Transactional Persistence Layer

### Objective

Move database writes into a dedicated import executor with safer transaction semantics.

### Changes

- Create persistence layer that consumes normalized import data.
- Wrap destructive course import in one top-level transaction where feasible.
- Make replace/clear behavior explicit.
- Keep V1 persistence behavior equivalent to `REPLACE`, but implement it safely and explicitly.

### Target files

- `features/admin-cms/lib/import-framework/persist/*`
- possible extraction from `import-sensei-course-xlsx.ts`

Suggested files:

- `persist-course-import.ts`
- `persist-modules.ts`
- `persist-lessons.ts`
- `persist-lesson-content.ts`

### Deliverables

- workbook-independent persistence layer
- rollback-safe import behavior
- explicit, safe `REPLACE` behavior

### Safety checks

- import either commits fully or rolls back cleanly
- no silent partial overwrite

## Phase 7: Align Persistence With LessonType Rules

### Objective

Persist lesson content according to `lessonType` rules, not workbook-specific shortcuts.

### Changes

- Route lesson content through type-aware persistence handlers.
- Validate content compatibility against `lessonType`.
- Reuse lesson-type registry concepts where practical, without introducing a separate import-registry framework in V1.

### Target files

- `features/learning/lib/lesson-type-registry.ts`
- new import persistence handlers

Suggested files:

- `lesson-import-handlers.ts`
- `persist-video-lesson.ts`
- `persist-flashcard-lesson.ts`
- `persist-quiz-lesson.ts`
- `persist-text-lesson.ts`

### Deliverables

- importer aligned with modern lesson architecture
- easier future support for new lesson types
- persistence no longer depends on ad hoc workbook-specific branching

### Safety checks

- invalid lesson type/content combinations fail validation before commit

## Phase 8: Design And Add Official Workbook Template

### Objective

Introduce an official teacher-facing template aligned with the LMS domain model while preserving low cognitive load for educators.

### Changes

- Define `official-course-v1` workbook sheets and headers.
- Add README/guidance sheet generator.
- Add template download endpoint or builder.
- Define explicit template metadata/version storage.
- Optimize sheet design for teacher authoring, not database mirroring.

### Target files

- `features/admin-cms/lib/xlsx-template-builder.ts`
- new course-template builder files
- `app/api/admin/kursus/template/route.ts`

Suggested files:

- `build-course-import-template-v1.ts`
- `official-course-v1-schema.ts`
- `official-course-v1-metadata.ts`

### Deliverables

- teacher-friendly but deterministic official template
- downloadable template aligned to course/module/lesson model
- explicit template version contract

### Safety checks

- template examples validated through parser tests

## Phase 9: Support Multi-Template Detection

### Objective

Run old and new workbook formats in parallel during migration.

### Changes

- Add template detection/version selection.
- Route workbook to:
  - `sensei-jlpt-v1`
  - `official-course-v1`
- Prefer metadata-based detection for official templates.
- Keep sheet-pattern fallback only for legacy adapters.

### Target files

- `detect-course-import-template.ts`
- UI copy in import page
- API/preview responses

### Deliverables

- explicit adapter/version handling
- backward-compatible transition path
- no long-term dependence on sheet names alone

### Safety checks

- old workbook still imports
- new workbook imports through the new path

## Phase 10: Improve Error UX And Import Reporting

### Objective

Make import outcomes understandable for academic staff.

### Changes

- Display structured errors and warnings in the admin page.
- Add row/sheet references to messages.
- Surface template version in results where useful.
- Optionally add downloadable error report later.

### Target files

- `features/admin-cms/components/admin-course-import-page.tsx`
- new report formatter utilities

### Deliverables

- clearer import feedback
- less reliance on developer debugging

### Safety checks

- user can identify why an import failed without reading source code

## Phase 11: Sunset Legacy Import Core

### Objective

Remove or reduce direct dependence on the old monolithic importer.

### Changes

- Replace direct use of `import-sensei-course-xlsx.ts` with the new framework.
- Keep a thin compatibility wrapper only if still needed.
- Deprecate obsolete template messaging/routes.

### Target files

- `features/admin-cms/lib/import-sensei-course-xlsx.ts`
- `features/admin-cms/actions/cms-import-actions.ts`
- `app/api/admin/kursus/import/route.ts`

### Deliverables

- new framework becomes primary path
- legacy code surface reduced

### Safety checks

- all existing import tests replaced or preserved under new framework

## Compatibility Concerns

- current N4/N5 workbook must not be broken during the transition
- current course/module/lesson seeds may remain necessary during migration
- preview counts may shift once normalization becomes domain-driven; UI copy should be updated carefully
- old warning-only behaviors may become blocking validation errors, which must be communicated intentionally
- legacy workbooks may not carry stable external IDs explicitly, so compatibility synthesis rules must be documented carefully
- template detection must support both explicit metadata and legacy sheet-pattern fallbacks during migration

## Testing Strategy

### Unit tests

- template detection
- parser adapters
- structural validators
- semantic validators
- normalization of workbook rows into LMS model
- persistence handlers by lesson type
- external ID validation and collision handling

### Integration tests

- preview for `sensei-jlpt-v1`
- import for `sensei-jlpt-v1`
- preview for `official-course-v1`
- import rollback on validation/persistence failure
- metadata-based template detection for official templates

### Regression tests

- current minimal N4/N5 workbook cases
- unknown categories
- invalid correct answer
- duplicate identifiers
- missing lesson references
- replace-mode destructive safety

## Recommended Rollout Order

1. strengthen tests around current importer
2. add shared normalized import types
3. add validators/reporting
4. implement `sensei-jlpt-v1` adapter
5. switch preview to the new pipeline
6. switch persistence to transactional executor with explicit `REPLACE`
7. align persistence with lesson-type rules
8. introduce official teacher-friendly template with explicit metadata
9. add multi-template support
10. improve UX/reporting
11. sunset old monolithic import core

## Done Criteria For Architecture Approval

Implementation should only begin after the following are agreed:

- normalized import contract
- stable external ID strategy
- template metadata/version contract
- V1 scope stays intentionally narrow
- official workbook template direction
- validation severity rules
- transaction strategy
- compatibility policy for current sensei workbook
- initial scope of supported lesson types in import v1

Once those are approved, implementation can proceed incrementally with low regression risk.
