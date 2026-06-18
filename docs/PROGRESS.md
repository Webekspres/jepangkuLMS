# 📋 JepangKu LMS — Progress Tracker

Living document untuk melacak apa yang sudah dikerjakan vs belum. **Single source of truth untuk URL:** [sitemap.md](../sitemap.md). **Arsitektur target:** [ARCHITECTURE.md](./ARCHITECTURE.md).

| Meta | Nilai |
| :--- | :--- |
| **Fase** | 1 (MVP) |
| **Target** | Akhir Juni 2026 |
| **Base domain** | `kursus.jepangku.com` |
| **Terakhir diperbarui** | 2026-06-18 |
| **Arsitektur** | [ECOSYSTEM.md](./ECOSYSTEM.md) — LMS + Core + Portal Berita |
| **Progres global Fase 1** | **72%** (62 item terlacak) |

### Progres global

```text
[██████████████░░░░░░] 72%
```

| Area | Bobot* | ✅ | 🟡 | ⬜ | % area |
| :--- | ---: | ---: | ---: | ---: | ---: |
| Infrastruktur & platform | 18 | 12 | 5 | 1 | 82% |
| Halaman & routing | 25 | 14 | 9 | 2 | 70% |
| Domain `features/` | 6 | 4 | 2 | 0 | 80% |
| Data & integrasi | 8 | 6 | 1 | 1 | 81% |
| Keamanan & bisnis | 5 | 3 | 1 | 1 | 68% |
| **Total** | **62** | **39** | **18** | **5** | **72%** |

\*Jumlah baris terlacak di §1–§5 (🔮 Fase 2 tidak dihitung).

**Rumus:** `((✅ × 1) + (🟡 × 0,4) + (⬜ × 0)) ÷ total × 100` → `(39 + 7,2) ÷ 62 ≈ 72%`.

---

## Legenda status

| Simbol | Arti |
| :---: | :--- |
| ✅ | **Selesai** — perilaku/fitur sesuai spesifikasi MVP |
| 🟡 | **Sebagian** — ada tapi belum lengkap / mock parsial |
| ⬜ | **Belum** — tidak ada implementasi bermakna |
| 🔮 | **Fase 2** — sengaja di luar scope Fase 1 |

---

## Ringkasan cepat

| Area | Selesai | Sebagian | Belum |
| :--- | ---: | ---: | ---: |
| Infrastruktur & platform | 12 | 5 | 1 |
| Halaman & routing | 14 | 9 | 2 |
| Domain `features/` | 4 | 2 | 0 |
| Data & integrasi | 6 | 1 | 1 |
| Keamanan & bisnis | 3 | 1 | 1 |

---

## 1. Infrastruktur & platform

| Item | Status | Catatan |
| :--- | :---: | :--- |
| Next.js 16 App Router + React 19 | ✅ | `app/` + `features/` |
| Tailwind CSS v4 + tema brand | ✅ | `globals.css`, DESIGN.md |
| Bun package manager | ✅ | |
| Prisma schema PostgreSQL LMS | ✅ | + `LiveClass`, `TryoutSession`, `isFeatured` |
| `lib/prisma.ts` singleton | ✅ | |
| `lib/core/` JWT + award XP | 🟡 | Dev OK; prod Core token belum diverifikasi penuh |
| `proxy.ts` auth + admin gate | ✅ | Clerk + role Core JWT |
| Auth Clerk sign-in/sign-up | ✅ | |
| TanStack Query providers | ✅ | Dipakai terbatas |
| Zustand quiz store | 🟡 | Ada; inline quiz di lesson workspace |
| Zod validasi | ✅ | `lib/validations/` |
| Folder `features/` domain | ✅ | learning, admin-cms, student, tryout, live-class, public-api |
| Shadcn UI primitif | 🟡 | Cukup untuk MVP; tambah sesuai kebutuhan |
| Prisma seed N5 + tryout + live class | ✅ | `prisma/seed.ts` |
| Partner API v1 | ✅ | `docs/PARTNER_API.md` |
| `.env` / Clerk / DB | 🟡 | Lokal OK; prod env tim |

---

## 2. Halaman & routing (Fase 1)

### 2.1 Public & marketing

| Route | Status | Catatan |
| :--- | :---: | :--- |
| `/` | 🟡 | Landing lengkap; data marketing statis |
| `/kursus` | ✅ | **Prisma** published + filter level/kategori/unggulan |
| `/kursus/[slug]` | ✅ | **Prisma** detail + silabus dari modul DB |
| `/tryout` | 🟡 | Halaman info publik (bukan ujian interaktif) |
| `/tentang`, `/cara-belajar`, `/hubungi`, legal | ✅ | |

