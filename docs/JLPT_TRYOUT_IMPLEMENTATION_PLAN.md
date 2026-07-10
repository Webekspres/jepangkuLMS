# JLPT Tryout — Implementation Plan (Paket Soal)

Living tracker for the JLPT Tryout domain: reusable Question Bank + **Paket Soal** authoring + session events + ListeningStimulus.

| Meta | Value |
| :--- | :--- |
| **Architecture SSOT** | Paket Soal final design (Cursor plan: *JLPT Question Set Review*) |
| **Scope** | JLPT Tryout only — Course / Lesson / Module / Enrollment / Core gamification untouched |
| **CBT UX** | One question per page (unchanged) |
| **Sections (fixed)** | `MOJI_GOI` · `BUNPOU_DOKKAI` · `CHOKAI` |
| **Current phase** | **Paket Soal shipped** — dual-read + drop `TryoutSessionItem` deferred |
| **Last updated** | 2026-07-10 |

### Related docs

| Doc | Role |
| :--- | :--- |
| [JLPT_BANK_IMPORT_SPEC.md](./JLPT_BANK_IMPORT_SPEC.md) | ZIP = one Paket; workbook + assets |
| [JLPT_TRYOUT_CMS_IA.md](./JLPT_TRYOUT_CMS_IA.md) | Admin routes / roles |
| [JLPT_CHOKAI_TIMESTAMP_SEEK.md](./JLPT_CHOKAI_TIMESTAMP_SEEK.md) | Seek playback + Safari/CBR notes |
| [PROGRESS.md](./PROGRESS.md) | Global LMS Fase 1 tracker |
| [sitemap.md](../sitemap.md) | URL SSOT |

---

## Status legend

| Symbol | Meaning |
| :---: | :--- |
| ✅ | Done and wired (schema / code / route) |
| 🟡 | Partial — dual-read, polish, or device QA remaining |
| ⬜ | Not started |
| 🔮 | Explicitly later (YAGNI) |

---

## Where we are now

```text
Phase 0 ████████████ Architecture / YAGNI                 ✅
Phase 1 ████████████ Bank + stimulus + paper runtime      ✅
Phase 2 ████████████ Legacy write cutover                 ✅ (column drop later)
Paket   ████████████ JlptQuestionSet authoring model      ✅
Cleanup ░░░░░░░░░░░░ Drop SessionItem / legacy Question   ⬜
Phase 3 ░░░░░░░░░░░░ Detach Q / analytics / AI            🔮
```

---

## Aggregate model (locked)

```text
Bank (atoms) → Paket Soal (JlptQuestionSet) → TryoutSession (event) → Attempt (+ snapshot)
```

| Gate | Rule |
| :--- | :--- |
| DRAFT → READY | ≥1 valid item; empty sections OK |
| Session → isActive | READY + level match + all 3 sections non-empty |
| Soft lock | Active sessions → block item edits / ZIP replace; Duplicate asks admin for new code |

---

## Schema & runtime

| Item | Status | Location |
| :--- | :---: | :--- |
| `JlptQuestionSet` + `JlptQuestionSetItem` | ✅ | `prisma/schema.prisma` |
| `TryoutSession.questionSetId` | ✅ | Restrict FK |
| Migration + backfill `MIG-{session.code}` | ✅ | `20260710140000_jlpt_question_set` |
| Paper loader: set → session items → legacy | ✅ | `load-tryout-exam-paper.ts` |
| `paperSnapshotJson` on submit | ✅ | unchanged |
| Seed → `N5-PKG-SEED` + session FK | ✅ | `seed-tryout.ts` |
| Drop `TryoutSessionItem` | ⬜ | after verification |
| Drop legacy tryout columns on `Question` | ⬜ | after verification |

---

## Admin CMS

| Item | Status | Route / file |
| :--- | :---: | :--- |
| Bank list (atoms) | ✅ | `/admin/tryout/bank` |
| Paket list / detail / form / import | ✅ | `/admin/tryout/paket*` |
| ZIP → upsert bank + replace package | ✅ | `import-jlpt-bank-zip.ts` |
| Session form package dropdown | ✅ | completeness badge |
| Activate gate (3 sections) | ✅ | `validateSessionActivate` |
| Soft lock + Duplicate (admin code) | ✅ | paket actions |
| `/susun` redirect | ✅ | → paket |
| Session-item compose writes frozen | ✅ | compose actions |
| Nav: Bank + Paket | ✅ | `admin-nav-config.ts` |

---

## Phase 3+ (not this ship)

| Item | Status |
| :--- | :---: |
| Detach / Duplicate Question (atom fork) | 🔮 |
| Multi-package ZIP | 🔮 |
| `AudioAsset` table | 🔮 |
| Analytics / AI authoring | 🔮 |

---

## Admin workflow

```text
ZIP (Paket sheet) → /admin/tryout/paket/import
  → review paket → READY
  → session form picks paket
  → activate (3/3) → students exam
```

---

## Changelog

| Date | What |
| :--- | :--- |
| 2026-07-10 | Phase 1 bank + Phase 2 legacy write cutover |
| 2026-07-10 | **Paket Soal:** schema, dual-read loader, CMS paket, ZIP→package, activate gate, retire `/susun` |
