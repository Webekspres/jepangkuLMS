# 📋 JepangKu LMS — Progress Tracker

Living document untuk melacak apa yang sudah dikerjakan vs belum. **Single source of truth untuk URL:** [sitemap.md](../sitemap.md). **Arsitektur target:** [ARCHITECTURE.md](./ARCHITECTURE.md).

| Meta                      | Nilai                                                       |
| :------------------------ | :---------------------------------------------------------- |
| **Fase**                  | 1 (MVP)                                                     |
| **Target**                | Akhir Juni 2026                                             |
| **Base domain**           | `kursus.jepangku.com`                                       |
| **Terakhir diperbarui**   | 2026-07-22                                                  |
| **Arsitektur**            | [ECOSYSTEM.md](./ECOSYSTEM.md) — LMS + Core + Portal Berita |
| **Progres global Fase 1** | **90%** (65 item terlacak)                                  |

### Progres global

```text
[██████████████████░░] 90%
```

| Area                     | Bobot\* |     ✅ |    🟡 |    ⬜ |  % area |
| :----------------------- | ------: | -----: | ----: | ----: | ------: |
| Infrastruktur & platform |      16 |     12 |     4 |     0 |     85% |
| Halaman & routing        |      27 |     24 |     3 |     0 |     93% |
| Domain `features/`       |       8 |      7 |     1 |     0 |     92% |
| Data & integrasi         |       8 |      7 |     0 |     1 |     87% |
| Keamanan & bisnis        |       6 |      5 |     1 |     0 |     90% |
| **Total**                |  **65** | **55** | **9** | **1** | **90%** |

\*Jumlah baris terlacak di §1–§5 (🔮 Fase 2 tidak dihitung).

**Rumus:** `((✅ × 1) + (🟡 × 0,4) + (⬜ × 0)) ÷ total × 100` → `(55 + 3.6) ÷ 65 ≈ 90%`.

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
| Halaman & routing        |      24 |        3 |     0 |
| Domain `features/`       |       7 |        1 |     0 |
| Data & integrasi         |       7 |        0 |     1 |
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
| Folder `features/` domain                              |   ✅   | learning, admin-cms, student, tryout, live-class, kana, public-api |
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
| `/kursus`                                      |   ✅   | **Prisma** published + filter; teaser Live Class & Tryout (cover + Lihat Detail → `/sign-up`) |
| `/kursus/[slug]`                               |   ✅   | Detail marketing + CTA Daftar/Masuk; login → dashboard detail |
| `/tryout`                                      |   🟡   | Halaman info publik (bukan ujian interaktif)          |
| `/tes-penempatan`                              |   🟡   | Halaman info publik (bukan ujian interaktif); CTA daftar/masuk |
| `/tentang`, `/cara-belajar`, `/hubungi`, legal |   ✅   |                                                       |

### 2.2 Auth

| Route                  | Status |
| :--------------------- | :----: |
| `/sign-in`, `/sign-up` |   ✅   |

### 2.3 Student `/dashboard/*`

| Route                                           | Status | Catatan                                                                                 |
| :---------------------------------------------- | :----: | :-------------------------------------------------------------------------------------- |
| `/dashboard`                                    |   ✅   | Continue learning + **JLPT path berbasis skor tryout terbaik/lulus resmi** + XP mingguan real + live preview |
| `/dashboard/kursus`, `/dashboard/kursus/[slug]` |   ✅   | Katalog kursus (layout marketing-style) + detail/enrollment |
| `/dashboard/kursus-saya`                        |   ✅   | Daftar kursus terdaftar user + progress sinkron DB |
| `/dashboard/kana/hiragana`, `/dashboard/kana/katakana` |   🟡   | Chart dari Excel + stroke GIF; akses via floating launcher (bukan nav); audio/step lokal masih placeholder |
| `/dashboard/belajar/...`                        |   ✅   | Video, materi, kuis inline + **Q&A DB (nested reply, delete, @mention)**                |
| `/dashboard/kuis/.../hasil`                     |   ✅   |                                                                                         |
| `/dashboard/leaderboard`                        |   ✅   | LMS poin + podium hierarki + mobile responsive                                          |
| `/dashboard/profil`                             |   ✅   | Hero + stats + edit (display name, avatar R2, badge title)                              |
| `/dashboard/achievements`                       |   ✅   | Badge LMS + milestone JLPT dari hasil tryout                                            |
| `/dashboard/live-class`                         |   ✅   | Jadwal live class dari DB                                                               |
| `/dashboard/tryout`                             |   ✅   | Pilih sesi + ujian per bagian (TOEFL-style) + analisa hasil                             |
| `/dashboard/tryout/[session]/[level]`           |   ✅   | Mode fokus: intro bagian → soal terisolasi → submit                                     |
| `/dashboard/tryout/hasil/[attemptId]`           |   ✅   | Popup animasi hasil + tier SOS/Latihan/Aman + tabel skor & analisa bagian + detail soal |

