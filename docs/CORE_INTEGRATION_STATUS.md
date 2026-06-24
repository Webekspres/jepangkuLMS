# 🔗 Core Integration — Status & Development Plan

Living document untuk melacak **integrasi JepangKu Core** di repo LMS: masalah saat ini, keputusan sementara, dan apa yang boleh dikerjakan **tanpa menunggu Core production siap**.

| Meta | Nilai |
| :--- | :--- |
| **Status integrasi** | 🟢 **Dev lokal OK** — Clerk gate + Core JWT exchange; 🟡 prod Core token belum diverifikasi |
| **Terakhir diperbarui** | 2026-06-09 |
| **Tim terkait** | Kris (LMS), Sultan (Core), Habibi (Portal Berita) |
| **Dokumen arsitektur target** | [ECOSYSTEM.md](./ECOSYSTEM.md), [CORE_ERD.md](./CORE_ERD.md) |

---

## 1. Ringkasan status

| Lingkungan | Core JWT exchange | Catatan |
| :--- | :--- | :--- |
| **Dev lokal** | ✅ `POST /api/auth/core-token` → 200 | Core `:8080`, satu instance saja |
| **Production** | ⏳ belum diverifikasi | Pastikan `JWT_PRIVATE_KEY` prod ↔ public key LMS |

**Pola UX:** Clerk-only gate — gagal Core tidak memblokir dashboard. Sukses exchange → cookie `jepangku_core_jwt` + refresh UI.

**Blocker prod historis:** `POST https://core.jepangku.com/api/v1/auth/token` → 500 (`JWT_PRIVATE_KEY` / deploy). Dev sudah diperbaiki; prod butuh deploy modul auth terbaru + sync public key.

---

## 2. Portal Berita & LMS (2026-06-09)

| Topik | Keputusan |
| :--- | :--- |
| Auth login | **Clerk saja** — Core JWT tidak wajib untuk gate |
| Integrasi Core | **Fase 1+3 coded** di News & LMS — lihat [`jepangku-core/docs/PHASE0-PHASE1.md`](../../jepangku-core/docs/PHASE0-PHASE1.md) |
| Sync user | News: profil JIT; LMS: anchor FK (`User.id` = Clerk ID) |
| Pola bersama | **Clerk-first + Core best-effort** (non-blocking) |

Kedua app memakai **satu Clerk application** (`knowing-ghost-18`).

---

## 3. Arsitektur auth — target vs implementasi saat ini

### Target jangka panjang (ekosistem)

```text
Clerk login → Core POST /auth/token → Core JWT (claims: XP, level, roles)
    → LMS verify JWT → UI profil/gamifikasi dari claims + Core API
```

### Implementasi sementara (2026-06-05)

```text
Clerk login → /dashboard (langsung, tanpa gate Core)
    │
    ├─► Identitas UI: Clerk (nama, avatar)
    │
    ├─► Data belajar: PostgreSQL LMS (Prisma) — DAPAT Dikerjakan sekarang
    │
    └─► Background (non-blocking):
            CoreSessionSync → POST /api/auth/core-token → Core /auth/token
            Sukses  → cookie jepangku_core_jwt + refresh UI
            Gagal   → diabaikan; user tetap pakai LMS
```

### Perbandingan alur yang pernah dicoba

| | Alur lama (diblokir) | Alur sekarang |
| :--- | :--- | :--- |
| Gate login | Clerk **+** Core JWT wajib | **Clerk saja** |
| Gagal Core | User stuck di `/auth/complete` | Dashboard tetap terbuka |
| Portal Berita | Tidak pernah gate Core | Selaras dengan LMS sekarang |

---

## 4. Batas tanggung jawab — apa di Core vs LMS

| Domain | Sumber data | Status integrasi |
| :--- | :--- | :--- |
| Login / session gate | **Clerk** | ✅ Aktif (`proxy.ts`) |
| Nama, avatar tampilan | **Clerk** (sementara) / Core claims (nanti) | ✅ Clerk |
| Kursus, lesson, materi | **DB LMS** | ⬜ Backend belum terhubung UI |
| Enrollment, progress, quiz | **DB LMS** | ⬜ Backend belum terhubung UI |
| XP, level, poin, badge | **Core** | 🟢 Dev: JWT claims; prod ⏳ |
| Leaderboard global | **Core API** | 🟡 Public top-N; user stats butuh JWT |
| Award XP setelah kuis/lesson | **Core API** | ✅ `learning-actions.ts` → `awardCoreXp()` |

Model `User` di Prisma LMS tetap **jangkar FK** (`id` = Clerk User ID), bukan sumber profil:

```prisma
model User {
  id        String   @id // Clerk User ID
  createdAt DateTime @default(now())
  // enrollments, progress, attempts ...
}
```

Upsert jangkar: `lib/auth/sync-user-anchor.ts` (dipanggil saat Core token exchange sukses; perlu juga dipanggil dari server actions LMS saat fitur belajar aktif).

---

## 5. File kode terkait integrasi Core

