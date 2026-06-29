# 📋 JepangKu LMS — Progress Tracker

Living document untuk melacak apa yang sudah dikerjakan vs belum. **Single source of truth untuk URL:** [sitemap.md](../sitemap.md). **Arsitektur target:** [ARCHITECTURE.md](./ARCHITECTURE.md).

| Meta                      | Nilai                                                       |
| :------------------------ | :---------------------------------------------------------- |
| **Fase**                  | 1 (MVP)                                                     |
| **Target**                | Akhir Juni 2026                                             |
| **Base domain**           | `kursus.jepangku.com`                                       |
| **Terakhir diperbarui**   | 2026-06-29                                                  |
| **Arsitektur**            | [ECOSYSTEM.md](./ECOSYSTEM.md) — LMS + Core + Portal Berita |
| **Progres global Fase 1** | **90%** (63 item terlacak)                                  |

### Progres global

```text
[██████████████████░░] 90%
```

| Area                     | Bobot\* |     ✅ |    🟡 |    ⬜ |  % area |
| :----------------------- | ------: | -----: | ----: | ----: | ------: |
| Infrastruktur & platform |      16 |     12 |     4 |     0 |     85% |
| Halaman & routing        |      25 |     23 |     2 |     0 |     95% |
| Domain `features/`       |       8 |      7 |     1 |     0 |     92% |
| Data & integrasi         |       8 |      6 |     1 |     1 |     80% |
| Keamanan & bisnis        |       6 |      5 |     1 |     0 |     90% |
| **Total**                |  **63** | **53** | **9** | **1** | **90%** |

\*Jumlah baris terlacak di §1–§5 (🔮 Fase 2 tidak dihitung).

**Rumus:** `((✅ × 1) + (🟡 × 0,4) + (⬜ × 0)) ÷ total × 100` → `(53 + 3.6) ÷ 63 ≈ 90%`.

---

## Legenda status

| Simbol | Arti                                                 |
| :----: | :--------------------------------------------------- |
|   ✅   | **Selesai** — perilaku/fitur sesuai spesifikasi MVP  |
|   🟡   | **Sebagian** — ada tapi belum lengkap / mock parsial |
|   ⬜   | **Belum** — tidak ada implementasi bermakna          |
|   🔮   | **Fase 2** — sengaja di luar scope Fase 1            |

---

## Ringkasan cepat

| Area                     | Selesai | Sebagian | Belum |
| :----------------------- | ------: | -------: | ----: |
| Infrastruktur & platform |      12 |        4 |     0 |
| Halaman & routing        |      23 |        2 |     0 |
| Domain `features/`       |       7 |        1 |     0 |
| Data & integrasi         |       6 |        1 |     1 |
| Keamanan & bisnis        |       5 |        1 |     0 |

---

## 1. Infrastruktur & platform

| Item                                                   | Status | Catatan                                                      |
| :----------------------------------------------------- | :----: | :----------------------------------------------------------- |
| Next.js 16 App Router + React 19                       |   ✅   | `app/` + `features/`                                         |
| Tailwind CSS v4 + tema brand                           |   ✅   | `globals.css`, DESIGN.md                                     |
| Bun package manager                                    |   ✅   |                                                              |
| Prisma schema PostgreSQL LMS                           |   ✅   | + `LiveClass`, `TryoutSession`, `isFeatured`                 |
| `lib/prisma.ts` singleton                              |   ✅   |                                                              |
| `lib/core/` JWT + award XP                             |   🟡   | Dev OK; prod Core token belum diverifikasi penuh             |
| `proxy.ts` auth + admin gate                           |   ✅   | Clerk + Core JWT roles + LMS DB `LMS_ADMIN`                  |
| Auth Clerk sign-in/sign-up                             |   ✅   |                                                              |
| TanStack Query providers                               |   ✅   | Dipakai terbatas                                             |
| Zustand quiz store                                     |   🟡   | Ada; inline quiz di lesson workspace                         |
| Zod validasi                                           |   ✅   | `lib/validations/`                                           |
| Folder `features/` domain                              |   ✅   | learning, admin-cms, student, tryout, live-class, public-api |
| Shadcn UI primitif                                     |   🟡   | Cukup untuk MVP; tambah sesuai kebutuhan                     |
| Prisma seed N5 + tryout + live class + 8 badge starter |   ✅   | `prisma/seed.ts`, `public/badges/*.png`                      |
| Partner API v1                                         |   ✅   | `docs/PARTNER_API.md`                                        |
| `.env` / Clerk / DB                                    |   🟡   | Lokal OK; prod env tim                                       |

