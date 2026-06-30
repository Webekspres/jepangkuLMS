# 🔒 Security Audit Report — JepangKu LMS

> **Audited branch:** `dev-sultan`
> **Audit date:** 2026-06-30
> **Remediation date:** 2026-06-30
> **Scope:** Dependency scan, static code analysis (200+ pattern searches), 16 API routes review, authentication/authorization audit

---

## 📋 Executive Summary

| Severity        | Count | Key Items                                                              | Status                                     |
| --------------- | ----- | ---------------------------------------------------------------------- | ------------------------------------------ |
| 🔴 **Critical** | 1     | `.env` file with real credentials tracked by git                       | ✅ Untracked (rotate creds if ever pushed) |
| 🔴 **High**     | 2     | Missing webhook signature verification, `xlsx` package vulnerabilities | ✅ Fixed                                   |
| 🟡 **Medium**   | 4     | Missing security headers, no CSRF/CORS, in-memory rate limiter         | ✅ Fixed (Redis: enable in prod `.env`)    |
| 🟢 **Low**      | 2     | `as unknown` type casts, transitive `hono` vuln                        | 🟡 Documented                              |

**Overall risk level:** MEDIUM — manual credential rotation + git history purge still recommended if `.env` was ever pushed.

---

## 🔴 Critical

### C-1: `.env` File Contains Real Credentials and Is Tracked by Git

| Attribute     | Value                                                             |
| ------------- | ----------------------------------------------------------------- |
| **Location**  | `.env` (root)                                                     |
| **Detection** | `git ls-files` confirmed `.env` is tracked                        |
| **Status**    | ✅ Untracked — `git ls-files .env` empty; `.gitignore` has `.env` |

**Leaked credentials (confirmed in `.env`):**

- `CLERK_SECRET_KEY` — Clerk API secret (test key `sk_test_...`) — could allow session forgery
- `R2_ACCESS_KEY_ID` — Cloudflare R2 storage access key
- `JEPANGKU_CORE_JWT_PUBLIC_KEY` — Public key for JWT verification

**Root cause:** `.env` was committed to git before it was added to `.gitignore`. Even though `.gitignore` now lists `.env`, the file remains tracked because it was already indexed.

**Remediation for next agent:**

```bash
# 1. Remove from index (keep local copy)
git rm --cached .env

# 2. Verify .gitignore has .env listed
echo ".env" >> .gitignore
echo ".env*.local" >> .gitignore

# 3. Rotate ALL leaked credentials:
#    - Clerk: Regenerate secret key in Clerk Dashboard
#    - R2: Create new API token in Cloudflare Dashboard
#    - Core JWT: Re-deploy Core to use new keypair

# 4. Purge from git history (irreversible — coordinate with team):
#    Install BFG Repo-Cleaner and run:
#    java -jar bfg.jar --delete-files .env
#    git reflog expire --expire=now --all
#    git gc --prune=now --aggressive
```

---

## 🔴 High

### H-1: Clerk Webhook Signature Verification Missing

| Attribute     | Value                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------- |
| **File**      | `app/api/webhooks/clerk/route.ts`                                                        |
| **Detection** | Code search for `svix`, `verifyWebhook`, `CLERK_WEBHOOK_SECRET` — all returned 0 results |
| **Status**    | ✅ Fixed — Svix `Webhook.verify()` + `CLERK_WEBHOOK_SECRET` in `.env.example`            |

**Vulnerability:** The webhook endpoint accepts any POST request and blindly parses the JSON body without verifying the Svix signature. An attacker who knows the webhook URL can send fake webhook events (user.created, user.updated, session.created, etc.).

**Current code:**

```typescript
const payload = await req.json();
// No signature verification!
// No Svix headers checked!
```

**Remediation for next agent:**

```typescript
import { Webhook } from 'svix';
import { headers } from 'next/headers';

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
if (!webhookSecret) throw new Error('CLERK_WEBHOOK_SECRET missing');

const wh = new Webhook(webhookSecret);
const headerList = await headers();
const svixId = headerList.get('svix-id');
const svixTimestamp = headerList.get('svix-timestamp');
const svixSignature = headerList.get('svix-signature');

const payload = await req.text();
const evt = wh.verify(payload, {
	'svix-id': svixId!,
	'svix-timestamp': svixTimestamp!,
	'svix-signature': svixSignature!,
});
```

Also add `CLERK_WEBHOOK_SECRET` to `.env.example` and CI/CD secrets.

### H-2: `xlsx` Package — Prototype Pollution + ReDoS

| Attribute           | Value                                                                       |
| ------------------- | --------------------------------------------------------------------------- |
| **Package**         | `xlsx: ^0.18.5`                                                             |
| **Vulnerabilities** | HIGH severity — Prototype Pollution + Regular Expression DoS                |
| **Source**          | `bun audit` — confirmed                                                     |
| **Status**          | ✅ Fixed — removed `xlsx`; all readers use `exceljs` via `xlsx-workbook.ts` |