| File | Peran |
| :--- | :--- |
| `proxy.ts` | Gate **Clerk-only** untuk `/dashboard`, `/admin` |
| `app/api/auth/core-token/route.ts` | Proxy Clerk → Core `/api/v1/auth/token`; set cookie JWT |
| `features/auth/components/core-session-sync.tsx` | Background sync setelah login |
| `app/(authentication)/auth/complete/page.tsx` | Halaman retry manual (opsional) |
| `lib/core/api.ts` | Client leaderboard, badges, users/me |
| `lib/core/verify-jwt.ts` | Verifikasi Core JWT dengan public key |
| `features/student/lib/load-student-core-data.ts` | Loader data gamifikasi untuk dashboard |
| `lib/auth/sync-user-anchor.ts` | Upsert `User` jangkar di DB LMS |

Env (lihat `.env.example`):

| Variabel LMS | Pasangan Core |
| :--- | :--- |
| `JEPANGKU_CORE_API_URL` | Base URL Core |
| `JEPANGKU_CORE_JWT_PUBLIC_KEY` | Pasangan `JWT_PRIVATE_KEY` Core |
| `JEPANGKU_CORE_JWT_ISSUER` | `JWT_ISSUER` |
| `JEPANGKU_CORE_JWT_AUDIENCE` | `JWT_AUDIENCE` |
| `JEPANGKU_CORE_SERVICE_TOKEN` | `CORE_SERVICE_TOKEN` (award XP nanti) |

---

## 6. Rencana pengembangan LMS (tanpa menunggu Core)

**Prinsip:** Fitur belajar **tidak boleh** bergantung pada Core JWT. Gamifikasi Core di-wire sebagai **best-effort**; saat gagal, UX tetap usable.

### Prioritas backend LMS (checklist)

| # | Slice | Scope | Status |
| :---: | :--- | :--- | :---: |
| 1 | **Seed** | `prisma/seed.ts` — kursus N5, lesson, soal contoh | ⬜ |
| 2 | **User jangkar JIT** | Upsert `User` pada enrollment / progress pertama | ⬜ |
| 3 | **Katalog publik** | `/kursus`, `/kursus/[slug]` baca Prisma | ⬜ |
| 4 | **Enrollment** | Request akses + status PENDING/ACTIVE | ⬜ |
| 5 | **Belajar** | `/belajar/...` konten + Mark complete → `UserProgress` | ⬜ |
| 6 | **Kuis** | Engine MCQ + `QuizAttempt` lokal | ⬜ |
| 7 | **Dashboard** | "Lanjutkan belajar" dari progress real (bukan mock) | ⬜ |
| 8 | **Admin CMS** | CRUD kursus/lesson/soal, approve enrollment | ⬜ |
| 9 | **Award XP → Core** | Panggil Core API setelah kuis/lesson; idempotency key | ⬜ |

Centang baris di atas saat slice selesai end-to-end (DB + server action + UI minimal).

### Yang sengaja ditunda sampai Core stabil

- Gate wajib Core JWT di middleware
- XP/poin/badge akurat di dashboard (bisa placeholder)
- Award XP production (bisa log + TODO dulu)
- Role ADMIN dari Core claims

---

## 7. Checklist tim Core (Sultan)

Untuk menutup blocker integrasi:

- [ ] Cek log production pada `POST /api/v1/auth/token` saat Clerk session valid
- [ ] Pastikan `JWT_PRIVATE_KEY` production **berpasangan** dengan `JEPANGKU_CORE_JWT_PUBLIC_KEY` di LMS
- [ ] Deploy modul auth terbaru (`JWT_SIGN_FAILED`, `syncClerkUserById`, `normalizePem()` jika ada)
- [ ] Verifikasi manual: Clerk token → 200 + JWT dengan claims `jepangku.*`
- [ ] Konfirmasi ke tim LMS: exchange sukses di staging/production

Setelah checklist ini hijau, LMS bisa mengaktifkan kembali **opsi** gate Core (jika diinginkan) tanpa mengubah schema belajar lokal.

---

## 8. Testing integrasi Core

| Test | Cara | Ekspektasi saat Core belum fix |
| :--- | :--- | :--- |
| Login Clerk | Google OAuth via ngrok/dev | ✅ Dashboard terbuka |
| Core token | DevTools → `POST /api/auth/core-token` | ❌ 503/500 setelah retry |
| Leaderboard publik | Halaman `/dashboard/leaderboard` | 🟡 Top-N mungkin tampil; stat user 0 |
| Belajar lokal | Setelah slice #5 selesai | ✅ Tanpa Core |

Lihat juga [TESTING.md](./TESTING.md) — E2E auth saat ini fokus UI, bukan login Core penuh.

---

## 9. Dokumen terkait

| Dokumen | Isi |
| :--- | :--- |
| [PROGRESS.md](./PROGRESS.md) | Progres global Fase 1 MVP |
| [ECOSYSTEM.md](./ECOSYSTEM.md) | Batas LMS / Core / Berita (target) |
| [jepangku-core/docs/](../../jepangku-core/docs/) | Schema & API canonical Core |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Struktur folder & data flow LMS |

---

## Changelog

| Tanggal | Perubahan |
| :--- | :--- |
| 2026-06-05 | Dokumen awal: blocker Core 500, Clerk-only sementara, konfirmasi Portal Berita, checklist dev LMS + handoff Core |