---

## 2. Halaman & routing (Fase 1)

### 2.1 Public & marketing

| Route                                          | Status | Catatan                                               |
| :--------------------------------------------- | :----: | :---------------------------------------------------- |
| `/`                                            |   🟡   | Landing lengkap; data marketing statis                |
| `/kursus`                                      |   ✅   | **Prisma** published + filter level/kategori/unggulan |
| `/kursus/[slug]`                               |   ✅   | **Prisma** detail + silabus dari modul DB             |
| `/tryout`                                      |   🟡   | Halaman info publik (bukan ujian interaktif)          |
| `/tentang`, `/cara-belajar`, `/hubungi`, legal |   ✅   |                                                       |

### 2.2 Auth

| Route                  | Status |
| :--------------------- | :----: |
| `/sign-in`, `/sign-up` |   ✅   |

### 2.3 Student `/dashboard/*`

| Route                                           | Status | Catatan                                                                                 |
| :---------------------------------------------- | :----: | :-------------------------------------------------------------------------------------- |
| `/dashboard`                                    |   ✅   | Continue learning + JLPT path + **XP mingguan real** + live preview                     |
| `/dashboard/kursus`, `/dashboard/kursus/[slug]` |   ✅   | Enrollment + pembayaran                                                                 |
| `/dashboard/belajar/...`                        |   ✅   | Video, materi, kuis inline + **Q&A DB (reply + @mention)**                              |
| `/dashboard/kuis/.../hasil`                     |   ✅   |                                                                                         |
| `/dashboard/leaderboard`                        |   ✅   | LMS poin + podium hierarki + mobile responsive                                          |
| `/dashboard/profil`                             |   ✅   | Hero + stats + edit (display name, avatar R2, badge title)                              |
| `/dashboard/achievements`                       |   ✅   | Badge LMS + **milestone JLPT dari enrollment**                                          |
| `/dashboard/live-class`                         |   ✅   | Jadwal live class dari DB                                                               |
| `/dashboard/tryout`                             |   ✅   | Pilih sesi + ujian per bagian (TOEFL-style) + analisa hasil                             |
| `/dashboard/tryout/[session]/[level]`           |   ✅   | Mode fokus: intro bagian → soal terisolasi → submit                                     |
| `/dashboard/tryout/hasil/[attemptId]`           |   ✅   | Popup animasi hasil + tier SOS/Latihan/Aman + tabel skor & analisa bagian + detail soal |

### 2.4 Admin

| Route                                      | Status | Catatan                                                                                                           |
| :----------------------------------------- | :----: | :---------------------------------------------------------------------------------------------------------------- |
| `/admin/dashboard`                         |   ✅   | Analytics enrollment, live class, tryout                                                                          |
| `/admin/live-class`                        |   ✅   | CRUD jadwal live class                                                                                            |
| `/admin/tryout`                            |   ✅   | CRUD sesi + CMS soal 3 bagian (MOJI GOI / BUNPOU DOKKAI / CHOKAI) + impor CSV/XLSX + upload audio R2 + grup audio |
| `/admin/pembayaran`                        |   ✅   | Enrollment PENDING/ACTIVE                                                                                         |
| `/admin/kursus` + modul + lesson workspace |   ✅   | CRUD + bank soal **per pelajaran**                                                                                |
| `/admin/kursus/import`                     |   ✅   | CSV kursus                                                                                                        |
| `/admin/quiz`                              |   ✅   | **Info page** — bank soal di lesson workspace ([ADMIN_QUIZ.md](./ADMIN_QUIZ.md))                                  |
| `/admin/quiz/import`                       |   ✅   | Redirect ke info quiz                                                                                             |

