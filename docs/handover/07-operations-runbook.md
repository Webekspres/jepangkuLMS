# 07 — Operations Runbook

Panduan operasional untuk menjalankan, menguji, dan men-deploy JepangKu LMS.

---

## Quick start (dev lokal)

```bash
# 1. Clone & install
bun install

# 2. Environment
cp .env.example .env
# Edit DATABASE_URL, CLERK_*, JEPANGKU_CORE_*

# 3. Database
bun run db:generate
bun run db:push
bun run db:seed

# 4. Dev server
bun dev
# Default :3000 — gunakan PORT=3001 jika News juga jalan di :3000
PORT=3001 bun dev
```

Akses: `http://localhost:3001` (atau port yang dipilih).

---

## Dev multi-app (Core + News + LMS)

| App | Port | Repo |
| :--- | :--- | :--- |
| Core Backend | `:8080` | `jepangku-core` |
| Portal Berita | `:3000` | repo News terpisah |
| LMS | `:3001` | repo ini |

**Langkah:**

1. Jalankan Core: `cd ../jepangku-core && bun dev` (atau sesuai runbook Core)
2. Sync JWT public key:
   ```bash
   cd ../jepangku-core && bun run jwt:sync-public-key-to-clients
   ```
3. Set `JEPANGKU_CORE_API_URL=http://localhost:8080` di `.env` LMS
4. Jalankan LMS: `PORT=3001 bun dev`

Runbook lintas-repo: [jepangku-core/docs/PHASE0-PHASE1.md](../../jepangku-core/docs/PHASE0-PHASE1.md)

Integrasi status: [CORE_INTEGRATION_STATUS.md](../CORE_INTEGRATION_STATUS.md)

---

## Environment variables

Template lengkap: [`.env.example`](../../.env.example)

### Wajib (minimal dev)

```env
DATABASE_URL=postgresql://postgres:@localhost:5432/jepangku_lms
JEPANGKU_CORE_API_URL=http://localhost:8080
JEPANGKU_CORE_JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
JEPANGKU_CORE_JWT_ISSUER=https://core.jepangku.com
JEPANGKU_CORE_JWT_AUDIENCE=jepangku
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### Opsional / fitur tertentu

| Variabel | Fitur |
| :--- | :--- |
| `JEPANGKU_CORE_SERVICE_TOKEN` | Award XP ke Core |
| `MIDTRANS_SERVER_KEY` | Pembayaran |
| `PAYMENT_CHECKOUT_MODE` | `snap` atau `core` (default: core) |
| `R2_*` | Upload avatar, cover, badge, audio Choukai |
| `RESEND_API_KEY` | Email transaksional |
| `CLERK_WEBHOOK_SECRET` | Webhook welcome email |
| `LMS_PARTNER_API_KEY` | Partner API katalog |
| `LMS_CRON_SECRET` | Proteksi endpoint cron |
| `LMS_DEV_ADMIN_BYPASS` | Dev only — skip admin role check |
| `SENTRY_DSN` | Error tracking |

**Catatan build Docker:** `NEXT_PUBLIC_*` di-inline saat build — set di CI/Dockerfile, bukan hanya VPS `.env` runtime.

---

## Branching & workflow

| Branch | Peran |
| :--- | :--- |
| `main` | Stabil, buildable |
| `dev/<nama>` | Workspace developer |

PR ke `main` setelah review tim.

---

## Testing

Detail: [TESTING.md](../TESTING.md)

| Perintah | Fungsi |
| :--- | :--- |
| `bun test` | Unit tests (`tests/unit/`) |
| `bun run test:coverage` | Unit + coverage report |
| `bun run test:e2e` | Playwright E2E (auto-start dev server port 3001) |
| `bun run test:e2e:ui` | Playwright UI mode |
| `bun run verify:core-gamification` | Verifikasi integrasi award XP Core |

Setup pertama Playwright:

```bash
bunx playwright install chromium
```

**UAT manual:** [UAT_CHECKLIST.md](../UAT_CHECKLIST.md)

---

## API routes penting

### Webhooks

| Endpoint | Fungsi | Secret |
| :--- | :--- | :--- |
| `POST /api/webhooks/clerk` | `user.created` → welcome email (Resend) | `CLERK_WEBHOOK_SECRET` (Svix) |
| `POST /api/webhooks/midtrans` | Settlement pembayaran → enrollment ACTIVE | Midtrans signature |

### Auth

| Endpoint | Fungsi |
| :--- | :--- |
| `POST /api/auth/core-token` | Exchange Clerk → Core JWT; set cookie |

### Pembayaran

| Endpoint | Fungsi |
| :--- | :--- |
| `GET /api/payments/[paymentId]/events` | SSE realtime status pembayaran |
| `POST /api/payments/[paymentId]/sync` | Reconcile status Midtrans (Status API) |
| `GET /api/payments/[paymentId]/qris` | Proxy QRIS image (iOS save) |

Settlement SoT: **webhook** — bukan callback browser Snap saja. Detail: [PAYMENT_MODEL.md](../PAYMENT_MODEL.md).

### Cron (protected)

| Endpoint | Fungsi | Auth |
| :--- | :--- | :--- |
| `POST /api/cron/live-class-reminders` | Email reminder live class harian (00:00 WIB) | `LMS_CRON_SECRET` |
| `POST /api/core/retry-xp` | Drain outbox XP pending ke Core | `LMS_CRON_SECRET` |

### Partner API

| Endpoint | Fungsi |
| :--- | :--- |
| `GET /api/v1/partner/courses` | Katalog kursus publik |
| `GET /api/v1/partner/live-classes` | Katalog live class publik |

Header: `X-API-Key: <LMS_PARTNER_API_KEY>`. Detail: [PARTNER_API.md](../PARTNER_API.md).

---

## Email

Arsitektur: Clerk `user.created` → webhook → `dispatchWelcomeEmail()` (non-blocking via `after()`).

| Path | Peran |
| :--- | :--- |
| `lib/email/` | Logic pengiriman |
| `emails/` | Template React Email |

Preview lokal:

```bash
bun run email:dev   # :3001
```

---

## Media (Cloudflare R2)

Upload: avatar profil, cover kursus/live class, badge CMS, audio Choukai tryout.

Env: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`.