### 2.2 Auth

| Route | Status |
| :--- | :---: |
| `/sign-in`, `/sign-up` | ✅ |

### 2.3 Student `/dashboard/*`

| Route | Status | Catatan |
| :--- | :---: | :--- |
| `/dashboard` | ✅ | Continue learning + JLPT path + **XP mingguan real** + live preview |
| `/dashboard/kursus`, `/dashboard/kursus/[slug]` | ✅ | Enrollment + pembayaran |
| `/dashboard/belajar/...` | ✅ | Video, materi, kuis inline + Q&A comment section (mockup) |
| `/dashboard/kuis/.../hasil` | ✅ | |
| `/dashboard/leaderboard` | 🟡 | LMS local points (bukan Core global XP) |
| `/dashboard/profil` | 🟡 | Redesign: hero banner + stats + quick actions + edit profil page (`/edit`) |
| `/dashboard/achievements` | ✅ | Badge LMS + **milestone JLPT dari enrollment** |
| `/dashboard/live-class` | ✅ | Jadwal live class dari DB |
| `/dashboard/tryout` | ✅ | Pilih sesi/level + **ruang ujian JLPT** (Fase 1 N5) |

### 2.4 Admin

| Route | Status | Catatan |
| :--- | :---: | :--- |
| `/admin/dashboard` | ✅ | |
| `/admin/pembayaran` | ✅ | Enrollment PENDING/ACTIVE |
| `/admin/kursus` + modul + lesson workspace | ✅ | CRUD + bank soal **per pelajaran** |
| `/admin/kursus/import` | ✅ | CSV kursus |
| `/admin/quiz` | ✅ | **Info page** — bank soal di lesson workspace ([ADMIN_QUIZ.md](./ADMIN_QUIZ.md)) |
| `/admin/quiz/import` | ✅ | Redirect ke info quiz |

---

## 3. Domain fitur (`features/`)

| Domain | Status | Catatan |
| :--- | :---: | :--- |
| **learning** | ✅ | Enroll, progress, kuis, marketing queries |
| **admin-cms** | ✅ | CRUD kursus/modul/lesson/enrollment/import |
| **student** | ✅ | Dashboard, profil, achievements, loaders |
| **tryout** | ✅ | Selection + exam workspace + submit |
| **live-class** | ✅ | Jadwal dari `LiveClass` model |
| **public-api** | ✅ | Partner katalog |
| **gamification** | 🟡 | LMS points/badge lokal; Core XP best-effort |
| **quiz-engine** | 🟡 | Inline di lesson; bukan focus-mode terpisah |

---

## 4. Data, seed & integrasi

| Item | Status |
| :--- | :---: |
| Schema Course/Module/Lesson/Materi/Question | ✅ |
| Schema Enrollment, UserProgress, QuizAttempt | ✅ |
| Schema LiveClass, TryoutSession | ✅ |
| Seed N5 + materi XLSX + tryout N5 Fase 1 | ✅ |
| Marketing katalog dari Prisma | ✅ |
| Server Actions write paths | ✅ |
| Award XP ke Core | 🟡 |
| News → Partner API wiring | ⬜ |

---

## 5. Keamanan & aturan bisnis

| Aturan | Status |
| :--- | :---: |
| Route student memerlukan login | ✅ |
| Route admin memerlukan role admin | ✅ |
| Public read kursus/tryout info | ✅ |
| Secured video (enrolled only) | 🟡 |
| Enrollment gate lesson | ✅ |

---

## 6. Backlog Fase 2 🔮

- Integrasi News Partner API v1
- Tryout semua level N4–N1 + sesi Fase 2–4 penuh
- Leaderboard global dari Core API
- Admin CMS live class & tryout bank

---

## Changelog

| Tanggal | Perubahan |
| :--- | :--- |
| 2026-06-18 | Wire `/kursus` marketing ke Prisma + filter unggulan; dashboard XP mingguan & live class real; achievements milestone real; halaman Live Class & JLPT Tryout; dokumentasi ADMIN_QUIZ; update tracker 72% |
| 2026-06-18 | UI polish: hero elliptic rounded bottom; MarketingPageHero dark navy di semua halaman publik; logo selalu berwarna (nav/footer/auth); fix navbar height glitch; CTA banner bg match pricing; Q&A section di lesson workspace; redesign & edit profil page siswa |
| 2026-06-05 | `CORE_INTEGRATION_STATUS.md` blocker Core 500 |
| 2026-06-03 | Dokumen awal progress tracker |
