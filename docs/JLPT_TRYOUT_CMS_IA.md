# Admin CMS — JLPT Bank, Paket Soal & Sesi

## Information architecture

```text
/admin/tryout                 → daftar sesi (event) — pilih Paket Soal
/admin/tryout/bank            → Bank Soal (canonical atoms) + retire/activate
/admin/tryout/paket           → Paket Soal (primary exam authoring)
/admin/tryout/paket/form      → buat paket
/admin/tryout/paket/import    → Import ZIP (1 ZIP = 1 paket)
/admin/tryout/paket/[setId]   → edit metadata + items (soft-lock jika sesi aktif)
/admin/tryout/[id]/susun      → redirect → paket sesi / daftar paket
/admin/tryout/[id]/soal       → redirect → /susun (legacy)
/admin/tryout/import          → notice legacy
```

## Roles

| Surface | Role |
| :--- | :--- |
| **Bank Soal** | Canonical content repository — search, typo fix, retire |
| **Paket Soal** | Primary exam authoring — assemble/import ordered paper |
| **Sesi JLPT** | Event — schedule + pick one READY package + activate |

## Lifecycle

- Paket: `DRAFT` → `READY` (≥1 valid item; sections may be incomplete) → `ARCHIVED`
- Soft lock: active sessions referencing package → block item edits / ZIP replace; **Duplicate** asks admin for new `code`
- Session activate (`isActive=true`): package READY + level match + all three JLPT sections non-empty

## Workflow

```text
Import/create Paket → READY → Create Session → pick Paket → Activate (full JLPT check)
```
