# 09 — Deploy & Infrastruktur

Dokumen ini merangkum **cara LMS di-deploy** ke staging dan production. Sumber kanonik pipeline: [.github/workflows/deploy.yml](../../.github/workflows/deploy.yml), [Dockerfile](../../Dockerfile).

**Owner infra:** DevOps / Webekspres (VPS, GitHub secrets) · **Owner app:** tim LMS · **Core di VPS:** tim Core Backend.

---

## Ringkasan lingkungan

| | Staging | Production |
| :--- | :--- | :--- |
| **URL publik** | `https://dev.kursus.jepangku.com` | `https://kursus.jepangku.com` |
| **Path VPS** | `/opt/jepangku-staging` | `/opt/jepangku` |
| **Env file LMS** | `/opt/jepangku-staging/lms/.env` | `/opt/jepangku/lms/.env` |
| **Health check (localhost VPS)** | `http://127.0.0.1:3003/` | `http://127.0.0.1:3002/` |
| **Docker network** | `jepangku_staging_net` | `jepangku_net` |
| **DB container** | `jepangku_staging_db` | `jepangku_db` |
| **DB name** | `stg_jepangku_lms` | `jepangku_lms` |
| **Core API (internal Docker)** | `http://jepangku_staging_core:8081` | `http://jepangku-core:8080` |
| **Image tag** | `staging` | `latest` |
| **Migrate tag** | `migrate-staging` | `migrate-latest` |

---

## Container image

| Item | Nilai |
| :--- | :--- |
| Registry | `ghcr.io/webekspres/jepangku-lms` |
| Target **runner** | Next.js app (`node server.js`, port 3002 di container) |
| Target **migrator** | `bunx prisma migrate deploy` saja |

Tag yang di-push setiap deploy:

- App: `:staging` / `:latest` + `:sha-<commit>`
- Migrator: `:migrate-staging` / `:migrate-latest` + `:migrate-sha-<commit>`

---

## Branch → deploy trigger

| Branch / event | Job | Hasil |
| :--- | :--- | :--- |
| Push `staging` | test → build → **deploy-staging** | Auto deploy ke staging VPS |
| Push `main` | test → build → **deploy-production** | Auto deploy ke production VPS |
| Push branch dev (contoh workspace) | test (+ build di CI) | **Tidak** deploy VPS — hanya validasi |
| `workflow_dispatch` | Pilih `staging` atau `production` | Manual deploy |

**Catatan:** Branch workspace developer (`dev/<nama>`, dll.) **tidak** trigger deploy. Merge ke `staging` atau `main` dulu.

Workflow file: [.github/workflows/deploy.yml](../../.github/workflows/deploy.yml)

---

## GitHub Environments & secrets

Secrets disimpan per **GitHub Environment** (`staging`, `production`), bukan di repo `.env`.

### Secrets yang dipakai workflow

| Secret | Dipakai untuk |
| :--- | :--- |
| `CLERK_PUBLISHABLE_KEY` | Build arg `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` |
| `SENTRY_DSN` | Build + runtime observability |
| `SENTRY_AUTH_TOKEN` | Upload source maps saat build |
| `SENTRY_ORG` | Sentry project |
| `SENTRY_PROJECT` | Sentry project |
| `VPS_HOST` | SSH deploy target |
| `VPS_PORT` | SSH port |
| `VPS_USER` | SSH user |
| `VPS_SSH_KEY` atau `VPS_SSH_KEY_B64` | Private key deploy |

Runtime secrets (Clerk secret, DB password, Midtrans, R2, dll.) ada di **VPS** `lms/.env` — disinkronkan sebagian dari Core via script (lihat bawah).

### Build args (baked at image build)

| Build arg | Staging | Production |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | `https://dev.kursus.jepangku.com` | `https://kursus.jepangku.com` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `.../sign-in` | `.../sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `.../sign-up` | `.../sign-up` |
| `NEXT_PUBLIC_CORE_INTEGRATION_UI` | `true` | `true` |
| `JEPANGKU_CORE_API_URL` | `http://jepangku_staging_core:8081` | `http://jepangku-core:8080` |

**Penting:** `NEXT_PUBLIC_*` di-inline saat **docker build** — ubah URL publik harus **rebuild image**, bukan hanya edit `.env` runtime.

---

## Alur deploy otomatis (CI)

```mermaid
sequenceDiagram
  participant GH as GitHub Actions
  participant GHCR as ghcr.io
  participant VPS as VPS Docker
  participant DB as PostgreSQL

  GH->>GH: bun test + lint
  GH->>GHCR: push runner + migrator images
  GH->>VPS: SSH deploy script
  VPS->>GHCR: docker pull migrator
  VPS->>DB: prisma migrate deploy
  VPS->>GHCR: docker compose pull lms
  VPS->>VPS: docker compose up -d lms
  VPS->>VPS: health check localhost
```