---

## 3. Domain fitur (`features/`)

| Domain           | Status | Catatan                                                                        |
| :--------------- | :----: | :----------------------------------------------------------------------------- |
| **learning**     |   ✅   | Enroll, progress, kuis, marketing queries                                      |
| **admin-cms**    |   ✅   | CRUD kursus/modul/lesson/enrollment/import                                     |
| **student**      |   ✅   | Dashboard, profil, achievements, loaders                                       |
| **tryout**       |   ✅   | Bagian terpisah + focus navbar + simpan jawaban + halaman analisa              |
| **live-class**   |   ✅   | Jadwal dari `LiveClass` model                                                  |
| **public-api**   |   ✅   | Partner katalog                                                                |
| **gamification** |   ✅   | Badge unlock rules + bonus XP Core, equip sebagai title, admin CMS unlock meta |
| **quiz-engine**  |   🟡   | Inline di lesson; bukan focus-mode terpisah                                    |

---

## 4. Data, seed & integrasi

| Item                                                                  | Status |
| :-------------------------------------------------------------------- | :----: | --------------------------------------------------------- |
| Schema Course/Module/Lesson/Materi/Question                           |   ✅   |
| Schema Enrollment, UserProgress, QuizAttempt                          |   ✅   |
| Schema LiveClass, TryoutSession                                       |   ✅   |
| Seed N5 + materi XLSX + tryout N5 Fase 1 + live class + badge starter |   ✅   |
| Marketing katalog dari Prisma                                         |   ✅   |
| Server Actions write paths                                            |   ✅   |
| Award XP ke Core                                                      |   🟡   | `verify:core-gamification` script; flashcard/tryout wired |
| News → Partner API wiring                                             |   ⬜   |

---

## 5. Keamanan & aturan bisnis

| Aturan                             | Status |
| :--------------------------------- | :----: | ----------------------------------------------------------------------------- |
| Route student memerlukan login     |   ✅   |
| Route admin memerlukan role admin  |   ✅   |
| Public read kursus/tryout info     |   ✅   |
| Secured video (enrolled only)      |   🟡   | API gate + player hardening; YouTube bukan DRM penuh                          |
| Enrollment gate lesson             |   ✅   |
| Rate Limiting (Middleware + Redis) |   🟡   | Dihapus dari `proxy.ts` (429 di staging); `lib/rate-limit/` tetap untuk nanti |

---

## 6. Backlog Fase 2 🔮

- Integrasi News Partner API v1
- Tryout semua level N4–N1 + sesi Fase 2–4 penuh
- Leaderboard global dari Core API

---

## Changelog

