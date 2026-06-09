# Fase 1 — Selesai (kode)

Lihat `jepangku-core/docs/PHASE0-PHASE1.md` § Fase 1.

## Implementasi LMS

| Item | Status |
|------|--------|
| `lib/core/gamification.ts` | ✅ |
| `lib/core/activity-map.ts` | ✅ |
| `features/learning/actions/learning-actions.ts` | ✅ |
| Admin gate `LMS_ADMIN` di `proxy.ts` | ✅ |
| Unit tests `tests/unit/core-integration.test.ts` | ✅ |

## Wire UI belajar (Fase 2 LMS)

Halaman `belajar/[courseSlug]/[lessonSlug]` masih stub — panggil `markLessonComplete` / `submitQuizAttempt` saat UI lesson siap.

## JWT public key

Jalankan dari Core (setelah private key valid):

```bash
cd jepangku-core && bun run jwt:sync-public-key-to-clients
```

Restart LMS dev server setelah sync.
