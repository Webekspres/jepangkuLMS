# 🧪 JepangKu LMS Testing Strategy (Phase 1)

Dokumen ini menjadi acuan testing default untuk pengembangan JepangKu LMS.

## 1) Tooling yang dipakai

- **Logic / unit / integration ringan:** `bun test`
- **UI end-to-end (E2E):** Playwright (`@playwright/test`)

Kombinasi ini dipilih karena:
- Bun test cepat untuk logic murni (formatter, mapper, validator, helper, scoring).
- Playwright stabil untuk alur user nyata lintas halaman (routing, form, CTA, auth shell, public pages).

## 2) Scope testing yang direkomendasikan

### A. Bun test (unit / logic)
Fokuskan ke kode yang deterministic dan tidak perlu browser:
- `lib/**` (utils, parser, helper)
- `features/**/actions` yang bisa diisolasi
- mapping/transform data (mis. data presenter)
- fungsi validasi dan kalkulasi skor/XP (saat sudah ada)

### B. Playwright (E2E UI)
Fokuskan skenario lintas route dan interaksi user:
- Public marketing flow (`/`, `/kursus`, `/kursus/[courseSlug]`, `/tryout`, `/tentang`)
- Static support pages (`/cara-belajar`, `/hubungi`)
- Legal pages (`/syarat-ketentuan`, `/kebijakan-privasi`)
- Auth shell (`/sign-in`, `/sign-up`) untuk validasi UI/state form

> Catatan: karena integrasi Core/Clerk belum final, E2E auth saat ini fokus ke UI behavior dan navigasi, bukan login sukses end-to-end.

## 3) Konvensi struktur file test

```text
tests/
├── unit/                          # bun test
│   ├── admin-contact.test.ts
│   ├── course-detail-data.test.ts
│   ├── landing-data.test.ts
│   └── marketing-nav-links.test.ts
└── e2e/                           # playwright
    ├── helpers.ts                 # waitForAppReady (splash)
    ├── public-pages.spec.ts
    ├── marketing-nav.spec.ts
    └── auth-forms.spec.ts

playwright.config.ts               # E2E config + webServer (port 3001)
```

### Perintah

```bash
bun run test              # unit/logic (hanya tests/unit — lihat bunfig.toml)
bun run test:coverage     # unit + laporan coverage
bun run test:e2e          # Playwright E2E (auto-start dev server)
bun run test:e2e:ui       # Playwright UI mode
```

**Setup pertama (browser):** `bunx playwright install chromium`

### Penting: jangan campur runner

| Runner | File | Perintah |
|--------|------|----------|
| **Bun** | `tests/unit/*.test.ts` | `bun run test` |
| **Playwright** | `tests/e2e/*.spec.ts` | `bun run test:e2e` |

`bun test` tanpa `bunfig.toml` akan mencoba menjalankan `*.spec.ts` sebagai Bun test → error `test.describe() did not expect...` karena API Playwright hanya valid di runner Playwright.

`bunfig.toml` membatasi root test ke `tests/unit` agar `bun test --coverage` aman.

## 4) Quality gate minimum sebelum merge PR

- Jalankan unit/logic test: `bun test`
- Jalankan E2E smoke test utama (Playwright) minimal untuk route yang disentuh
- Jika belum ada test untuk area tersebut, tambahkan minimal 1 skenario regresi

## 5) Prioritas adopsi bertahap (MVP)

1. Mulai dari smoke test public pages + navbar/footer links.
2. Tambah test untuk form behavior di sign-in/sign-up (validasi UI).
3. Setelah dashboard student stabil, tambah E2E untuk alur belajar + kuis.
4. Setelah auth core aktif, ubah test auth dari UI-only ke real integration flow.

