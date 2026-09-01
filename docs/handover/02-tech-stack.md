# 02 — Tech Stack & Dependensi

Snapshot versi dari `package.json` per September 2026.

---

## Ringkasan stack

| Layer | Teknologi | Versi (indikatif) |
| :--- | :--- | :--- |
| **Runtime / package manager** | Bun | (lihat `bun --version` lokal) |
| **Framework** | Next.js (App Router) | 16.2.11 |
| **UI library** | React | 19.2.4 |
| **Bahasa** | TypeScript | 5.9.3 |
| **Auth** | Clerk (`@clerk/nextjs`) | 7.5.x |
| **Auth ekosistem** | Core JWT (`jose`) | 6.2.x |
| **Database** | PostgreSQL + Prisma | Prisma 7.8.0, `@prisma/adapter-pg` |
| **Styling** | Tailwind CSS v4 | 4.3.2 |
| **Komponen UI** | Shadcn UI + Radix | shadcn 4.12.0 |
| **Validasi** | Zod | 4.4.x |
| **State (client)** | Zustand | 5.0.x (quiz store) |
| **Server cache (client)** | TanStack Query | 5.101.x (penggunaan terbatas) |
| **Pembayaran** | Midtrans | `midtrans-client` 1.4.x |
| **Object storage** | Cloudflare R2 | `@aws-sdk/client-s3` 3.x |
| **Email** | Resend + React Email | resend 6.x |
| **Observability** | Sentry | `@sentry/nextjs` 10.68.x |
| **Testing unit** | Bun test | built-in |
| **Testing E2E** | Playwright | 1.61.x |
| **Excel/CSV** | ExcelJS | 4.4.x |
| **Video player** | react-player | 3.4.x |
| **Charts** | Recharts | 3.10.x |
| **Animasi** | Motion | 12.x |
| **Logging** | Pino | 10.x |

---

## Infrastruktur & layanan eksternal

| Layanan | Penggunaan di LMS |
| :--- | :--- |
| **Clerk** | SSO login (shared app dengan News & Core) |
| **JepangKu Core** | JWT claims, award XP, leaderboard, profil global |
| **PostgreSQL** | Database LMS mandiri |
| **Cloudflare R2** | Upload avatar, cover kursus/live class, badge, audio Choukai tryout |
| **Midtrans** | Pembayaran Snap + Core API |
| **Resend** | Email transaksional (welcome, enrollment activated, live class reminder) |
| **Sentry** | Error tracking + tunnel `/monitoring` |
| **YouTube** | Embed video lesson (bukan DRM penuh) |
| **Google Analytics / Search Console** | Admin settings (opsional) |

---

## Skrip `bun` penting

| Perintah | Fungsi |
| :--- | :--- |
| `bun dev` | Dev server Next.js (default `:3000`; gunakan `PORT=3001` jika News juga jalan) |
| `bun run build` | Production build |
| `bun run start` | Jalankan build production |
| `bun test` | Unit tests (Bun test runner) |
| `bun run test:e2e` | Playwright E2E |
| `bun run db:generate` | Generate Prisma client |
| `bun run db:push` | Sync schema ke DB lokal (dev) |
| `bun run db:migrate` | Migrasi dev |
| `bun run db:migrate:deploy` | Migrasi production |
| `bun run db:seed` | Seed data contoh (N5, tryout, live class, badge) |
| `bun run db:studio` | Prisma Studio GUI |
| `bun run db:reset` | Reset DB + migrasi ulang |
| `bun run verify:core-gamification` | Verifikasi integrasi award XP ke Core |
| `bun run email:dev` | Preview template React Email (`:3001`) |
| `bun run kana:generate` | Generate manifest kana dari Excel |
| `bun run placement:generate` | Generate paper tes penempatan dari Excel |
| `bun run lesson:backfill-types` | Backfill `Lesson.lessonType` |
| `bun run course-import:backfill-external-ids` | Backfill external ID impor kursus |

---

## Konvensi teknis penting

### Next.js 16

- **App Router** — RSC untuk initial load, Server Actions untuk mutasi
- **`proxy.ts`** (bukan `middleware.ts`) — auth gate & redirect
- Route groups: `(marketing)`, `(student)`, `(admin)`, `(authentication)`

### Tailwind CSS v4

- Tidak ada `tailwind.config.js` — tema di `app/globals.css` (`@theme inline`)
- Wajib pakai token semantic (`primary`, `muted-foreground`) atau `brand-*` — hindari hex hardcoded

### Prisma + PostgreSQL

- **Satu titik koneksi:** `lib/prisma.ts` (`PrismaClient` + `PrismaPg` + `pg.Pool`)
- Jangan `new PrismaClient()` di luar `lib/prisma.ts`
- Pool dibatasi via `PG_POOL_MAX` (default 10)

### Testing

- Unit: `tests/` + `bun test`
- E2E: `playwright.config.ts` + `e2e/` atau `tests/e2e/`
- Strategi: [TESTING.md](../TESTING.md)

---

## Environment variables (ringkas)

Template lengkap: [`.env.example`](../../.env.example).

| Kategori | Variabel kunci |
| :--- | :--- |
| Database | `DATABASE_URL`, `PG_POOL_MAX` |
| Core | `JEPANGKU_CORE_API_URL`, `JEPANGKU_CORE_JWT_PUBLIC_KEY`, `JEPANGKU_CORE_JWT_ISSUER`, `JEPANGKU_CORE_JWT_AUDIENCE`, `JEPANGKU_CORE_SERVICE_TOKEN` |
| Clerk | `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_WEBHOOK_SECRET` |
| App | `NEXT_PUBLIC_APP_URL` |
| Payment | `MIDTRANS_SERVER_KEY`, `MIDTRANS_IS_PRODUCTION`, `PAYMENT_CHECKOUT_MODE` (`snap` \| `core`) |
| Media | `R2_*` (account, bucket, keys) |
| Email | `RESEND_API_KEY`, `EMAIL_FROM` |
| Partner API | `LMS_PARTNER_API_KEY` |
| Observability | `SENTRY_DSN`, `SENTRY_AUTH_TOKEN` (build) |
| Cron | `LMS_CRON_SECRET` |

Detail operasional: [07-operations-runbook.md](./07-operations-runbook.md).
