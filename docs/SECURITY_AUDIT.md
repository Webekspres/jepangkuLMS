# 🔒 Security Audit Report — Jepangku LMS

> **Audit Date:** 2026-07-01
> **Scope:** Full codebase scan (app/, lib/, features/, prisma/, Dockerfile, CI/CD, dependencies)
> **Severity Scale:** 🔴 Critical | 🟠 High | 🟡 Medium | 🔵 Low | ⚪ Informational

---

## 📋 Ringkasan Eksekutif

| Area | 🔴 Critical | 🟠 High | 🟡 Medium | 🔵 Low | ⚪ Info |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Dependency Vulnerabilities | 0 | 1 | 7 | 1 | 0 |
| Code/Configuration Issues | 0 | 4 | 8 | 3 | 5 |
| **Total** | **0** | **5** | **15** | **4** | **5** |

**Progres global remediasi:** ⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ **0%**

---

## 🔴 Critical (0)

*Tidak ditemukan kerentanan critical pada saat audit.*

---

## 🟠 High (5)

### H-01: Content-Security-Policy Mengizinkan `unsafe-eval` & `unsafe-inline`

**Lokasi:** `next.config.ts` — baris CSP
**Deskripsi:**
```ts
`script-src 'self' 'unsafe-eval' 'unsafe-inline' ${CLERK_CSP_ORIGINS}`
```
Penggunaan `'unsafe-eval'` dan `'unsafe-inline'` pada directive `script-src` menonaktifkan perlindungan XSS utama dari CSP. Jika ada celah XSS di aplikasi, attacker bisa mengeksekusi script arbiter di browser korban.

**Dampak:** XSS dapat terjadi jika ada injection vulnerability di komponen mana pun.

**Rekomendasi:**
- Gunakan `'nonce-{random}'` atau `'strict-dynamic'` untuk script yang legitimate.
- Implementasi strict CSP dengan hash untuk inline script.
- `unsafe-eval` mungkin diperlukan oleh Clerk/Next.js — verifikasi apakah masih dibutuhkan, lalu gunakan `trusted-types` sebagai kompensasi.

---

### H-02: Dev Admin Bypass Tidak Memiliki Safeguard Produksi

**Lokasi:** `lib/auth/lms-roles.ts:31-36`
**Deskripsi:**
```ts
export function isDevAdminBypassEnabled(): boolean {
  return (
    process.env.NODE_ENV === 'development' &&
    process.env.LMS_DEV_ADMIN_BYPASS === 'true'
  );
}
```
Meskipun sudah ada pengecekan `NODE_ENV === 'development'`, env var bisa dioverride. Jika ada kesalahan konfigurasi staging/production (mis. Docker build salah set env), semua user bisa menjadi admin.

**Dampak:** Akses admin tidak terautentikasi ke seluruh CMS jika env salah konfigurasi.

**Rekomendasi:**
- Tambahkan fail-safe hardcoded di kode:
  ```ts
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('LMS_DEV_ADMIN_BYPASS is FORBIDDEN outside development');
  }
  ```
- Atau gunakan compile-time constant yang tidak bisa dioverride runtime.

---

### H-03: Hardcoded Fallback Payment Account Number

**Lokasi:** `lib/payment/settings.ts:3-5`
**Deskripsi:**
```ts
export const PAYMENT_SETTINGS = {
  bankName: process.env.PAYMENT_BANK_NAME ?? 'BCA',
  accountName: process.env.PAYMENT_ACCOUNT_NAME ?? 'PT Jepangku Indonesia',
  accountNumber: process.env.PAYMENT_ACCOUNT_NUMBER ?? '1234567890',
};
```
Jika `PAYMENT_ACCOUNT_NUMBER` atau `PAYMENT_BANK_NAME` tidak di-set di production, data payment fallback (termasuk nomor rekening palsu `1234567890`) akan terekspos ke frontend. File ini juga bisa dibaca oleh siapapun yang memiliki akses ke source code.

**Dampak:** Informasi payment palsu atau salah bisa ditampilkan ke user, menyebabkan transaksi gagal atau fraud.

**Rekomendasi:**
- Hilangkan default value — throw error jika env tidak di-set:
  ```ts
  const accountNumber = process.env.PAYMENT_ACCOUNT_NUMBER;
  if (!accountNumber) throw new Error('PAYMENT_ACCOUNT_NUMBER is required in production');
  ```

---

### H-04: Dependency — hono CORS Reflects Any Origin With Credentials