Cleanup orphaned Choukai keys: `lib/media/tryout-chokai-r2-cleanup.ts`

---

## Pembayaran (operasional)

| Env | Fungsi |
| :--- | :--- |
| `MIDTRANS_SERVER_KEY` | Server key Midtrans |
| `MIDTRANS_IS_PRODUCTION` | `true` / `false` |
| `PAYMENT_CHECKOUT_MODE` | `snap` (popup) atau `core` (method picker) |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | Wajib jika mode `snap` |

**Flip Snap → Core:** set `PAYMENT_CHECKOUT_MODE=core` setelah Core API Production aktif.

Finish URL Snap: `/dashboard/pembayaran/return` (harus match MAP Midtrans).

---

## Observability (Sentry)

- Package: `@sentry/nextjs`
- Tunnel: `/monitoring` (hindari ad-blocker)
- Init: client/server/edge configs
- Build: `SENTRY_AUTH_TOKEN` di CI/Docker

---

## Deploy (catatan)

| Item | Status |
| :--- | :--- |
| Host DB production | Belum dipilih — lihat [DATABASE.md](../DATABASE.md) |
| Domain prod | `kursus.jepangku.com` |
| Core staging | `core-staging.jepangku.com` (Clerk pk_test) |
| Core prod | `core.jepangku.com` (Clerk pk_live, hanya `*.jepangku.com`) |

**Checklist deploy pertama:**

1. Provision PostgreSQL + set `DATABASE_URL`
2. `bun run db:migrate:deploy`
3. Set semua env production (Clerk live, Core, Midtrans prod, R2, Resend, Sentry)
4. Build dengan `NEXT_PUBLIC_APP_URL=https://kursus.jepangku.com`
5. Verifikasi Core JWT exchange end-to-end
6. Register webhooks Clerk & Midtrans ke URL production
7. Set `LMS_PARTNER_API_KEY` jika News butuh katalog
8. Konfigurasi cron eksternal (VPS cron / Cloudflare Workers) untuk live-class-reminders & retry-xp

---

## Troubleshooting umum

| Masalah | Solusi |
| :--- | :--- |
| Core JWT tidak tersedia | Cek `JEPANGKU_CORE_API_URL`, public key, Core running di :8080 |
| XP tidak naik di dashboard | Jalankan `bun run verify:core-gamification`; cek `LmsXpEvent.coreStatus` |
| Pembayaran stuck PENDING | Cek webhook Midtrans; manual sync via "Cek status" atau `POST .../sync` |
| Admin tidak bisa akses `/admin` | Cek role `LMS_ADMIN` di DB atau Core JWT roles; dev: `LMS_DEV_ADMIN_BYPASS=true` |
| Partner API 503 | `LMS_PARTNER_API_KEY` belum diset di env |
| Hot-reload DB connection exhausted | Pastikan hanya `lib/prisma.ts` yang buat client; restart dev server |