**Vulnerability:** The `xlsx` npm package (SheetJS) has known Prototype Pollution and ReDoS vulnerabilities. Maliciously crafted XLSX/CSV files can pollute Object prototypes or cause server-side denial of service via regex backtracking.

**Impacted features (all use `xlsx`):**

- `features/admin-cms/lib/import-course-xlsx.ts` — Course import
- `features/admin-cms/lib/import-tryout-workbook.ts` — Tryout import
- `features/admin-cms/lib/xlsx-workbook.ts` — Workbook reader
- `features/admin-cms/lib/xlsx-template-builder.ts` — Template builder
- `features/admin-cms/lib/import-tryout-questions.ts` — Question import
- `features/admin-cms/lib/chokai-excel-columns.ts` — Chokai import

**Remediation for next agent:**

Option A — Migrate to `exceljs` (already in dependencies):

```bash
# Remove xlsx, use exceljs
bun remove xlsx
# exceljs is already in package.json
```

Then refactor all imports from `xlsx` to `exceljs` API.

Option B — Override with patched version (temporary):

```json
// package.json
"overrides": {
  "xlsx": "https://cdn.sheetjs.com/xlsx-0.20.2/xlsx-0.20.2.tgz"
}
```

**Recommended:** Option A (migrate to `exceljs`) for long-term security.

---

## 🟡 Medium

### M-1: Missing Security Headers

| Attribute    | Value                                                                              |
| ------------ | ---------------------------------------------------------------------------------- |
| **Location** | Global — `next.config.ts`, `proxy.ts`                                              |
| **Status**   | ✅ Fixed — CSP, XFO, HSTS, Referrer-Policy, Permissions-Policy in `next.config.ts` |

**Missing headers:**
| Header | Purpose | Risk if missing |
|--------|---------|-----------------|
| `Content-Security-Policy` | Prevents XSS & data injection | XSS attacks possible |
| `X-Frame-Options: DENY` | Prevents clickjacking | UI redress attacks |
| `Strict-Transport-Security` | Enforces HTTPS | MITM downgrade attacks |
| `Referrer-Policy` | Controls referrer leakage | Privacy leak |
| `Permissions-Policy` | Restricts browser APIs | Feature abuse |

**Only header present:** `X-Content-Type-Options: nosniff` in 1 API route (`/api/learning/lesson-video`).

**Remediation for next agent — in `next.config.ts`:**

```typescript
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https:; frame-src 'self' https://clerk.jepangku.com;" },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    },
  ];
}
```

### M-2: No CSRF Protection on Authentication Endpoints

| Attribute    | Value                                                                       |
| ------------ | --------------------------------------------------------------------------- |
| **Endpoint** | `app/api/auth/sign-out/route.ts`                                            |
| **Status**   | ✅ Fixed — `assertSameOriginPost()` rejects cross-origin POST in production |

**Vulnerability:** Sign-out endpoint accepts POST without CSRF token. An attacker could force sign-outs via cross-site request forgery.

**Partial mitigation:** Clerk's session cookie likely uses `SameSite=Lax` by default.

**Remediation for next agent:** Add CSRF token validation, or enforce `SameSite=Strict` on session cookies.

### M-3: No CORS Configuration

| Attribute    | Value                                                                                    |
| ------------ | ---------------------------------------------------------------------------------------- |
| **Location** | All `app/api/` routes                                                                    |
| **Status**   | ✅ Fixed — explicit allowlist in `lib/security/cors.ts`; Partner API + OPTIONS preflight |

**Vulnerability:** No CORS headers are configured. API routes rely on Next.js defaults which may be permissive. If any API route returns user-specific data, it could be read cross-origin.

**Note:** `bun audit` also flagged `hono` CORS middleware vulnerability (HIGH) — verify if hono is a direct or transitive dependency.

**Remediation for next agent:** Add CORS middleware or per-route CORS headers with explicit origin allowlist.

### M-4: In-Memory Rate Limiter — Not Suitable for Production Multi-Instance

| Attribute    | Value                                                                  |
| ------------ | ---------------------------------------------------------------------- |
| **File**     | `lib/rate-limit/in-memory.ts`                                          |
| **Fallback** | `lib/rate-limit/redis.ts` (exists but not used by default)             |
| **Status**   | ✅ Wired — set `REDIS_ENABLED=true` + `REDIS_URL` in production `.env` |

**Vulnerability:** In a multi-instance deployment (Docker scaled, multiple VPS), each instance has its own in-memory rate limit state. Attackers can bypass rate limits by distributing requests across instances.

**Remediation for next agent:**

```bash
# In production .env:
REDIS_ENABLED=true
REDIS_URL=redis://...
```

---

## 🟢 Low

### L-1: `as unknown` Type Assertions (11 occurrences)