**CVE:** [GHSA-88fw-hqm2-52qc](https://github.com/advisories/GHSA-88fw-hqm2-52qc)
**Paket:** `hono` (via dependensi transitif)
**Severity:** High — 7.5/10
**Deskripsi:** CORS Middleware in hono reflects any Origin header value when credentials are enabled, enabling potential data theft via malicious origins.
**Rekomendasi:** Update ke patch version jika tersedia, atau evaluasi apakah hono masih diperlukan sebagai dependensi.

---

### H-05: Auth Endpoints Tidak Dilindungi Rate Limiting

**Lokasi:** `app/api/auth/core-token/route.ts`, `app/api/auth/sign-out/route.ts`
**Deskripsi:**
Endpoint kritis seperti POST `/api/auth/core-token` — yang melakukan exchange token dan menetapkan cookie autentikasi — tidak memiliki rate limiting. Walaupun ada rate limiter di `lib/rate-limit/`, tidak digunakan di route ini.

**Dampak:** Brute-force attack terhadap endpoint autentikasi, potensi account enumeration (timing side-channel via error messages).

**Rekomendasi:**
- Apply `checkRateLimit()` pada endpoint `/api/auth/*` dengan limit ketat (mis. 10 request per menit per IP/userId).

---

## 🟡 Medium (15)

### M-01: Dependency — postcss XSS via Unescaped `</style>` in CSS Stringify Output

**CVE:** [GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93)
**Paket:** `postcss` (via Tailwind CSS)
**Severity:** Moderate — 6.4/10
**Deskripsi:** CSS Stringify output tidak meng-escape `</style>` tag, memungkinkan XSS pada aplikasi yang me-render output PostCSS di `<style>` tag.
**Rekomendasi:** Update ke postcss >= 8.5.0.

---

### M-02: Dependency — uuid Missing Buffer Bounds Check

**CVE:** [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq)
**Paket:** `uuid`
**Severity:** Moderate — 5.3/10
**Deskripsi:** Fungsi `stringify()` tidak memvalidasi panjang buffer sebelum akses, bisa cause crash.
**Rekomendasi:** Update ke uuid >= 11.1.0.

---

### M-03: Dependency — @hono/node-server Middleware Bypass via Repeated Slashes

**CVE:** [GHSA-92pp-h63x-v22m](https://github.com/advisories/GHSA-92pp-h63x-v22m)
**Paket:** `@hono/node-server`
**Severity:** Moderate — 5.9/10
**Deskripsi:** Path seperti `///foo/bar` bisa bypass middleware authentication karena path normalization.
**Rekomendasi:** Update dependency atau tambahkan URL normalization middleware.

---

### M-04: Dependency — hono Path Traversal on Windows

**CVE:** [GHSA-wwfh-h76j-fc44](https://github.com/advisories/GHSA-wwfh-h76j-fc44)
**Paket:** `hono`
**Severity:** Moderate — 5.9/10
**Deskripsi:** `serve-static` middleware memungkinkan path traversal pada Windows (backslash).
**Rekomendasi:** Update hono ke versi patch.

---

### M-05: Dependency — hono AWS Lambda Adapter Header Issues (3 advisories)

**CVE:** GHSA-j6c9-x7qj-28xf, GHSA-rv63-4mwf-qqc2, GHSA-wgpf-jwjq-8h8p
**Paket:** `hono`
**Severity:** Moderate — 5.3–5.9/10
**Deskripsi:** Multiple header injection issues in Lambda adapter.
**Rekomendasi:** Update hono.

---

### M-06: CSRF Protection Dinonaktifkan di Non-Production

**Lokasi:** `lib/security/csrf.ts:3`
**Deskripsi:**
```ts
if (process.env.NODE_ENV !== 'production') return null;
```
CSRF protection (`assertSameOriginPost`) completely disabled for non-production environments. Dev environment tetap bisa diakses via ngrok/public URL, dan staging bisa memiliki CSRF vulnerability.

**Dampak:** Staging environment tidak memiliki CSRF protection. Dev yang diekspos via ngrok juga vulnerable.

**Rekomendasi:**
- Hanya bypass untuk localhost, bukan semua non-production:
  ```ts
  const host = request.headers.get('host') || '';
  if (host === 'localhost:3000' || host === '127.0.0.1:3000') return null;
  ```

---

### M-07: Open Redirect Validation Tidak Cukup Ketat

**Lokasi:** `lib/auth/oauth-urls.ts:22-29`
**Deskripsi:**
```ts
if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) {
  return redirect;
}
```
Validasi hanya memblok `//` tapi tidak mencegah `/\evil.com` atau `\/evil.com`.

**Dampak:** Potensi open redirect yang bisa digunakan untuk phishing.

**Rekomendasi:**
- Gunakan URL constructor untuk validasi:
  ```ts
  try {
    const parsed = new URL(redirect, 'https://dummy.com');
    if (parsed.pathname !== redirect) return fallback;
  } catch { return fallback; }
  ```
- Atau maintain daftar allowlist path yang valid.

---

### M-08: File Upload Tidak Memvalidasi Ukuran untuk ZIP/XLSX Import

**Lokasi:** `app/api/admin/tryout/import/route.ts`, `app/api/admin/kursus/import/route.ts`
**Deskripsi:**
File upload untuk impor tryout (ZIP/XLSX) dan kursus (XLSX) tidak memiliki batas ukuran file. Audio upload memiliki limit 15MB, tapi ZIP/XLSX tidak.

**Dampak:** Potensi denial-of-service via upload file sangat besar yang menghabiskan memory server saat diproses (`Buffer.from(await file.arrayBuffer())`).

**Rekomendasi:**
- Tambahkan batas ukuran untuk setiap endpoint upload (mis. 20MB untuk ZIP, 5MB untuk XLSX).
- Gunakan streaming jika memungkinkan.

---

### M-09: In-Memory Rate Limiter Tidak Persisten

**Lokasi:** `lib/rate-limit/in-memory.ts`
**Deskripsi:**
In-memory rate limiter menyimpan state di memory proses. Semua data rate limit hilang saat server restart/hot-reload. Ini adalah fallback ketika Redis tidak available.

**Dampak:** Rate limit bisa di-reset dengan mudah oleh attacker yang mendeteksi restart.

**Rekomendasi:**
- Enable Redis di production (`REDIS_ENABLED=true`).
- Dokumentasikan requirement Redis untuk rate limiting yang efektif.

---

### M-10: Redis URL Tanpa Autentikasi Default

**Lokasi:** `lib/rate-limit/index.ts:4`
**Deskripsi:**
```ts
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
```
Default Redis URL tidak memiliki password. Jika Redis diekspos ke network (mis. di Docker compose tanpa network isolation), siapa pun bisa connect.

**Dampak:** Jika Redis terekspos, attacker bisa membaca/memanipulasi rate limit state dan berpotensi memicu DoS.

**Rekomendasi:**
- Set `REDIS_URL` wajib diisi di production (jangan pakai default).
- Gunakan Redis dengan password (`redis://:password@host:port`).

---

### M-11: Core JWT Cookie Path Terlalu Luas

**Lokasi:** `lib/auth/cookie-options.ts:12`
**Deskripsi:**
```ts
path: '/',
```
Core JWT cookie (`jepangku_core_jwt`) dikirim ke **semua path** di aplikasi. Cookie ini berisi JWT yang bisa digunakan untuk mengakses Core API atas nama user.

**Dampak:** Risiko lebih tinggi jika ada endpoint yang tidak sengaja mengekspos cookie.

**Rekomendasi:**
- Scope cookie ke path yang membutuhkan:
  ```ts
  path: '/api',
  ```
  Atau setidaknya dokumentasikan bahwa cookie ini sangat sensitif.

---

### M-12: TryoutExamProgress.answersJson — Raw JSON Tanpa Validasi

**Lokasi:** `prisma/schema.prisma` — model `TryoutExamProgress`
**Deskripsi:**
```prisma
answersJson     String   @db.Text
```
Jawaban tryout disimpan sebagai string JSON tanpa validasi skema atau struktur. Tidak ada jaminan bahwa JSON yang disimpan memiliki format yang benar.

**Dampak:** Potensi data corruption, parsing errors, atau NoSQL injection-like issues jika JSON tidak divalidasi saat write maupun read.

**Rekomendasi:**
- Simpan jawaban sebagai JSON column (PostgreSQL JSONB) jika versi Prisma mendukung.
- Atau gunakan Zod untuk validasi sebelum write dan setelah read.

---

### M-13: LessonComment.Content Disimpan Tanpa Sanitasi

**Lokasi:** `prisma/schema.prisma` — model `LessonComment`, `LessonCommentReply`
**Deskripsi:**
`content` disimpan sebagai `String @db.Text` tanpa sanitasi HTML. Meskipun React men-escape output secara default, jika ada komponen yang menggunakan `dangerouslySetInnerHTML` (saat ini tidak ditemukan), ini bisa jadi XSS vector.

**Dampak:** Potensi stored XSS jika di masa depan ada fitur rich text yang menggunakan innerHTML.

**Rekomendasi:**
- Saat ini aman (no innerHTML usage), tapi dokumentasikan sebagai risiko jika fitur rich text akan ditambahkan.
- Pertimbangkan DOMPurify jika rich text akan diimplementasikan.

---

### M-14: Clerk Webhook Secret Opsional di .env.example

**Lokasi:** `.env.example:36`
**Deskripsi:**
```env
# CLERK_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXX
```
Webhook secret Clerk dikomentari (opsional). Tanpa webhook secret, tidak ada sinkronisasi user profile dari Clerk ke LMS.

**Dampak:** User profile (nama, avatar) tidak tersinkronisasi; webhook tidak bisa diverifikasi.

**Rekomendasi:**
- Uncomment dan set `CLERK_WEBHOOK_SECRET` di production .env.
- Tambahkan validasi startup yang mewajibkan webhook secret di production.

---

### M-15: ngrok Configuration Terekspos di Repository

**Lokasi:** `ngrok.yml`
**Deskripsi:**
```yml
endpoints:
  - name: lms
    url: https://walk-ravine-smuggler.ngrok-free.dev
    upstream:
      url: 3000
```
ngrok config dengan URL tunnel statis dikomit ke repository publik. URL ini bisa di-scan dan digunakan untuk mengakses dev environment jika server dev sedang berjalan.

**Dampak:** Eksposur dev environment yang tidak seharusnya bisa diakses publik.

**Rekomendasi:**
- Tambahkan `ngrok.yml` ke `.gitignore`.
- Gunakan ngrok auth token + IP whitelist.

---

## 🔵 Low (4)

### L-01: Fallback HTTP untuk Development URLs

**Lokasi:** `lib/auth/redirect-url.ts:11`, `playwright.config.ts:3`
**Deskripsi:**
Fallback URL menggunakan `http://localhost:3000` (tanpa HTTPS). Di ngrok dev, koneksi tetap HTTPS (ngrok menyediakan TLS), tapi fallback ini bisa menyebabkan mixed content di dev.

**Rekomendasi:** Dokumentasikan requirement HTTPS untuk semua environment.

---

### L-02: Dependency — esbuild Arbitrary File Read on Windows

**CVE:** [GHSA-g7r4-m6w7-qqqr](https://github.com/advisories/GHSA-g7r4-m6w7-qqqr)
**Paket:** `esbuild`
**Severity:** Low — 3.3/10
**Deskripsi:** Arbitrary file read pada platform Windows via path traversal.
**Rekomendasi:** Update esbuild.

---

### L-03: `tsconfig.json` Tidak Diperiksa — Potensi Source Map Eksposur

**Lokasi:** `tsconfig.json`
**Deskripsi:** Pastikan source maps tidak diekspos di production (`"sourceMap": false` atau dari Next.js config).

**Rekomendasi:** Verifikasi bahwa Next.js production build tidak menghasilkan source maps publik.

---

### L-04: Quiz Store Zustand Persist dengan Dev Token

**Lokasi:** `features/quiz-engine/store/useQuizStore.ts:93`
**Deskripsi:**
```ts
{ name: 'jepangku-quiz-session', enabled: process.env.NODE_ENV === 'development' }
```
Quiz session persist di localStorage hanya di dev — aman, tapi perlu dokumentasi bahwa di production tidak persist.

**Rekomendasi:** Tidak ada tindakan (ini sudah aman). Dokumentasikan untuk awareness.

---

## ⚪ Informational (5)

### I-01: Docker Build Mengandung Database URL Placeholder

**Lokasi:** `Dockerfile:30`
```dockerfile
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
```
Hanya untuk build-time Prisma generate — tidak berbahaya karena tidak digunakan di runtime. Tapi bisa membingungkan.

### I-02: Test Files Memodifikasi process.env Global

**Lokasi:** `tests/unit/partner-api-auth.test.ts`, `tests/unit/core-integration.test.ts`
Test files memodifikasi `process.env` secara langsung. Dalam konteks test ini tidak berbahaya, tapi perlu disadari bahwa jika test dijalankan secara paralel, bisa terjadi race condition pada env vars.

### I-03: Multiple Env Var Keys untuk Hal yang Sama

**Lokasi:** Multiple files
`R2_SECRET_ACCESS_KEY` / `R2_ACCESS_KEY_SECRET`, `CORE_API_URL` / `JEPANGKU_CORE_API_URL`, `R2_BUCKET` / `R2_BUCKET_NAME` — multiple key aliases untuk nilai yang sama meningkatkan surface area misconfiguration.

### I-04: NEXT_PUBLIC_* Env Di-bake di Docker Build

**Lokasi:** `Dockerfile:24-28`
```dockerfile
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
```
`NEXT_PUBLIC_*` variables di-bake ke JavaScript bundle saat build time. Jika ada staging/production dengan URL berbeda, harus rebuild image. Ini adalah Next.js constraint, bukan vulnerability, tapi perlu diingat untuk deployment pipeline.

### I-05: PostgreSQL Pool Connection Timeout Terlalu Panjang

**Lokasi:** `lib/prisma.ts:18`
```ts
connectionTimeoutMillis: Number(process.env.PG_CONNECTION_TIMEOUT_MS ?? 10_000),
```
Default 10 detik timeout koneksi database. Ini bisa menyebabkan request stacking saat database bermasalah.

---

## 📊 Detail Dependency Vulnerabilities

| Package | Severity | CVE/GHSA | Brief |
| :--- | :---: | :--- | :--- |
| hono | 🟠 High | GHSA-88fw-hqm2-52qc | CORS reflects any Origin with credentials |
| hono | 🟡 Medium | GHSA-wwfh-h76j-fc44 | Path traversal on Windows (serve-static) |
| hono | 🟡 Medium | GHSA-j6c9-x7qj-28xf | AWS Lambda adapter header issue |
| hono | 🟡 Medium | GHSA-rv63-4mwf-qqc2 | Body Limit Middleware AWS Lambda bypass |
| hono | 🟡 Medium | GHSA-wgpf-jwjq-8h8p | Lambda@Edge adapter header issue |
| @hono/node-server | 🟡 Medium | GHSA-92pp-h63x-v22m | Middleware bypass via repeated slashes |
| uuid | 🟡 Medium | GHSA-w5hq-g745-h8pq | Buffer bounds check missing |
| postcss | 🟡 Medium | GHSA-qx2v-qp2m-jg93 | XSS via unescaped `</style>` |
| esbuild | 🔵 Low | GHSA-g7r4-m6w7-qqqr | Arbitrary file read on Windows |

**Resolusi:** Jalankan `bun update` untuk package-specific fix atau lihat advisories untuk versi patch yang diperlukan.

---

## ✅ Security Strengths (Positive Findings)

Meskipun banyak temuan di atas, tim telah melakukan banyak hal dengan benar:

1. **✔️ JWT Verification** — Menggunakan `jose` library dengan SPKI public key, issuer & audience validation.
2. **✔️ HttpOnly Core JWT Cookie** — Cookie tidak bisa diakses JavaScript (`httpOnly: true`).
3. **✔️ timingSafeEqual** — Digunakan untuk perbandingan secret cron & partner API (timing attack resistant).
4. **✔️ CSRF Protection Exist** — Walaupun hanya di production, implementasi `assertSameOriginPost` sudah benar.
5. **✔️ CORS Dengan Whitelist** — CORS menggunakan origin whitelist, bukan wildcard `*`.
6. **✔️ Security Headers** — HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.
7. **✔️ Clerk Webhook Signature Verification** — Menggunakan Svix untuk verifikasi signature.
8. **✔️ Rate Limiting Infrastructure** — Sudah ada in-memory + Redis rate limiter (tinggal digunakan di endpoint yang tepat).
9. **✔️ Auth Checks di API Routes** — Hampir semua route memiliki auth check (`auth()` atau `requireAdminAccess()`).
10. **✔️ No Raw SQL Queries** — Semua query database via Prisma ORM (tidak ada SQL injection risk).
11. **✔️ No dangerouslySetInnerHTML** — Tidak ditemukan penggunaan `dangerouslySetInnerHTML`.

---

## 🎯 Prioritas Remediasi

| Prioritas | Item | Action |
| :---: | :--- | :--- |
| P0 | H-02 Dev Bypass Safeguard | Tambahkan hard fail-safe untuk NODE_ENV != development |
| P0 | H-03 Hardcoded Payment | Hapus fallback values, throw error jika tidak di-set |
| P0 | H-01 CSP unsafe-eval/unsafe-inline | Implementasi strict CSP |
| P1 | H-05 Rate Limiting Auth Endpoints | Apply rate limiter ke `/api/auth/*` |
| P1 | M-06 CSRF di Non-Production | Aktifkan CSRF untuk staging juga |
| P1 | M-08 File Upload Size Limit | Tambahkan max file size validation |
| P1 | All Dependency Vulns | Update package versions |
| P2 | M-07 Open Redirect | Perkuat validasi redirect URL |
| P2 | M-11 Cookie Path | Scope Core JWT cookie |
| P2 | M-15 ngrok.yml | Gitignore + protect |
| P3 | M-12, M-13 | JSON validation & dokumentasi |
| P3 | M-09, M-10 | Redis production hardening |

---

*Audit dilakukan secara otomatis dengan code scanning tools dan manual code review. Untuk update terjadwal, jalankan `bun audit` secara berkala di pipeline CI/CD.*
