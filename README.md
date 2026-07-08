# JepangKu LMS

Platform belajar bahasa Jepang (JLPT N5–N1) — bagian dari ekosistem JepangKu. Konten & progress di **DB LMS**; identitas, SSO, dan gamifikasi via **JepangKu Core**.

| Status | Keterangan |
| :--- | :--- |
| Auth gate | **Clerk** (`proxy.ts`) |
| Core JWT | Client sync (`CoreSessionSync` → `POST /api/auth/core-token`) |
| Fase 1 integrasi | ✅ coded — award XP, admin gate, verify JWT |
| Dev lokal | Core di `:8080`, LMS di `:3001` (beda port dari News) |

📘 **Integrasi:** [docs/CORE_INTEGRATION_STATUS.md](docs/CORE_INTEGRATION_STATUS.md) · **Arsitektur:** [docs/ECOSYSTEM.md](docs/ECOSYSTEM.md) · **Runbook:** [jepangku-core/docs/PHASE0-PHASE1.md](../jepangku-core/docs/PHASE0-PHASE1.md)

## Stack

Bun · Next.js 16 · React 19 · Clerk · Prisma · PostgreSQL · Tailwind v4 · Shadcn · `lib/core/`

## Quick start

```bash
bun install
cp .env.example .env
bun run db:generate
bun run db:push
bun run db:seed
bun dev    # default :3000 — gunakan PORT=3001 jika News juga jalan
```

Env minimal — lihat [`.env.example`](.env.example):

```env
DATABASE_URL=postgresql://postgres:@localhost:5432/jepangku_lms
JEPANGKU_CORE_API_URL=http://localhost:8080
JEPANGKU_CORE_JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
JEPANGKU_CORE_JWT_ISSUER=https://core.jepangku.com
JEPANGKU_CORE_JWT_AUDIENCE=jepangku
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
```

Sync JWT public key dari Core:

```bash
cd ../jepangku-core && bun run jwt:sync-public-key-to-clients
```

Jalankan Core + News + LMS bersamaan: lihat [docs/CORE_INTEGRATION_STATUS.md](docs/CORE_INTEGRATION_STATUS.md) § dev lokal.

## Struktur

```text
app/              # Routing (thin layer)
features/         # Domain logic (learning, quiz, gamification UI)
lib/core/         # Client Core — JWT, award XP, leaderboard
lib/auth/         # Clerk + user anchor (FK)
prisma/           # DB LMS — User.id = Clerk ID (jangkar)
docs/             # Dokumentasi
```

Schema **Core** (canonical): [jepangku-core/docs/](../jepangku-core/docs/) — jangan edit salinan lokal.

## Dokumentasi

| Dokumen | Isi |
| :--- | :--- |
| [docs/CORE_INTEGRATION_STATUS.md](docs/CORE_INTEGRATION_STATUS.md) | Status integrasi & blocker prod |
| [docs/ECOSYSTEM.md](docs/ECOSYSTEM.md) | Batas LMS vs Core vs News |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Arsitektur feature-based |
| [DESIGN.md](DESIGN.md) | Panduan UI/UX |
| [sitemap.md](sitemap.md) | URL routing SSOT |
| [docs/PROGRESS.md](docs/PROGRESS.md) | Tracker implementasi |
| [AGENTS.md](AGENTS.md) | Aturan coding agents |

## Branching

- `main` — stabil, buildable
- `dev/<nama>` — workspace developer (contoh: `dev-kris`)

PR ke `main` setelah review tim.
