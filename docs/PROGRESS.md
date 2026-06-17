# 📋 JepangKu LMS — Progress Tracker

Living document untuk melacak apa yang sudah dikerjakan vs belum. **Single source of truth untuk URL:** [sitemap.md](../sitemap.md). **Arsitektur target:** [ARCHITECTURE.md](./ARCHITECTURE.md).

| Meta | Nilai |
| :--- | :--- |
| **Fase** | 1 (MVP) |
| **Target** | Akhir Juni 2026 |
| **Base domain** | `kursus.jepangku.com` |
| **Terakhir diperbarui** | 2026-06-05 |
| **Arsitektur** | [ECOSYSTEM.md](./ECOSYSTEM.md) — LMS + Core + Portal Berita |
| **Progres global Fase 1** | **40%** (59 item terlacak) |

### Progres global

```text
[████████░░░░░░░░░░░░] 40%
```

| Area | Bobot* | ✅ | 🟡 | ⬜ | % area |
| :--- | ---: | ---: | ---: | ---: | ---: |
| Infrastruktur & platform | 18 | 5 | 10 | 3 | 47% |
| Halaman & routing | 23 | 0 | 23 | 0 | 40% |
| Domain `features/` | 4 | 0 | 1 | 3 | 10% |
| Data & integrasi | 8 | 4 | 0 | 4 | 50% |
| Keamanan & bisnis | 5 | 0 | 1 | 4 | 8% |
| **Total** | **59** | **10** | **34** | **15** | **40%** |

\*Jumlah baris terlacak di §1–§5 (🔮 Fase 2 tidak dihitung).

**Rumus:** `((✅ × 1) + (🟡 × 0,4) + (⬜ × 0)) ÷ total × 100` → `(10 + 13,6) ÷ 59 ≈ 40%`.  
🟡 = scaffold / sebagian (40% poin); ✅ = sesuai MVP penuh. Setelah ubah status, **hitung ulang** baris Total & persen global di atas.

---

## Legenda status

| Simbol | Arti |
| :---: | :--- |
| ✅ | **Selesai** — perilaku/fitur sesuai spesifikasi MVP (bukan hanya file ada) |
| 🟡 | **Sebagian** — route/file ada, UI stub, atau logika belum terhubung DB/auth |
| ⬜ | **Belum** — tidak ada implementasi bermakna |
| 🔮 | **Fase 2** — sengaja di luar scope Fase 1 ([sitemap.md](../sitemap.md)) |

---

## Ringkasan cepat

| Area | Selesai | Sebagian | Belum |
| :--- | ---: | ---: | ---: |
| Infrastruktur & platform | 4 | 9 | 3 |
| Halaman & routing (23) | 0 | 23 | 0 |
| Domain `features/` | 0 | 2 | 2 |
| Data & integrasi | 1 | 2 | 4 |

**Ringkasan:** Fondasi schema & tooling ada; mayoritas halaman masih stub; auth, `features/`, dan integrasi DB belum. Lihat **Progres global** di atas untuk persentase terkini.

---

## 1. Infrastruktur & platform

| Item | Status | Catatan |
| :--- | :---: | :--- |
| Next.js 16 App Router + React 19 | ✅ | `app/` terstruktur sesuai sitemap |
| Tailwind CSS v4 + tema brand (`globals.css`) | ✅ | Palet JepangKu + Shadcn semantic tokens |
| Bun sebagai package manager | ✅ | `bun dev`, dll. |
| Prisma schema (PostgreSQL LMS) | ✅ | Kursus, kuis, progress; `User` jangkar (`id` = Core user id); gamifikasi **dihapus** dari schema lokal |
| Integrasi `lib/core/` (JWT claims + API) | 🟡 | `jwt-claims.ts`, `session.ts`; verify JWT & `getCoreSession()` belum; leaderboard/award via API |
| `lib/prisma.ts` singleton | ✅ | Client siap dipakai RSC/Server Actions |
| `proxy.ts` (ganti middleware) | 🟡 | Daftar public path ada; **belum** Clerk auth / redirect logged-in user / role ADMIN |
| Auth / SSO (JWT + claims dari Core) | ⬜ | Keputusan: profil/XP/roles di **JWT claims**; LMS verify token + upsert `User` jangkar; sign-in stub |
| Webhook `/api/webhooks/clerk` di LMS | 🟡 | Legacy stub — **target sync user di Core**; LMS hanya perlu FK jangkar jika diperlukan |
| TanStack Query | 🟡 | `AppProviders` di `app/layout.tsx`; `getQueryClient`, `queryKeys`; **belum** `useQuery` di features |
| Zustand (quiz store) | 🟡 | `zustand@5` terpasang; `useQuizStore` + selectors di `features/quiz-engine/store/`; **belum** dipakai di UI `/kuis` |
| Zod validasi | 🟡 | `zod@4` + `lib/validations/` (shared schemas, `parseInput`); skema per-domain di `features/*/schemas/` belum |
| Folder `features/` (domain logic) | 🟡 | `features/quiz-engine/store/` ada; domain lain & actions/components belum |
| `components/layout/` (sidebar dashboard) | ⬜ | Belum ada |
| Shadcn UI primitif lengkap | 🟡 | Hanya `button`; komponen lain perlu `shadcn add` sesuai kebutuhan |
| Prisma seed (kursus, soal N5 CSV) | ⬜ | `bun run db:seed` ada; **`prisma/seed.ts` belum** |
| `.env` / Clerk / DB production-ready | 🟡 | [`.env.example`](../.env.example) + README; isi `.env` lokal & kredensial Clerk per tim |
| Landing redirect `/` → `/dashboard` jika login | ⬜ | Bagian dari proxy + Clerk |

