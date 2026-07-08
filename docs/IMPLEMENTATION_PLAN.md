# Lesson Content Refactor Implementation Plan

## Goal

Implement the lesson-content refactor incrementally so the application remains buildable at every stage, while preserving legacy data and avoiding unrelated changes.

## Guiding Principles

- `lessonType` stays **nullable** during migration.
- `lessonType` becomes the **single source of truth** for migrated lessons.
- No redundant flags such as `hasVideo`, `hasFlashcard`, or `hasQuiz`.
- Legacy mixed-content lessons continue to work until explicitly migrated.
- `Question` remains shared with tryout.
- New lesson types should plug into a registry/strategy-based editor/renderer flow.

## Scope

In scope:

- lesson schema and lesson-related domain helpers
- admin lesson create/edit flow
- admin lesson workspace
- student lesson workspace
- lesson loaders, validation, and compatibility logic
- migration support for legacy lessons
- focused tests and documentation

Out of scope:

- enrollment
- authentication/authorization
- tryout domain redesign
- gamification/XP/badges
- notifications/email/payment

## Phase 1: Domain Foundations

### Objective

Introduce explicit lesson typing in the domain layer without breaking current behavior.

### Changes

- Add `LessonType` enum to Prisma.
- Add nullable `lessonType` to `Lesson`.
- Add shared TypeScript lesson-type definitions/helpers.
- Add legacy detection helpers.

### Target files

- [`prisma/schema.prisma`](../prisma/schema.prisma)
- `features/learning/types/lesson.ts` or similar new shared file
- `features/learning/lib/lesson-type.ts` or similar helper file

### Deliverables

- Prisma schema updated
- typed helpers such as:
  - `isLegacyLesson`
  - `assertLessonType`
  - `getResolvedLessonType` or equivalent

### Safety checks

- Prisma client generation succeeds
- existing lesson queries still compile with `lessonType: null`

## Phase 2: Read Model Compatibility Layer

### Objective

Centralize how the system interprets lesson content for both migrated and legacy lessons.

### Changes

- Refactor lesson loaders so content interpretation happens in one place.
- Add compatibility resolution:
  - migrated lessons use `lessonType`
  - legacy lessons infer type from attached content only for read paths

### Target files

- [`features/learning/lib/queries.ts`](../features/learning/lib/queries.ts)
- [`features/admin-cms/lib/load-admin-lesson-content.ts`](../features/admin-cms/lib/load-admin-lesson-content.ts)
- any lesson-related caching helpers

### Deliverables

- a normalized lesson workspace shape with:
  - `lessonType`
  - `isLegacy`
  - relevant content payload
  - optional compatibility warnings

### Safety checks

- student lesson page still renders old lessons
- admin lesson workspace still opens old lessons

## Phase 3: Renderer And Editor Registry

### Objective

Remove future dependency on large `switch`/`if` chains.

### Changes

- Introduce a typed registry/strategy layer for lesson types.
- Each lesson type definition should provide:
  - admin editor component
  - student renderer component
  - validation hooks/rules
  - optional empty-state component

### Target files

- new registry files, for example:
  - `features/learning/lib/lesson-type-registry.ts`
  - `features/admin-cms/lib/lesson-editor-registry.ts`
- shared lesson-type definition types

### Deliverables

- registry object or strategy map for:
  - `VIDEO`
  - `FLASHCARD`
  - `QUIZ`
  - `TEXT`

### Safety checks

- registry compiles even if some lesson types temporarily reuse existing components
- student/admin surfaces can resolve definitions without runtime branching explosion

## Phase 4: Admin Create/Edit Flow

### Objective

Make lesson type explicit at authoring time for new and updated lessons.

### Changes

- Add `lessonType` selector to lesson form.
- Update validation for create/update lesson actions.
- Ensure lesson metadata editing only shows relevant fields:
  - `VIDEO`: video URL + intro/body
  - `FLASHCARD`: metadata only
  - `QUIZ`: metadata only
  - `TEXT`: body only

### Target files

- [`features/admin-cms/components/admin-lesson-form.tsx`](../features/admin-cms/components/admin-lesson-form.tsx)
- [`features/admin-cms/actions/cms-lesson-actions.ts`](../features/admin-cms/actions/cms-lesson-actions.ts)
- lesson validation helpers if split out

### Deliverables

- new lessons can be created with explicit type
- existing lessons can be edited without forcing immediate migration if they are legacy

### Safety checks

- lesson CRUD still works
- module/lesson listing still works

## Phase 5: Admin Lesson Workspace Simplification

### Objective

Render only the relevant editor for the lesson type.

### Changes

- Refactor admin lesson workspace to use registry/strategy resolution.
- Hide irrelevant editing surfaces for migrated lessons.
- Preserve compatibility path for legacy mixed lessons.
- Add warning banner for legacy mixed-content lessons.

### Target files

- [`features/admin-cms/components/admin-lesson-workspace.tsx`](../features/admin-cms/components/admin-lesson-workspace.tsx)
- [`features/admin-cms/components/admin-lessons-page.tsx`](../features/admin-cms/components/admin-lessons-page.tsx)
- lesson content loader files