| Locations                                                                                                                                                                                                                                                                                                       | Risk                                              |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `lib/prisma.ts`, `lib/rate-limit/in-memory.ts`, `lib/logger/index.ts`, `features/admin-cms/components/admin-sortable-list.tsx`, `admin-sortable-table.tsx`, `features/admin-cms/lib/import-course-xlsx.ts`, `features/admin-cms/lib/xlsx-workbook.ts`, `features/student/components/gamified-event-context.tsx` | Weakens type safety; can hide runtime type errors |

**Remediation:** Replace with proper type definitions where possible.

### L-2: `hono` Transitive Vulnerability — CORS Origin Reflection

| Attribute         | Value                                                                                                    |
| ----------------- | -------------------------------------------------------------------------------------------------------- |
| **Source**        | `bun audit`                                                                                              |
| **Package**       | `hono`                                                                                                   |
| **Vulnerability** | CORS Middleware reflects any Origin with credentials                                                     |
| **Impact**        | If hono is used in any serverless function or API route, cross-origin credentialed requests are allowed. |
| **Status**        | 🟡 Accepted — transitive via `shadcn` / `@prisma/dev` CLI only; not used in LMS runtime                  |

**Remediation:** Verify if hono is a direct dependency or transitive. If transitive, update the parent package.

---

## ✅ Passed Checks (No Issues Found)

| Check                               | Method                                                                               | Result                    |
| ----------------------------------- | ------------------------------------------------------------------------------------ | ------------------------- |
| **SQL Injection**                   | Searched `$queryRaw`, `$executeRaw`, `raw\`` — 0 matches                             | ✅ No raw SQL queries     |
| **XSS**                             | Searched `dangerouslySetInnerHTML`, `innerHTML` — 0 matches in code                  | ✅ No DOM XSS vectors     |
| **eval() / Function()**             | Searched `eval(`, `Function(` — 0 matches                                            | ✅ No code injection      |
| **Path Traversal**                  | Searched `readFileSync`, `writeFileSync`, `createReadStream` — 0 matches in app code | ✅ No file system attacks |
| **Hardcoded Credentials in Source** | Searched for passwords, tokens, secrets in `*.ts`, `*.tsx`                           | ✅ Only in `.env` file    |
| **Auth — Admin Routes**             | Verified all 6 admin API routes call `requireAdminAccess()`                          | ✅ Properly gated         |
| **Auth — Student Routes**           | Verified all student routes call `requireAuthUserId()`                               | ✅ Properly gated         |
| **JWT Verification**                | Uses `jose` with `importSPKI`, `RS256`, validates `issuer` & `audience`              | ✅ Secure implementation  |
| **Timing-Safe Comparisons**         | Cron auth & partner auth use `timingSafeEqual`                                       | ✅ Secure comparison      |
| **FFmpeg Input Validation**         | Files written to temp directory with safe names                                      | ✅ No command injection   |
| **Open Redirect**                   | All redirects use absolute URLs or path constants                                    | ✅ No open redirect       |
| **Rate Limiting Structure**         | Redis + in-memory dual implementation with graceful fallback                         | ✅ Well-designed          |

---

## 🔧 Action Items Priority

### 🔴 Do Immediately

| #   | Action                                               | Effort |
| --- | ---------------------------------------------------- | ------ |
| 1   | `git rm --cached .env` + rotate credentials          | 30 min |
| 2   | Add Svix webhook verification                        | 1 hour |
| 3   | Purge `.env` from git history (coordinate with team) | 1 hour |

### 🔴 Do This Week

| #   | Action                               | Effort    |
| --- | ------------------------------------ | --------- |
| 4   | Migrate `xlsx` to `exceljs` or patch | 4-8 hours |

### 🟡 Do This Sprint

| #   | Action                                       | Effort |
| --- | -------------------------------------------- | ------ |
| 5   | Add global security headers (CSP, HSTS, XFO) | 1 hour |
| 6   | Enable Redis rate limiter in production      | 30 min |
| 7   | Review CORS configuration                    | 1 hour |

### 🟢 Tech Debt

| #   | Action                               | Effort  |
| --- | ------------------------------------ | ------- |
| 8   | Replace `as unknown` type assertions | 2 hours |
| 9   | Audit `hono` transitive dependency   | 30 min  |

---

## 🔍 Methodology

This audit was performed using the following tools and techniques:

1. **Dependency scanning:** `bun audit` — checked all 38+ dependencies + devDependencies
2. **Static code analysis:** 200+ pattern searches across the entire codebase using ripgrep
3. **API route review:** Manually reviewed all 16 API route handlers for auth gaps
4. **Auth flow analysis:** Traced Clerk auth → proxy.ts → require-admin-action → admin routes
5. **Schema review:** Prisma schema checked for mass assignment / IDOR patterns
6. **File upload review:** All file handling code checked for path traversal and buffer overflow
7. **Rate limiting review:** Both in-memory and Redis implementations analyzed
8. **Cross-reference:** Findings cross-referenced with OWASP Top 10 (2021)

---

_Generated by automated security audit tooling. For questions, contact the JepangKu dev team._
