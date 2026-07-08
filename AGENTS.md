<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# 🤖 JepangKu LMS - AI Coding Agent Guidelines

Selamat datang Agent! Dokumen ini berisi instruksi, konvensi, dan aturan arsitektur untuk proyek **JepangKu LMS** (satu app dalam ekosistem JepangKu). Patuhi pedoman ini secara ketat untuk menjaga kebersihan kode dan menghindari konflik.

---

## 🌐 Ekosistem JepangKu (WAJIB BACA)

**Repo ini = LMS saja** (`kursus.jepangku.com`). Bukan Portal Berita, bukan Core Backend.

| Layanan | Repo / tim | Data |
| :--- | :--- | :--- |
| **Core Backend** (Sultan) | Layanan terpisah | Clerk SSO, profil global, XP/level/badge |
| **Portal Berita** (Habibi) | App + DB sendiri | Artikel, komentar |
| **LMS** (Kris) | **Repo ini** | Kursus, lesson, kuis, progress belajar |

**Detail lengkap:** [docs/ECOSYSTEM.md](docs/ECOSYSTEM.md) · **Schema Core:** [jepangku-core/docs/](../jepangku-core/docs/) · **Integrasi:** [docs/CORE_INTEGRATION_STATUS.md](docs/CORE_INTEGRATION_STATUS.md)

### Aturan keras untuk Agent

1. **DB LMS** — PostgreSQL mandiri; **jangan** simpan profil lengkap user (email, nama, avatar, XP, level) di Prisma lokal.
2. **`User` di `schema.prisma`** — hanya **jangkar FK**: field `id` (String) = user id dari Core / Clerk; relasi native ke `Enrollment`, `UserProgress`, `QuizAttempt`.
3. **Profil & gamifikasi (user aktif)** — dari **JWT claims** yang dikeluarkan Core (`lib/core/jwt-claims.ts`, `getCoreSession()`). Bukan `prisma.user` untuk nama/XP/roles. **Leaderboard & award XP** → Core API (`lib/core/client.ts`).
4. **Schema Core** — canonical di repo `jepangku-core/docs/`; jangan edit salinan di LMS.
5. **Clerk** — shared app dengan News; webhook utama di Core.
6. **`features/gamification/`** — UI + client Core; bukan tabel `UserStat` / `Badge` lokal.

---

## 🛠️ Stack & Runtime Utama
* **Runtime & Package Manager:** `Bun` (Gunakan `bun` untuk menginstal dependensi, menjalankan dev server, dan seeding).
* **Framework:** Next.js (App Router, TS, React 19).
* **Styling:** **Tailwind CSS v4** (Perhatikan instruksi khusus Tailwind v4 di bawah).
* **Database ORM:** Prisma ORM + PostgreSQL (`@prisma/adapter-pg`). **Dev:** PostgreSQL lokal. **Prod host DB:** belum ditentukan — lihat [docs/DATABASE.md](docs/DATABASE.md).
* **State Management:** Zustand (Client-side UI) & TanStack Query (Server-cache state).
* **Testing:** `bun test` (logic/unit) + Playwright (`@playwright/test`) untuk E2E UI.
* **Identitas & SSO:** JepangKu Core Backend (Clerk dipasang di Core); LMS konsumen sesi/API.
* **Profil & gamifikasi:** Core Service via `lib/core/` (bukan DB LMS).
* **Transactional email:** Resend + React Email via `lib/email/` (welcome on Clerk `user.created`).

---

## 🎨 UI, Styling & Desain

**Wajib baca [DESIGN.md](./DESIGN.md) sebelum membuat atau mengubah UI** — palet, tipografi, layout per area, pola komponen, dan checklist Agent ada di sana. Dokumen ini adalah otoritas desain; jangan mengandalkan preferensi warna dari prompt.

Ringkasan singkat (detail & contoh di `DESIGN.md`):

1. **Tailwind CSS v4 + Shadcn UI** — Tanpa `tailwind.config.js`; tema hanya di [app/globals.css](./app/globals.css) (`@theme inline`, `@import "tailwindcss"`).
2. **Warna** — Token semantic (`primary`, `muted-foreground`, …) atau utilitas `brand-*`; **dilarang** hex hardcoded di komponen.
3. **Komponen** — Primitif dari `components/ui/`; referensi visual marketing: [app/page.tsx](./app/page.tsx).
4. **UI kompleks** — Taruh di `features/*/components/`, bukan di `app/**/page.tsx`.

---

## 🧭 Arsitektur Folder: Feature-Based (Domain-Driven)
Kami memisahkan layout routing dengan logika bisnis utama. Patuhi struktur di bawah ini:

1. **Routing Layer (`app/`):**
   * Murni bertindak sebagai "resepsionis/routing" (RSC tipis).
   * File `page.tsx` di dalam `app/` dilarang menulis logic database rumit secara langsung atau me-render elemen UI kompleks. Panggil wrapper component dari `features/` untuk menangani rendering.
   * Rute publik/marketing dibungkus di Route Group `app/(marketing)/*`.
   * Rute terproteksi bagi siswa dibungkus di Route Group `app/(student)/*` (URL tetap `/dashboard/*`).
   * Rute terproteksi bagi admin dibungkus di Route Group `app/(admin)/admin/*` (URL tetap `/admin/*`).

2. **Isolasi Domain (`features/`):**
   * Seluruh logika bisnis, state, Server Actions, dan UI khusus ditaruh di sini.
   * **Domain Terbagi Menjadi:**
     * `features/gamification/`: UI Leaderboard/XP/Badge — **data dari Core** (`lib/core/`), bukan Prisma XP lokal.
     * `features/learning/`: Logika Course, Lesson, Silabus, & Video Player.
     * `features/quiz-engine/`: Logika Soal, Navigasi Kuis, Scoring, & Zustand Store.
     * `features/admin-cms/`: Logika Approval Pembayaran & Bulk Import CSV.
   * **Struktur Internal Domain Fitur:**
     * `actions/`: Next.js Server Actions dengan direktif `"use server"`.
     * `components/`: UI khusus untuk fitur tersebut.
     * `hooks/`: Hook client reusable (mis. pagination tabel admin).
     * `store/`: Zustand local store (misalnya `useQuizStore.ts` untuk kuis).

### Admin CMS — Pagination Tabel (WAJIB untuk tabel baru)

Semua **tabel data** di dashboard admin (`/admin/*`) wajib memakai pagination client-side yang konsisten:

| Item | Nilai / lokasi |
| :--- | :--- |
| Hook | `useAdminTablePagination` — `features/admin-cms/hooks/use-admin-table-pagination.ts` |
| UI footer | `AdminTablePagination` — `features/admin-cms/components/admin-table-pagination.tsx` |
| Konstanta | `ADMIN_TABLE_PAGE_SIZE_OPTIONS` = **5, 10, 15, 25, 100** (default **10**) — `features/admin-cms/lib/admin-table-pagination.ts` |

**Pola implementasi:**

1. Slice data dengan `paginatedItems` dari hook (bukan `.map()` langsung pada array penuh).
2. Letakkan `<AdminTablePagination />` di bawah `<Table />`, biasanya masih di dalam `<Card className="overflow-hidden">`.
3. Untuk tabel hasil **filter/search**, pass `resetKey` (mis. string query) agar halaman kembali ke 1 saat filter berubah.
4. Prop `itemLabel` dalam bahasa Indonesia jamak/singular yang natural (mis. `kursus`, `modul`, `pelajaran`, `kosakata`).

**Halaman yang sudah memakai pola ini:** Kelola Kursus, Modul, Pelajaran, flashcard (kosakata/kanji/tata bahasa) di lesson workspace, pratinjau impor CSV.

Tabel admin **baru** (pembayaran, bank soal, dll.) harus mengikuti pola yang sama — jangan buat komponen pagination terpisah.

3. **Shared Components & Core:**
   * Komponen UI primitif / reusable non-domain ditaruh di `components/ui/` (misalnya tombol, dialog, input).
   * Database LMS: `prisma/schema.prisma` + `lib/prisma.ts`. Integrasi Core: `lib/core/`.

### Prisma + `@prisma/adapter-pg` (wajib)

Instansiasi Prisma **hanya** lewat [lib/prisma.ts](./lib/prisma.ts): `PrismaClient` + `PrismaPg` + `pg.Pool` (bukan engine default tanpa `adapter`).

* **Jangan** `new PrismaClient()` polos di Server Components, Server Actions, atau route handlers — impor `prisma` dari `@/lib/prisma`.
* Pool dibatasi (`PG_POOL_MAX`, default `10`) untuk mencegah *connection exhaustion* di dev hot-reload dan VPS.
* Singleton di dev via `globalThis` agar hot-reload Next.js tidak membuka pool baru setiap reload.

### Database hosting — dev sekarang, prod nanti (portable)

**Kebijakan:** Fase dev memakai **PostgreSQL lokal** (`DATABASE_URL` di `.env`). Keputusan DB production (Neon, Supabase, Postgres di VPS, dll.) **ditunda** sampai deploy pertama — bukan blocker development.

**Wajib menjaga portabilitas** agar pindah host DB hampir tanpa ubah kode aplikasi:

| Lakukan | Jangan |
| :--- | :--- |
| Semua query lewat `prisma` dari `@/lib/prisma` | Hardcode host/user/password DB di kode |
| Schema PostgreSQL standar di `prisma/schema.prisma` | Fitur SQL vendor-specific tanpa kebutuhan jelas |
| Ganti lingkungan hanya via `DATABASE_URL` (+ `PG_POOL_MAX`) | `new PrismaClient()` tersebar di features |