### Deliverables

- `VIDEO` lesson: info/video editor only
- `FLASHCARD` lesson: flashcard editor only
- `QUIZ` lesson: quiz builder only
- `TEXT` lesson: text editor only

### Safety checks

- material CRUD still works for flashcard lessons
- question CRUD still works for quiz lessons
- invalid content actions are blocked for wrong lesson type

## Phase 6: Student Lesson Workspace Simplification

### Objective

Remove dynamic tabs for migrated lessons and show one primary learning activity.

### Changes

- Refactor student lesson workspace to resolve renderer via registry.
- Migrated lessons:
  - `VIDEO` -> video player + intro/body
  - `FLASHCARD` -> flashcard deck
  - `QUIZ` -> quiz UI
  - `TEXT` -> article/reading
- Legacy lessons:
  - retain compatibility dynamic-tab path temporarily

### Target files

- [`features/learning/components/lesson-workspace.tsx`](../features/learning/components/lesson-workspace.tsx)
- reusable content components already in use:
  - `secure-lesson-video-player`
  - `flashcard-deck`
  - `lesson-quiz-panel`

### Deliverables

- migrated lessons no longer depend on dynamic tab logic
- empty state shown if a typed lesson has no usable content

### Safety checks

- student route loads without regressions
- protected video access still works
- legacy lessons still render

## Phase 7: Content Action Invariants

### Objective

Enforce domain rules so content mutations match lesson type.

### Changes

- Guard flashcard actions so they only operate on `FLASHCARD` lessons (or legacy lessons during migration).
- Guard lesson quiz actions so they only operate on `QUIZ` lessons (or legacy lessons during migration).
- Guard video/text updates so they only apply to valid lesson types.

### Target files

- [`features/admin-cms/actions/cms-material-actions.ts`](../features/admin-cms/actions/cms-material-actions.ts)
- [`features/admin-cms/actions/cms-question-actions.ts`](../features/admin-cms/actions/cms-question-actions.ts)
- lesson helpers introduced earlier

### Deliverables

- type-safe mutation boundaries
- explicit error messaging for invalid operations

### Safety checks

- tryout question flows remain unaffected
- admin receives clear feedback on invalid edits

## Phase 8: Legacy Migration Tooling

### Objective

Support safe migration of existing lessons without data loss.

### Changes

- Add backfill logic for unambiguous lessons:
  - video only
  - flashcard only
  - quiz only
  - text only
- Add visibility/reporting for mixed-content legacy lessons.
- Optionally add assisted migration tooling later if needed.

### Target files

- migration SQL / Prisma migration files
- optional script under `scripts/` or similar
- admin reporting surface if needed

### Deliverables

- simple legacy lessons classified automatically
- mixed lessons remain `lessonType = null`

### Safety checks

- no content deletion
- migration is idempotent or safely rerunnable where practical

## Phase 9: Testing

### Objective

Verify the refactor preserves behavior and enforces the new domain model.

### Test matrix

- Course CRUD
- Module CRUD
- Lesson CRUD
- Create `VIDEO` lesson
- Create `FLASHCARD` lesson
- Create `QUIZ` lesson
- Create `TEXT` lesson
- Flashcard editing on flashcard lesson
- Quiz editing on quiz lesson
- Student video lesson flow
- Student flashcard lesson flow
- Student quiz lesson flow
- Student text lesson flow
- Empty state for typed lesson with missing content
- Legacy lesson compatibility
- Validation errors for wrong-type content edits
- Tryout flows unaffected

### Suggested targets

- unit tests for lesson-type helpers and registry resolution
- integration tests for admin actions
- focused UI tests for student/admin lesson surfaces

## Phase 10: Documentation And Cleanup

### Objective

Keep architecture and rollout decisions synchronized with the codebase.

### Changes

- Update [`docs/LESSON_CONTENT_ARCHITECTURE.md`](./LESSON_CONTENT_ARCHITECTURE.md) if implementation differs from design.
- Document final registry layout and legacy support rules.
- Update progress tracking only if this work materially changes tracked feature status.

## Recommended Execution Order

```text
Phase 1  Domain foundations
Phase 2  Read-model compatibility layer
Phase 3  Renderer/editor registry
Phase 4  Admin create/edit flow
Phase 5  Admin lesson workspace
Phase 6  Student lesson workspace
Phase 7  Content action invariants
Phase 8  Legacy migration tooling
Phase 9  Testing
Phase 10 Documentation and cleanup
```

## Buildability Rule

Every phase must end in a buildable state.

That means:

- additive schema changes before destructive assumptions
- compatibility read paths before UI simplification
- registry introduction before removing old branching
- migration support before strict enforcement

## Open Decisions For Implementation

These do not block planning, but should be resolved explicitly during execution:

1. Exact location/name of shared lesson-type registry files.
2. Whether `TEXT` uses existing `Lesson.content` first, or gets a dedicated content record later.
3. Whether legacy mixed-content migration remains report-only or gets an assisted admin split flow in this iteration.