| Tanggal    | Perubahan                                                                                                                                                                                                                                                       |
| :--------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-06-29 | Rebalance ekonomi XP/Poin: SSOT `features/student/lib/gamification-rewards.ts` (XP flat & kecil sesuai kurva Core 50 XP/level, Poin ≈10× boleh skala performa); XP kuis/tryout di-decouple dari jumlah benar (anti lompat-level); bonus XP badge per-rarity (5/10/20/25); daily-login award XP                                  |
| 2026-06-29 | Halaman detail Live Class `/dashboard/live-class/[id]` (hero + status enrollment + timeline sesi real-time: Rekaman/Gabung Zoom/terjadwal); server action `requestLiveClassEnrollment` (gratis→ACTIVE, berbayar→PENDING + notif admin)                          |
| 2026-06-29 | Hybrid slug UX: util `generateSlug`/`sanitizeSlugWhileTyping`, auto-fill Judul→Kode di form tryout (editable, sanitasi onChange), sanitasi field slug lanjutan (course/module)                                                                                  |
| 2026-06-29 | Admin CMS polymorphic enrollment (pilih tipe produk Course/Live Class/Tryout + badge tipe di tabel); form tryout dapat harga (`priceIdr`) & toggle `isStrictTimeBound`; util `RupiahInput` auto-format ribuan untuk tryout & live class                          |
| 2026-06-26 | Hapus rate limiting middleware di `proxy.ts` — memblokir staging (shared IP + RSC request volume)                                                                                                                                                               |
| 2026-06-26 | Refactor profile photo cropping modal to be fully theme-adaptive; replace custom RPG loading screens with the standard JepangKu splash loading interface and enforce production fail-gate restrictions on core connection errors                                |
| 2026-06-26 | Implement deferred avatar upload flow to Cloudflare R2 on form save with client-side react-easy-crop editor, local object URL preview, memory leak cleanup, and z-index toaster layer adjustment                                                                |
| 2026-06-26 | Overhaul Jalur JLPT Saya stepper to an RPG-inspired adventure journey map with winding paths, Kamon-themed emblem nodes, radial progress rings, and a character dashboard stat sheet                                                                            |
| 2026-06-26 | Refactor copywriting halaman marketing & student dashboard, hapus Sesi Simulasi Mendatang di tryout, tambah avatar di welcome card, dan visual polish Live Class & Leaderboard                                                                                  |
| 2026-06-26 | Implementasi rate limiting di middleware (proxy.ts) dan Redis-ready client; fix bun:test type declarations error                                                                                                                                                |
| 2026-06-23 | Badge seed 8 PNG (`public/badges`), R2 fallback lokal + `use server` fix; grafik enrollment admin & XP mingguan (SimpleBarChart); seed idempotent re-run                                                                                                        |
| 2026-06-23 | XP mingguan dashboard (LmsXpEvent + WeeklyXpChart); video terproteksi via API enrollment gate; GA4 + GSC + panel admin Analytics                                                                                                                                |
| 2026-06-22 | Hasil tryout: popup reveal animasi (Riki-style), tabel ringkasan skor & analisa per bagian JLPT                                                                                                                                                                 |
| 2026-06-22 | Tryout TOEFL-flow: intro per bagian, navigator isolasi, focus navbar, auto-submit timer, QuizAttempt+answersJson, halaman analisa `/hasil/[id]`                                                                                                                 |
| 2026-06-18 | Wire `/kursus` marketing ke Prisma + filter unggulan; dashboard XP mingguan & live class real; achievements milestone real; halaman Live Class & JLPT Tryout; dokumentasi ADMIN_QUIZ; update tracker 72%                                                        |
| 2026-06-19 | R2 badge+avatar; CMS soal tryout; DnD urut modul/pelajaran; penamaan kurikulum UI-only; hapus Bank Soal sidebar                                                                                                                                                 |
| 2026-06-19 | Badge unlock (FIRST_LESSON/QUIZ/TRYOUT) + bonus XP Core, equip badge sebagai title, LmsRole LMS_ADMIN/STUDENT + `/admin/users`, profil LMS (displayName/avatar), lint CI bersih                                                                                 |
| 2026-06-19 | Gamifikasi: Core XP+poin unified, XP mingguan real (LmsXpEvent), badge CMS admin+R2, Q&A DB, leaderboard podium UI, UAT checklist, verify:core-gamification                                                                                                     |
| 2026-06-18 | UI polish: hero elliptic rounded bottom; MarketingPageHero dark navy di semua halaman publik; logo selalu berwarna (nav/footer/auth); fix navbar height glitch; CTA banner bg match pricing; Q&A section di lesson workspace; redesign & edit profil page siswa |
| 2026-06-05 | `CORE_INTEGRATION_STATUS.md` blocker Core 500                                                                                                                                                                                                                   |
| 2026-06-03 | Dokumen awal progress tracker                                                                                                                                                                                                                                   |