Saat pindah local → managed/prod: update env → `bun run db:migrate:deploy` → seed/restore. Detail & checklist: **[docs/DATABASE.md](docs/DATABASE.md)**.

---

## 📊 Aturan Data Fetching & State
* **Direct Server Query (RSC):** Gunakan query Prisma secara langsung di dalam Server Component (`app/` page) untuk pengambilan data awal (Initial Load) yang cepat.
* **Server Actions:** Untuk modifikasi data (Write/Update), wajib menggunakan Server Actions yang ditempatkan di folder `actions/` fitur terkait. Panggil direktif `"use server"` di baris paling atas file.
* **TanStack Query (Client-side):** Gunakan untuk bagian UI interaktif yang membutuhkan revalidation/auto-refresh cepat tanpa hard-reload halaman.
* **Zustand Store:** Gunakan store lokal di dalam folder `store/` fitur untuk mengelola local state transient yang kompleks (seperti jawaban kuis sementara milik user).

---

## 🔗 Panduan Routing & Sitemap
* Rujuklah [sitemap.md](sitemap.md) sebagai **Single Source of Truth** untuk URL paths.
* **Clean URLs:** Gunakan slug unik (`[courseSlug]`, `[lessonSlug]`) alih-alih database ID dalam URL halaman belajar siswa untuk optimasi SEO dan estetika URL yang bersih.
* **Focus Mode Routing:** Workspace kuis ditaruh di top-level route `/kuis/[lessonSlug]` agar terlepas dari layout sidebar utama `/belajar` dan memberikan fokus penuh bagi siswa.
* **Proxy (Ganti Middleware):** Next.js 16+ mendepresiasi `middleware.ts` dan menggantinya dengan **`proxy.ts`** di root folder. Gunakan named export `export function proxy(request)` untuk memproses request terproteksi dan log redirects/rewrites secara aman.

---

## 📋 Pelacakan Progress (`docs/PROGRESS.md`)

[docs/PROGRESS.md](docs/PROGRESS.md) adalah **living tracker** Fase 1 MVP: apa yang sudah selesai, sebagian, atau belum. Setiap Agent **wajib** memperbarui berkas ini bila pekerjaan dalam sesi (atau PR) menyelesaikan atau secara nyata memajukan suatu fitur.

### Kapan wajib di-update

Perbarui `docs/PROGRESS.md` di **akhir tugas yang sama** (sebelum merespons selesai ke user), jika salah satu berikut terpenuhi:

* Satu **route/halaman** memenuhi spesifikasi di [sitemap.md](sitemap.md) (bukan sekadar `page.tsx` placeholder).
* Satu **domain `features/`** (actions, components, store) berfungsi end-to-end terhubung DB/auth sesuai desain.
* **Infrastruktur** (Clerk, proxy, webhook, seed, layout dashboard, dll.) benar-benar dipasang dan diverifikasi, bukan hanya file kosong.
* **Schema Prisma** atau aturan bisnis baru yang mengubah status item di tracker (mis. model pembayaran, enrollment).
* Route atau fitur **baru** ditambahkan — update [sitemap.md](sitemap.md) **dulu**, lalu tambah baris di `PROGRESS.md`.

Tidak perlu update untuk refactor kecil, typo, atau perubahan yang tidak mengubah status implementasi terhadap MVP.

### Cara update (wajib)

1. Baca `docs/PROGRESS.md` dan temukan baris yang relevan (§ Infrastruktur, § Halaman, § Domain `features/`, § Data, § Keamanan).
2. Ubah status: `⬜` → `🟡` (ada kemajuan nyata tapi belum MVP) atau `🟡` → `✅` (sesuai sitemap / kolom "Yang masih kurang" sudah terpenuhi).
3. Perbarui kolom **Catatan** / **Yang masih kurang** jika masih ada sisa pekerjaan kecil.
4. Sesuaikan **Ringkasan cepat** (hitungan Selesai / Sebagian / Belum) bila angka berubah.
5. **Hitung ulang progres global** di header `PROGRESS.md` (tabel per area, %, bar ASCII, meta **Progres global Fase 1** — ikuti rumus di dokumen).
6. Set **Terakhir diperbarui** (header) ke tanggal hari ini (`YYYY-MM-DD`).
7. Tambah satu baris di **Changelog** (tanggal + ringkasan singkat apa yang selesai).

### Aturan status (jangan dilanggar)

| Simbol | Gunakan hanya jika |
| :---: | :--- |
| ✅ | Perilaku fitur sesuai MVP; teruji atau jelas terhubung DB/auth/UI final |
| 🟡 | File/route ada, atau sebagian besar logic belum / masih stub |
| ⬜ | Belum ada implementasi bermakna |
| 🔮 | Sengaja di luar Fase 1 |