---

## 2. Halaman & routing (Fase 1)

Status per **route**. "Sebagian" = `page.tsx` ada (biasanya judul + paragraf placeholder).

### 2.1 Public & marketing

| Route | Sitemap | Status | Yang masih kurang |
| :--- | :--- | :---: | :--- |
| `/` | Landing + Hero, fitur, pricing CTA | 🟡 | UI landing kuat (brand); **belum** section pricing/WhatsApp; **belum** redirect user login ke dashboard |
| `/kursus` | Katalog + filter JLPT | 🟡 | Stub; **belum** query Prisma, filter, kartu kursus |
| `/kursus/[courseSlug]` | Detail + silabus preview + CTA | 🟡 | Stub slug; **belum** data kursus, silabus locked, CTA auth |
| `/tryout` | Info tryout + CTA | 🟡 | Stub |

### 2.2 Auth (Clerk)

| Route | Status | Yang masih kurang |
| :--- | :---: | :--- |
| `/sign-in` | 🟡 | Integrasi `<SignIn />` Clerk + Google OAuth |
| `/sign-up` | 🟡 | Integrasi `<SignUp />` + role STUDENT default di DB |

### 2.3 Student `*` (login required)

| Route | Status | Yang masih kurang |
| :--- | :---: | :--- |
| `/dashboard` | 🟡 | XP ringkasan, continue learning, shortcut leaderboard/tryout |
| `/belajar/[courseSlug]/[lessonSlug]` | 🟡 | Konten materi, video embed, Mark as Complete |
| `/kuis/[lessonSlug]` | 🟡 | Engine MCQ N5, navigasi soal, Zustand jawaban |
| `/kuis/[lessonSlug]/hasil` | 🟡 | Skor, pembahasan, trigger XP |
| `/leaderboard` | 🟡 | Top 10 + highlight posisi user |
| `/gamifikasi/profil-saya` | 🟡 | Grafik XP, log XP, galeri badge locked/unlocked |

**Catatan:** Route group siswa ada di `app/(student)/` — URL publik tetap `/dashboard/*`.

### 2.4 Admin `***`

| Route | Status | Yang masih kurang |
| :--- | :---: | :--- |
| `/admin/dashboard` | 🟡 | Statistik: siswa aktif, jumlah kursus, pembayaran pending |
| `/admin/pembayaran` | 🟡 | Tabel antrean + Approve & Enroll |
| `/admin/kursus` | 🟡 | Daftar kursus CRUD |
| `/admin/kursus/form` | 🟡 | Form buat/edit kursus |
| `/admin/lesson` | 🟡 | Daftar lesson filter by kursus |
| `/admin/lesson/form` | 🟡 | Form lesson + embed video |
| `/admin/quiz` | 🟡 | Daftar kuis/soal |
| `/admin/quiz/import` | 🟡 | Upload CSV/Excel bank soal |

**Catatan schema:** Sitemap menyebut antrean pembayaran WhatsApp; model **`PaymentRequest` (atau setara) belum ada** di `prisma/schema.prisma` — hanya `Enrollment` PENDING/ACTIVE. Perlu keputusan tim: extend schema vs map ke Enrollment saja.

### 2.5 Halaman statis

| Route | Status | Yang masih kurang |
| :--- | :---: | :--- |
| `/tentang` | 🟡 | Konten final + layout konsisten landing |
| `/cara-belajar` | 🟡 | Panduan XP/level/belajar |
| `/hubungi` | 🟡 | Link WhatsApp admin |

---

## 3. Domain fitur (`features/`)

Target struktur: `actions/`, `components/`, `store/` (jika perlu).

| Domain | Folder | Server actions (rencana) | UI / state (rencana) | Status |
| :--- | :--- | :--- | :--- | :---: |
| **gamification** | `features/gamification/` | Client ke **Core** (bukan Prisma XP lokal) | `LeaderboardTable`, `LevelProgressBar` | 🟡 |
| **learning** | `features/learning/` | `completeLesson`, `getCourseContent` | `VideoPlayer`, `SilabusAccordion` | ⬜ |
| **quiz-engine** | `features/quiz-engine/` | `submitQuizAttempt` | `QuizWorkspace`, `QuestionCard`, `useQuizStore` | 🟡 |
| **admin-cms** | `features/admin-cms/` | `approvePayment`, `uploadExcelMateri`, CRUD kursus/lesson | Tabel CMS, form import | ⬜ |

---

## 4. Data, seed & integrasi

