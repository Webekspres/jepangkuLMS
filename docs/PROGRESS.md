# 📋 JepangKu LMS — Progress Tracker

Living document untuk melacak apa yang sudah dikerjakan vs belum. **Single source of truth untuk URL:** [sitemap.md](../sitemap.md). **Arsitektur target:** [ARCHITECTURE.md](./ARCHITECTURE.md).

| Meta | Nilai |
| :--- | :--- |
| **Fase** | 1 (MVP) |
| **Target** | Akhir Juni 2026 |
| **Base domain** | `kursus.jepangku.com` |
| **Terakhir diperbarui** | 2026-06-03 |

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
| Infrastruktur & platform | 4 | 8 | 3 |
| Halaman & routing (~23) | 1 | 22 | 0 |
| Domain `features/` | 0 | 1 | 3 |
| Data & integrasi | 1 | 2 | 4 |

**Estimasi keseluruhan Fase 1:** awal fondasi (~15%) — routing & schema ada; bisnis logic dan auth belum.

---

## 1. Infrastruktur & platform

| Item | Status | Catatan |
| :--- | :---: | :--- |
| Next.js 16 App Router + React 19 | ✅ | `app/` terstruktur sesuai sitemap |
| Tailwind CSS v4 + tema brand (`globals.css`) | ✅ | Palet JepangKu + Shadcn semantic tokens |
| Bun sebagai package manager | ✅ | `bun dev`, dll. |
| Prisma schema (PostgreSQL) | ✅ | Model lengkap: User, Course, Lesson, Quiz, XP, Badge, dll. |
| `lib/prisma.ts` singleton | ✅ | Client siap dipakai RSC/Server Actions |
| `proxy.ts` (ganti middleware) | 🟡 | Daftar public path ada; **belum** Clerk auth / redirect logged-in user / role ADMIN |
| Clerk Auth (sign-in, sign-up, OAuth) | ⬜ | Halaman stub; **Clerk belum di `package.json`**; tidak ada `ClerkProvider` di root layout |
| Webhook `/api/webhooks/clerk` → sync User DB | 🟡 | Route ada; hanya `console.log`, **belum** create/update User + `UserStat` via Prisma |
| TanStack Query | 🟡 | `AppProviders` di `app/layout.tsx`; `getQueryClient`, `queryKeys`; **belum** `useQuery` di features |
| Zustand (quiz store) | 🟡 | `zustand@5` terpasang; `useQuizStore` + selectors di `features/quiz-engine/store/`; **belum** dipakai di UI `/kuis` |
| Zod validasi | 🟡 | `zod@4` + `lib/validations/` (shared schemas, `parseInput`); skema per-domain di `features/*/schemas/` belum |
| Folder `features/` (domain logic) | 🟡 | `features/quiz-engine/store/` ada; domain lain & actions/components belum |
| `components/layout/` (sidebar dashboard) | ⬜ | Belum ada |
| Shadcn UI primitif lengkap | 🟡 | Hanya `button`; komponen lain perlu `shadcn add` sesuai kebutuhan |
| Prisma seed (kursus, soal N5 CSV) | ⬜ | Tidak ada `prisma/seed.ts` / script seed di `package.json` |
| `.env` / Clerk / DB production-ready | 🟡 | Dokumentasi di README; verifikasi per environment tim |
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

**Catatan:** Route group `(dashboard)/` belum punya `layout.tsx` (sidebar/nav siswa).

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
| **gamification** | `features/gamification/` | `claimBadge`, `getUserRank`, award XP dari kuis/lesson | `LeaderboardTable`, `LevelProgressBar` | ⬜ |
| **learning** | `features/learning/` | `completeLesson`, `getCourseContent` | `VideoPlayer`, `SilabusAccordion` | ⬜ |
| **quiz-engine** | `features/quiz-engine/` | `submitQuizAttempt` | `QuizWorkspace`, `QuestionCard`, `useQuizStore` | 🟡 |
| **admin-cms** | `features/admin-cms/` | `approvePayment`, `uploadExcelMateri`, CRUD kursus/lesson | Tabel CMS, form import | ⬜ |

---

## 4. Data, seed & integrasi

| Item | Status | Catatan |
| :--- | :---: | :--- |
| Schema: User + Clerk `clerkId` | ✅ | |
| Schema: Course, Lesson, materials (Kanji/Kosakata/Tata Bahasa) | ✅ | |
| Schema: Question + QuestionOption, QuizAttempt | ✅ | |
| Schema: UserStat, Badge, UserBadge, UserProgress | ✅ | |
| Schema: Enrollment (PENDING/ACTIVE) | ✅ | Alur pembayaran manual mungkin perlu model tambahan |
| Seed data kursus N5 + soal dari CSV | ⬜ | |
| RSC: Prisma read di halaman publik/katalog | ⬜ | |
| Server Actions: write paths | ⬜ | |
| XP otomatis setelah kuis/lesson | ⬜ | |
| Leaderboard query (top 10 + rank user) | ⬜ | |

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

1. **Clerk belum terpasang** — auth, webhook sync, dan proxy protection tertunda.
2. **`features/` kosong** — pelanggaran konvensi AGENTS.md; refactor diperlulu sebelum logic membesar di `app/`.
3. **Tidak ada seed** — kuis & demo belajar tidak bisa diuji end-to-end.
4. **Model pembayaran** — kejelasan entitas "request pembayaran" vs `Enrollment` saja.
5. **Proxy placeholder** — semua route non-public saat ini lolos tanpa auth (`proxy.ts`).

---

## Cara memperbarui dokumen ini

1. Setelah menyelesaikan satu slice vertikal (mis. "Leaderboard read-only"), ubah baris terkait dari ⬜/🟡 → ✅.
2. Update tanggal **Terakhir diperbarui** di header.
3. Tambahkan baris singkat di **Changelog** di bawah.
4. Jika menambah route baru, update [sitemap.md](../sitemap.md) dulu, lalu tambah baris di §2.
5. Jangan tandai ✅ hanya karena file `page.tsx` ada — harus memenuhi kolom "Yang masih kurang" kosong atau ditandai sengaja deferred.

---

## Changelog

| Tanggal | Perubahan |
| :--- | :--- |
| 2026-06-03 | Dokumen awal: baseline audit routing, schema, infra vs sitemap Fase 1 |
| 2026-06-03 | Zustand: `bun add zustand`, `useQuizStore` + selectors di `features/quiz-engine/store/` |
| 2026-06-03 | Zod: `bun add zod`, shared schemas + `parseInput` di `lib/validations/` |
| 2026-06-03 | TanStack Query: `AppProviders` di root layout, `lib/query-client`, `lib/query-keys` |