**DILARANG** menandai ✅ hanya karena file `page.tsx` atau folder `features/` sudah dibuat tanpa fungsi sesuai sitemap.

### Contoh changelog

```text
| 2026-06-10 | Clerk sign-in/sign-up + webhook sync User/UserStat ke Prisma |
```

Jika ragu apakah suatu item layak `✅`, biarkan `🟡` dan jelaskan sisa pekerjaan di kolom catatan.

---

## 🏃‍♂️ Perintah Terminal Harian
* Menjalankan Dev Server: `bun dev`
* Testing:
  * Logic/unit: `bun test`
  * E2E UI: `bunx playwright test`
  * Lihat detail strategi: [docs/TESTING.md](docs/TESTING.md)
* Prisma (juga via `package.json` scripts):
  * Generate client: `bun run db:generate`
  * Format schema: `bun run db:format`
  * Sinkronisasi DB lokal (dev): `bun run db:push`
  * Migrasi (dev): `bun run db:migrate` · deploy: `bun run db:migrate:deploy`
  * Seed: `bun run db:seed`
  * Studio: `bun run db:studio`
  * Reset DB (dev): `bun run db:reset`

---

## 📧 Transactional Email (Resend + React Email)

### Why Resend

* **API-first** — no raw SMTP; fits serverless / Next.js route handlers.
* **Deliverability** — domain verification, bounce handling, logs in Resend dashboard.
* **Developer UX** — simple Node SDK; pairs with React Email for typed templates.
* **Idempotency** — webhook retries do not duplicate welcome sends when keyed per user.

SMTP is intentionally **not** used.

### Architecture

```text
Clerk user.created
  → POST /api/webhooks/clerk (verify Svix)
  → after(() => dispatchWelcomeEmail(...))   # non-blocking
  → sendWelcomeEmail → sendEmail → Resend API
```

Email logic lives in `lib/email/` — **never** in React template components or auth UI.

| Path | Role |
| :--- | :--- |
| `lib/email/config.ts` | `RESEND_API_KEY`, `EMAIL_FROM`, app URL |
| `lib/email/resend.ts` | Resend client singleton |
| `lib/email/send-email.ts` | Generic `sendEmail({ to, subject, react })` |
| `lib/email/send-welcome-email.tsx` | `sendWelcomeEmail` + `dispatchWelcomeEmail` |
| `lib/email/parse-clerk-user-created.ts` | Clerk webhook → `{ email, name, userId }` |
| `emails/welcome-email.tsx` | React Email template (presentation only) |
| `emails/components/email-layout.tsx` | Shared layout, brand styles |

### Add a new template

1. Create `emails/your-template.tsx` using `@react-email/components` + `EmailLayout`.
2. Add `lib/email/send-your-template.tsx` calling `sendEmail()` (subject, idempotency key, tags).
3. Export from `lib/email/index.ts`.
4. Trigger from webhook, server action, or `after()` — use `dispatch*` helper so failures only log.
5. Unit-test parsers/mappers; preview with `bun run email:dev`.

### Local testing

```bash
# Preview templates (React Email dev server on :3001)
bun run email:dev

# Send real test (Resend sandbox / verified domain)
RESEND_API_KEY=re_... bun -e "
  import { sendWelcomeEmail } from './lib/email/send-welcome-email.tsx';
  const r = await sendWelcomeEmail({ email: 'you@example.com', name: 'Test' });
  console.log(r);
"
```

Register Clerk webhook to `https://YOUR_HOST/api/webhooks/clerk` with event **`user.created`**.

### Environment variables

| Variable | Required | Notes |
| :--- | :---: | :--- |
| `RESEND_API_KEY` | prod | Skip send + warn log if unset (dev OK) |
| `EMAIL_FROM` | no | Default `JepangKu <hello@jepangku.com>` |
| `NEXT_PUBLIC_APP_URL` | yes | CTA links + logo URL in emails |
| `CLERK_WEBHOOK_SECRET` | yes | Welcome trigger |

### Deployment

* Verify sending domain in Resend (`jepangku.com`).
* Set `RESEND_API_KEY` and `EMAIL_FROM` in VPS `.env` / Docker build secrets.
* Clerk Dashboard: LMS webhook URL + `user.created` event (can coexist with Core webhook).
* Email failure **must not** block webhook — already handled via `dispatchWelcomeEmail` + `after()`.

### Future: background jobs (Inngest / Trigger.dev)

Replace `after(() => dispatchWelcomeEmail(...))` with `inngest.send({ name: 'email/welcome', data })` — keep `sendWelcomeEmail` unchanged. Queue workers call the same `lib/email` helpers.