| Item | Status | Catatan |
| :--- | :---: | :--- |
| Schema: `User` jangkar (`id` String, Core user id) | ✅ | Tanpa email/nama/XP lokal |
| Schema: Course, Lesson, materials (Kanji/Kosakata/Tata Bahasa) | ✅ | |
| Schema: Question + QuestionOption, QuizAttempt | ✅ | |
| Schema: UserProgress, Enrollment | ✅ | |
| Seed data kursus N5 + soal dari CSV | ⬜ | |
| RSC: Prisma read di halaman publik/katalog | ⬜ | |
| Server Actions: write paths | ⬜ | |
| Event XP ke Core setelah kuis/lesson | ⬜ | Via API Core (kontrak TBD), bukan `UserStat` LMS |
| Leaderboard dari Core API | ⬜ | JWT untuk user aktif; top-N via API |

---

## 5. Keamanan & aturan bisnis

| Aturan | Status |
| :--- | :---: |
| Route student `*` memerlukan login | ⬜ |
| Route `/admin/*` memerlukan role ADMIN | ⬜ |
| Public read `/kursus`, `/tryout` tanpa login | 🟡 (proxy allowlist saja) |
| Secured video embed (hanya enrolled) | ⬜ |
| Siswa hanya akses lesson kursus yang di-enroll | ⬜ |

---

## 6. Backlog Fase 2 🔮

Item di luar MVP Juni 2026 (jangan di-track sebagai blocker Fase 1):

- Portal berita `jepangku.com` (di luar scope LMS ini)
- Fitur bertanda `[FASE 2]` di sitemap (jika ditambahkan later)
- Tryout JLPT penuh sebagai mode ujian terpisah (schema `Question.type = TRYOUT` sudah disiapkan; UI tryout MVP masih info page)

---

## 7. Blokir / risiko saat ini

> **Integrasi Core (2026-06-05):** Detail blocker, keputusan Clerk-only sementara, dan rencana dev LMS tanpa Core → **[CORE_INTEGRATION_STATUS.md](./CORE_INTEGRATION_STATUS.md)**.

1. **Core JWT exchange production** — `POST /api/v1/auth/token` mengembalikan 500; gamifikasi real menunggu tim Core. Login LMS **tidak** diblokir (Clerk-only).
2. **Verify JWT di LMS** — layer ada (`lib/core/verify-jwt.ts`); data XP bergantung exchange Core sukses.
3. **Clerk di ekosistem** — LMS & Portal Berita sama-sama Clerk-first; jangan duplikasi profil penuh di DB LMS.
4. **`features/` minimal** — refactor ke domain sebelum logic membesar di `app/`.
5. **Tidak ada seed** — kuis & demo belajar tidak bisa diuji end-to-end.
6. **Model pembayaran** — kejelasan entitas "request pembayaran" vs `Enrollment` saja.

---

## Cara memperbarui dokumen ini

1. Setelah menyelesaikan satu slice vertikal (mis. "Leaderboard read-only"), ubah baris terkait dari ⬜/🟡 → ✅.
2. Update tanggal **Terakhir diperbarui** di header.
3. **Hitung ulang progres global:** sesuaikan hitungan ✅/🟡/⬜ per area, % area, Total, bar ASCII, dan **Progres global Fase 1** di meta (rumus di § Progres global).
4. Tambahkan baris singkat di **Changelog** di bawah.
5. Jika menambah route baru, update [sitemap.md](../sitemap.md) dulu, lalu tambah baris di §2 (dan masukkan ke hitungan global).
6. Jangan tandai ✅ hanya karena file `page.tsx` ada — harus memenuhi kolom "Yang masih kurang" kosong atau ditandai sengaja deferred.

---

## Changelog

| Tanggal | Perubahan |
| :--- | :--- |
| 2026-06-03 | Dokumen awal: baseline audit routing, schema, infra vs sitemap Fase 1 |
| 2026-06-03 | Zustand: `bun add zustand`, `useQuizStore` + selectors di `features/quiz-engine/store/` |
| 2026-06-03 | Zod: `bun add zod`, shared schemas + `parseInput` di `lib/validations/` |
| 2026-06-03 | TanStack Query: `AppProviders` di root layout, `lib/query-client`, `lib/query-keys` |
| 2026-06-03 | Progres global 40% + rumus & tabel per area di header PROGRESS |
| 2026-06-03 | Tambah `.env.example`; perbaiki `.gitignore` agar template bisa di-commit |
| 2026-06-03 | Arsitektur ekosistem: `docs/ECOSYSTEM.md`, `lib/core/`, schema `User` jangkar, gamifikasi ke Core |
| 2026-06-03 | Draft ERD Core normalized: `docs/CORE_ERD.md` (handoff Sultan) |
| 2026-06-03 | Keputusan JWT claims: docs + `lib/core/jwt-claims.ts`, `session.ts` |
| 2026-06-03 | Core schema v2 di repo `jepangku-core/docs/` |
| 2026-06-09 | Hapus duplikat schema LMS; canonical → `jepangku-core/docs/` |
| 2026-06-05 | `CORE_INTEGRATION_STATUS.md`: blocker Core 500, Clerk-only sementara, checklist dev LMS + handoff Core |