### 2.4 Admin

| Route                                      | Status | Catatan                                                                          |
| :----------------------------------------- | :----: | :------------------------------------------------------------------------------- |
| `/admin/dashboard`                         |   ✅   | Analytics enrollment, live class, tryout                                         |
| `/admin/live-class`                        |   ✅   | CRUD jadwal live class + kolom peserta (enrollment) + dialog daftar siswa        |
| `/admin/tryout`                            |   ✅   | CRUD sesi + pilih Paket Soal + peserta                                               |
| `/admin/tryout/paket`                      |   ✅   | Paket Soal: buat & isi Moji/Bunpou/Choukai (audio+gambar) di dalam paket              |
| `/admin/tryout/paket/import`               |   ✅   | UI seperti impor kursus: dropzone + Pratinjau (`dryRun`) + Impor ke DB; panduan + template ZIP |
| `/admin/tryout/bank`                       |   ✅   | Redirect → `/paket` (menu bank dihapus dari nav)                                      |
| `/admin/tryout/[sessionId]/susun`          |   ✅   | Redirect → paket sesi (compose per-sesi retired)                                     |
| `/admin/tryout/import`                     |   ✅   | Notice legacy; import paket di `/paket/import`                                       |
| `/admin/pembayaran`                        |   ✅   | Antrian enrollment + tab Riwayat (`EnrollmentLog`: approve/reject/grant/request) |
| `/admin/kursus` + modul + lesson workspace |   ✅   | CRUD + bank soal **per pelajaran** + kolom peserta + dialog daftar siswa          |
| `/admin/kursus/import`                     |   ✅   | Impor multi-template (`official-course-v1` + sensei N4/N5); pratinjau struktur modul/pelajaran, kode error/warning, unduh laporan `.txt`; integration test official + rollback validasi |
| `/admin/quiz`                              |   ✅   | **Info page** — bank soal di lesson workspace ([ADMIN_QUIZ.md](./ADMIN_QUIZ.md)) |
| `/admin/quiz/import`                       |   ✅   | Redirect ke info quiz                                                            |

---

## 3. Domain fitur (`features/`)

| Domain           | Status | Catatan                                                                        |
| :--------------- | :----: | :----------------------------------------------------------------------------- |
| **learning**     |   ✅   | Enroll, progress, kuis, marketing queries, Q&A nested + player video hardened   |
| **admin-cms**    |   ✅   | CRUD kursus/modul/lesson/enrollment/import + daftar peserta per program          |
| **student**      |   ✅   | Dashboard, profil, achievements, loaders, unified reward notification (toast/dialog/bottom-sheet) |
| **tryout**       |   ✅   | Bank + Paket Soal (`JlptQuestionSet`) + sesi event + seek Choukai + paper snapshot |
| **live-class**   |   ✅   | Jadwal dari `LiveClass` model                                                  |
| **public-api**   |   ✅   | Partner katalog                                                                |
| **gamification** |   ✅   | Badge unlock rules + bonus XP Core, equip sebagai title, admin CMS unlock meta |
| **kana**         |   🟡   | Chart + modal + FAB dismissible; stroke GIF mistval; menunggu audio/vocab image lokal |
| **quiz-engine**  |   🟡   | Inline di lesson; bukan focus-mode terpisah                                    |

---

## 4. Data, seed & integrasi