### Langkah di VPS (dijalankan CI)

1. `cd /opt/jepangku[-staging]`
2. Source `.env` root + sync `lms/.env` dari Core (jika script ada)
3. Override `JEPANGKU_CORE_API_URL` ke URL Docker internal yang benar
4. `docker pull` image **migrator** (tag `migrate-sha-<commit>`)
5. `docker run` migrator → `prisma migrate deploy`
6. `docker compose pull lms` + `docker compose up -d --force-recreate lms`
7. Health check curl ke port lokal (3003 staging / 3002 prod)
8. Docker prune (safe)

Script sync env (jika ada di VPS):

```bash
python3 deploy/scripts/vps-sync-client-env-from-core.py --client lms
```

Path relatif dari **root deploy stack** di VPS (`/opt/jepangku` atau `/opt/jepangku-staging`), bukan dari repo LMS saja.

---

## Deploy manual (workflow_dispatch)

1. GitHub → repo **jepangkuLMS** → Actions → **deploy**
2. **Run workflow** → pilih branch (biasanya `staging` atau `main`)
3. Pilih environment: `staging` atau `production`
4. Pantau log job `build` → `deploy-staging` / `deploy-production`

---

## Rollback (darurat)

Tidak ada rollback otomatis. Prosedur manual:

1. Identifikasi commit/image SHA terakhir yang sehat (`ghcr.io/webekspres/jepangku-lms:sha-<commit>`)
2. SSH ke VPS → `cd /opt/jepangku` (atau staging)
3. Set `LMS_IMAGE_TAG` / override compose ke tag SHA lama (sesuai setup compose di VPS)
4. `docker compose pull lms && docker compose up -d --force-recreate lms`
5. **Jangan** rollback migrator DB kecuali tim dev setuju — migrasi Prisma mungkin irreversible

Jika deploy gagal di **migrate deploy** — cek log container migrator; jangan force-recreate app dengan schema mismatch.

---

## Migrasi database production

| Perintah | Kapan |
| :--- | :--- |
| Otomatis via CI | Setiap deploy (image migrator) |
| Manual di VPS | Darurat — same image migrator tag |

Connection string saat migrate (dari workflow):

- Staging: `postgresql://${DB_USER}:${DB_PASSWORD}@jepangku_staging_db:5432/stg_jepangku_lms`
- Prod: `postgresql://${DB_USER}:${DB_PASSWORD}@jepangku_db:5432/jepangku_lms`

---

## Webhook & cron di production

Setelah deploy, pastikan URL eksternal mengarah ke domain yang benar:

| Endpoint | Registrasi di |
| :--- | :--- |
| `POST /api/webhooks/clerk` | Clerk Dashboard → Webhooks |
| `POST /api/webhooks/midtrans` | Midtrans Dashboard → Notification URL |
| `POST /api/cron/live-class-reminders` | Cron VPS / scheduler (header `LMS_CRON_SECRET`) |
| `POST /api/core/retry-xp` | Cron VPS (header `LMS_CRON_SECRET`) |

Midtrans finish URL (Snap): `https://kursus.jepangku.com/dashboard/pembayaran/return`

---

## Troubleshooting deploy

| Gejala | Cek |
| :--- | :--- |
| Build gagal `CLERK_PUBLISHABLE_KEY is empty` | Secret di GitHub Environment |
| Health check timeout | `docker logs` container lms; port mapping 3002/3003 |
| Migrate deploy failed | Log migrator; `prisma migrate status` via migrator image |
| Core JWT / XP tidak jalan setelah deploy | `JEPANGKU_CORE_API_URL` di `lms/.env` + public key sync |
| `NEXT_PUBLIC_*` salah | Rebuild image — runtime `.env` tidak cukup |
| Disk full di VPS | Workflow sudah prune; manual `docker system df` |

**Eskalasi:** DevOps/Webekspres (VPS/CI) · Core networking → tim Core Backend · App logic → tim dev LMS.

---

## Checklist sebelum merge ke `main`

- [ ] PR lulus `bun test` + lint di CI
- [ ] Migrasi Prisma reviewed (destructive?)
- [ ] Env baru didokumentasikan di `.env.example`
- [ ] `NEXT_PUBLIC_*` changes understood — perlu rebuild
- [ ] Staging deploy sukses & smoke test
- [ ] Webhook Midtrans/Clerk OK di staging

Lihat juga: [07-operations-runbook.md](./07-operations-runbook.md)
