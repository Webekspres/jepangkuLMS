# JLPT Tryout Question Bank — Prisma & Migration RFC

**Date:** 2026-07-10  
**Status:** Implemented (expand + backfill migration)

## Models (Phase 1)

| Model | Role |
|-------|------|
| `ListeningStimulus` | Choukai mondai: code, level, audio fields + `audioStartMs`/`audioEndMs`, shared image, instruction |
| `JlptQuestion` | Bank MCQ: code, level, `TryoutSectionCode`, optional `listeningStimulusId` |
| `JlptQuestionOption` | Options (text + optional image) |
| `TryoutSessionItem` | Session composition: XOR `jlptQuestionId` \| `listeningStimulusId` |
| `QuizAttempt.paperSnapshotJson` | Immutable paper at submit |

**Not created (YAGNI):** `TryoutSection` table, `AudioAsset` table, `TryoutPaper` table.

## Enums

- `TryoutSectionCode`: `MOJI_GOI` \| `BUNPOU_DOKKAI` \| `CHOKAI`
- `JlptBankStatus`: `DRAFT` \| `ACTIVE` \| `RETIRED`
- `JlptAnswerOptionKind`: `TEXT` \| `IMAGE`

## Migration sequence

1. **Expand** — `20260710120000_jlpt_tryout_question_bank` creates tables + backfills from legacy `Question` where `type=TRYOUT`.
2. **Dual-read** — `loadTryoutExamPaper` prefers `TryoutSessionItem`; falls back to legacy `Question.tryoutSessionId`.
3. **New writes** — bank CMS + composition + bank ZIP import write only new tables.
4. **Later drop** (not in this PR) — remove tryout columns from shared `Question` after all sessions composed.

## Backfill rules

- Preserve `Question.id` → `JlptQuestion.id` and option ids for `answersJson` continuity.
- Group Choukai by `audioGroupId` → one `ListeningStimulus`; solo audio → per-question stimulus.
- Moji/Bunpou → one `TryoutSessionItem` per question; Choukai → one item per stimulus.

## Apply

```bash
bun run db:migrate:deploy
# or local: bun run db:migrate
bun run db:generate
```