| Item                                                                  | Status |
| :-------------------------------------------------------------------- | :----: | --------------------------------------------------------- |
| Schema Course/Module/Lesson/Materi/Question                           |   ✅   |
| Schema Enrollment, UserProgress, QuizAttempt                          |   ✅   |
| Schema LiveClass, TryoutSession, JLPT bank + Paket Soal (`JlptQuestionSet`) |   ✅   |
| Seed N5 + materi XLSX + tryout N5 Fase 1 + live class + badge starter |   ✅   |
| Marketing katalog dari Prisma                                         |   ✅   |
| Server Actions write paths                                            |   ✅   |
| Award XP ke Core                                                      |   ✅   | `verify:core-gamification` script; flashcard/tryout/quiz fully wired and tested |
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
| 2026-07-22 | Nav Artikel (portal), `/tes-penempatan` marketing, CTA beranda → tes penempatan, floating Aksara di shell siswa |
| 2026-07-21 | Data kana dari `docs/Asset N5.xlsx`: generator manifest + stroke GIF eksternal + vocab sheet (104 huruf/script) |
| 2026-07-21 | Hapus hub `/dashboard/kana` (redirect → hiragana) + tombol Kembali di chart Hiragana/Katakana |
| 2026-07-21 | `/kursus` marketing: section Live Class & Try Out JLPT dari DB (cover + tombol Lihat Detail → `/sign-up`) |
| 2026-07-20 | Halaman Hiragana & Katakana siswa: `/dashboard/kana` (+ hiragana/katakana chart), nav siswa, modal detail (audio/GIF/vocab placeholder), manifest `features/kana/` |
| 2026-07-17 | Email reminder Live Class harian: template Resend + cron `POST /api/cron/live-class-reminders` (00:00 WIB, enrollment ACTIVE, idempotent per sesi/user/hari) |
| 2026-07-17 | Klarifikasi hasil tryout JLPT: hapus Status Simulasi (Aman/SOS) dari UI; hero & riwayat fokus kelulusan JLPT resmi + indikasi CEFR |
| 2026-07-17 | Cover image kursus & live class: field `coverImageUrl`, upload admin CMS (R2), fallback `bg-courses.webp` / `bg-live_class.webp` di kartu & detail |
| 2026-07-17 | Jalur JLPT Saya berbasis tryout: agregasi skor tertinggi per level, kelulusan resmi total + per-seksi, roadmap terkunci sebelum attempt pertama, dan CTA mulai tryout |
| 2026-07-17 | UX meeting poin 2: edit materi/kuis inline di admin lesson workspace, sidebar konten kursus pertahankan scroll + optimistic selesai, hero Dashboard Lanjutkan Belajar urut kursus dari progres terakhir |
| 2026-07-17 | Migrasi lesson video player: ganti Vidstack dengan `react-player` (kontrol native YouTube), hapus workaround provider-destroyed; pertahankan enrollment gate, analytics play, pause saat tab tidak aktif |
| 2026-07-17 | Hotfix Vidstack lesson player: kembalikan `noGestures` + hapus override iframe YouTube (`height: 100%`) yang memicu blink/error `disabled is not a function`; tap play/pause via `Gesture` tunggal |
| 2026-07-17 | Bugfix lesson video: Q&A tidak double mention, balasan berantai + hapus komentar owner/admin, dan Vidstack player lebih responsif (controls awal, tombol play tengah, portrait contain) |
| 2026-07-17 | Badge LMS: hapus opsi unlock legacy dari form admin, tambah rule `SPECIFIC_LESSON_COMPLETE` dan `SPECIFIC_MODULE_COMPLETE` dengan target Kursus → Modul → Lesson bertingkat, serta unlock otomatis untuk lesson/modul/kursus target saat progres belajar selesai |
| 2026-07-14 | Fix `/kursus/[slug]`: hapus `PAYMENT_BCA` client IIFE (crash production), payment settings via RSC prop, CTA Daftar/Masuk, redirect login → `/dashboard/kursus/[slug]` |
| 2026-07-10 | Template Paket Soal: pecah sheet soal per section (`004. Moji Goi`, `005. Bunpou Dokkai`, `006. Choukai`); parser merge + legacy Soal terpadu |
| 2026-07-10 | Template Paket Soal: pilihan A–D + Jawaban Benar + Gambar Stimulus digabung ke sheet Soal; hapus sheet 005; klarifikasi pengisian Audio Chokai |
| 2026-07-10 | Template ZIP Paket Soal: sheet `001. Panduan` ramah admin, kolom Indonesia + dropdown enum, kode bisnis sederhana (`n5-paket-1`); parser alias header/sheet baru |
| 2026-07-10 | Import Paket Soal: UI mirror impor kursus (dropzone, Pratinjau dry-run, Impor ke DB, panduan + template); breadcrumb Import Paket |
| 2026-07-10 | UX paket-first: hapus menu Bank Soal; form sesi/paket minimal; buat soal (Moji/Bunpou/Choukai+audio+gambar) langsung di detail paket |
| 2026-07-10 | JLPT Paket Soal: `JlptQuestionSet`/`SetItem` + `session.questionSetId`, dual-read paper loader, CMS `/admin/tryout/paket`, session dropdown + activate gate (3 bagian), ZIP→paket replace, soft-lock + duplicate kode admin, retire `/susun` |
| 2026-07-10 | JLPT Tryout Phase 2 cutover: legacy soal/import writes disabled; `/soal` redirects to `/susun`; composition freeze on active sessions; bank retire/activate |
| 2026-07-10 | JLPT Tryout Question Bank Phase 1: `ListeningStimulus`/`JlptQuestion`/`TryoutSessionItem`, migrasi backfill, bank ZIP import, CMS `/admin/tryout/bank` + `/susun`, Choukai timestamp seek, `paperSnapshotJson` on submit; hapus sesi tidak menghapus bank |
| 2026-07-08 | Course Import V1 fase 5 & 10 selesai: `modulePreview` + tabel struktur modul/pelajaran di UI admin, kode error/warning terstruktur, unduh laporan `.txt` (`build-course-import-report-text`), integration test official template + rollback saat validasi gagal |
| 2026-07-08 | Course Import V1 fase 8–11: template resmi `official-course-v1` (builder + download), deteksi multi-template (`detect-course-import-template`), adapter resmi, entry point `previewCourseImport`/`importCourseWorkbook`, UX pratinjau (template badge + error sheet/baris), re-export legacy `import-sensei-course-xlsx` |
| 2026-07-08 | Course Import V1 fase 5: persistence transaksional REPLACE + external ID nullable (`courseExternalId`/`moduleExternalId`/`lessonExternalId`), backfill script `course-import:backfill-external-ids`, integration test DB-optional |
| 2026-07-07 | Refactor arsitektur lesson bertipe tunggal dimulai: `Lesson.lessonType` nullable + registry tipe (`VIDEO`/`FLASHCARD`/`QUIZ`/`TEXT`), form/admin workspace/student workspace kompatibel legacy, guard mutasi materi/soal, dan script dry-run backfill `lesson:backfill-types` |
| 2026-07-07 | Riwayat enrollment admin: model `EnrollmentLog` + migrasi; log REQUESTED/APPROVED/REJECTED/GRANTED/REVOKED; tab Antrian \| Riwayat di `/admin/pembayaran` (cari, filter aksi, pagination) |
| 2026-07-03 | Overhaul flashcard (3D flip tanpa ghosting, Furigana & Shuffle toggle, Onyomi/Kunyomi split dengan `|`, "Sudah tahu" front face shortcut, mobile max-height), instant progress updates (confetti, custom events, core session refresh), bottom lesson navigation, dan fix pg-pool seed crash |
| 2026-07-07 | Admin daftar peserta per program: kolom Peserta di tabel Kursus/Live Class/Tryout (klik → dialog siswa + approve/cabut); detail pengguna wire enrollment Live Class & Tryout; sync `filledSlots` live class dari enrollment ACTIVE |
| 2026-06-30 | Chokai tryout (merge staging): impor ZIP per sesi (level dari `TryoutSession`), ffmpeg auto-slice, Tipe Jawaban Teks/Gambar, progress ujian session-scoped, player one-shot + fallback teks opsi gambar |
| 2026-06-30 | Refactor monetisasi & metadata: `CourseCategoryType` (Utama/Gratis/Tambahan) + dropdown CMS + kolom Excel outcomes; `TryoutSession.level` (satu sesi = satu JLPT), hapus `Question.tryoutLevel`, bank soal tanpa tab level, enrollment gate tryout by session id, `logLmsXpEvent` upsert anti-P2002 |
| 2026-07-09 | `/dashboard/kursus` layout marketing-style (hero centered + filter badge); halaman baru `/dashboard/kursus-saya` untuk enrollment user; menu profil "Kursus Saya" → kursus-saya; fix progress kartu katalog (fresh DB merge ke `enrollmentBySlug`) |
| 2026-07-09 | Redesign `/dashboard/kursus` → Katalog Kursus terpadu: hapus section duplikat Kursus Saya/Jelajahi, hero + search prominent + grid responsif; komponen `course-catalog/*` |
| 2026-07-09 | Unified Reward Notification System (`features/student/components/reward-notification/`): tier small/medium/large, `showReward()` API, daily-login dialog/bottom-sheet terhubung `syncUserAnchor` → `DailyLoginRewardBridge`, lesson/quiz/flashcard pakai toast |
| 2026-06-29 | Fitur "Bagikan Pencapaian" (Share Achievement) pada halaman koleksi badge siswa: modal interaktif berdesain glassmorphism premium dengan pulsing glow sesuai rarity, integrasi Web Share API dan link sharing sosial media (WhatsApp, X/Twitter, Threads, Facebook), serta fitur "Simpan Kartu" (Unduh Gambar) 1080x1920 berbasis html-to-image |
| 2026-06-29 | Dukungan otomatisasi penyelesaian tingkat kursus (SPECIFIC_COURSE_COMPLETE) pada sistem badge: penambahan relasi targetCourseId/targetCourse pada skema Prisma LmsBadge, form input Dropdown dinamis memilih Course di admin panel, validasi Zod targetCourseId, dan format label syarat siswa dinamis |
| 2026-06-29 | Penguatan form admin badge: kondisional fields gating (reactive form) berdasarkan unlock rule, validasi Zod klien & pesan error presisi, tooltip & deskripsi economy standard, serta penambahan kolom targetLevel dan targetCategory ke skema Prisma LmsBadge |
| 2026-06-29 | Sinkronisasi XP→Core anti-hilang: `awardLmsXp` tidak lagi throw + status eksplisit (synced/skipped/failed); `LmsXpEvent` jadi outbox (`coreStatus`/`coreKind`/`coreIdempotencyKey`/`coreAttempts`, migrasi `add_xp_core_sync_outbox`); drain `retryPendingCoreXp` (oportunistik per-user + endpoint `POST /api/core/retry-xp` ber-`LMS_CRON_SECRET`) |
| 2026-06-29 | Field baru `Course.outcomes String[]` (migrasi `add_course_outcomes`) sebagai sumber "Yang akan kamu pelajari"; form CMS kursus dapat input outcomes (textarea per-baris); detail kursus student & marketing render `course.outcomes`, berhenti menurunkan dari `Module.description` |
| 2026-06-29 | Rebalance ekonomi XP/Poin: SSOT `features/student/lib/gamification-rewards.ts` (XP flat & kecil sesuai kurva Core 50 XP/level, Poin ≈10× boleh skala performa); XP kuis/tryout di-decouple dari jumlah benar (anti lompat-level); bonus XP badge per-rarity (5/10/20/25); daily-login award XP                                  |
| 2026-06-29 | Halaman detail Live Class `/dashboard/live-class/[id]` (hero + status enrollment + timeline sesi real-time: Rekaman/Gabung Zoom/terjadwal); server action `requestLiveClassEnrollment` (gratis→ACTIVE, berbayar→PENDING + notif admin)                          |
| 2026-06-29 | Hybrid slug UX: util `generateSlug`/`sanitizeSlugWhileTyping`, auto-fill Judul→Kode di form tryout (editable, sanitasi onChange), sanitasi field slug lanjutan (course/module)                                                                                  |
| 2026-06-29 | Admin CMS polymorphic enrollment (pilih tipe produk Course/Live Class/Tryout + badge tipe di tabel); form tryout dapat harga (`priceIdr`) & toggle `isStrictTimeBound`; util `RupiahInput` auto-format ribuan untuk tryout & live class                          |
| 2026-06-26 | Hapus rate limiting middleware di `proxy.ts` — memblokir staging (shared IP + RSC request volume)                                                                                                                                                               |
| 2026-06-26 | Refactor profile photo cropping modal to be fully theme-adaptive; replace custom RPG loading screens with the standard JepangKu splash loading interface and enforce production fail-gate restrictions on core connection errors                                |
| 2026-06-26 | Implement deferred avatar upload flow to Cloudflare R2 on form save with client-side react-easy-crop editor, local object URL preview, memory leak cleanup, and z-index toaster layer adjustment                                                                |
| 2026-06-29 | Impor kursus & tryout: formulir Excel berwarna multi-tab, hapus CSV kursus, `/admin/tryout/import` workbook mandiri (sesi + MOJI/BUNPOU)                                                                                                                        |
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
