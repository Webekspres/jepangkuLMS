# Payment model — JepangKu LMS

**Status:** Midtrans Core API only + CMS grant (2026-08-07)  
**Scope:** Business rules + settle path + payment engine boundaries  
**Related:** Admin `/admin/pembayaran`; schema `Enrollment` / `Payment` / `PaymentMethodSetting` / `EnrollmentLog`; code `lib/payment-engine/`, `features/checkout/`, `features/payment/`

---

## Decision (locked)

**Checkout = one product per payment.** No shopping cart.

| Approach | JepangKu |
| :--- | :--- |
| Per-item (adopted) | Yes — one `Course` / `LiveClass` / `TryoutSession` → one payment/enrollment |
| Cart (multi-line) | Out of scope |
| CMS grant | **Kept** — admin may `GRANTED` access without payment |

Bundles later are a single SKU with one `priceIdr` that grants multiple enrollments — still one checkout.

### Midtrans availability

| Condition | Siswa | Settle |
| :--- | :--- | :--- |
| `MIDTRANS_SERVER_KEY` set | Core API checkout (server-only) | Webhook → `PAID` + Enrollment `ACTIVE` |
| Server key unset | CTA unavailable + WhatsApp konsultasi | CMS grant only |

**No Snap, no Client Key, no browser → Midtrans.** Runtime credentials: `MIDTRANS_SERVER_KEY` + `MIDTRANS_IS_PRODUCTION`.

Manual bank-transfer bridge and Snap popup have been **removed**.

### Checkout methods

Catalog metadata lives in `lib/payment-engine/registry/methods.ts`. Runtime enablement is `PaymentMethodSetting` (admin toggles on `/admin/pembayaran`). Midtrans has no Core API to list activated channels; 402 “channel not activated” auto-disables the method.

---

## Current state

```text
Course / Live Class / Tryout (priceIdr > 0, MIDTRANS_SERVER_KEY set)
  → /dashboard/checkout/{kursus|live-class|tryout}/… → metode (admin-enabled only)
  → Server Action → Midtrans Core charge → Payment.instructions
  → /dashboard/pembayaran/[paymentId] + SSE (+ Cek status)
  → Webhook settle → Payment PAID + Enrollment ACTIVE
  → EnrollmentLog: REQUESTED (charge) → PAYMENT_SETTLED (first PAID)

Cancel / expire / fail / deny (terminal Payment)
  → close PENDING Enrollment (delete + EnrollmentLog REJECTED)
  → Payment ledger tetap (enrollmentId SetNull, status terminal)
  → storefront kembali ke CTA Bayar / Daftar; riwayat siswa tampil di filter status

CMS grant
  → grantEnrollmentAction → Enrollment ACTIVE + EnrollmentLog GRANTED

priceIdr <= 0 → Enrollment ACTIVE immediately (no PSP)

/dashboard/pembayaran → riwayat pembayaran siswa (Midtrans)
```

- **Access SoT:** `Enrollment.status`
- **Money SoT (Midtrans):** `Payment.status`
- Engine: `lib/payment-engine/` — provider-agnostic types; Midtrans adapter under `providers/midtrans/`

---

## Admin `/admin/pembayaran`

| Area | Role |
| :--- | :--- |
| Metode pembayaran | Toggle channel yang tampil di checkout siswa |
| Antrian | Midtrans open `PENDING`/`CHALLENGE` |
| Riwayat | `EnrollmentLog` including **Dibayar otomatis** (`PAYMENT_SETTLED`) and **Diberikan manual** (`GRANTED`) |

- Midtrans open: **Batalkan** (Cancel API + tutup enrollment). Settle hanya lewat webhook.
- Midtrans already terminal + Enrollment masih PENDING: **Hapus antrean** (delete tanpa Cancel API).
- PENDING tanpa Payment: **Tolak** (legacy orphan). Grant akses lewat kartu “Aktifkan enrollment manual”.

---

## Rules

1. Unit of sale: polymorphic product (`COURSE` | `LIVE_CLASS` | `TRYOUT`).
2. Amount = product `priceIdr` (IDR).
3. One Midtrans order → one enrollment (when Midtrans).
4. Free products never call Midtrans.
5. Paid products require Midtrans Core checkout when Server Key is configured.
6. Browser never loads Midtrans scripts or credentials.

---

## Midtrans status → `PaymentStatus`

| Midtrans | LMS |
| :--- | :--- |
| capture / settlement (ok) | `PAID` |
| pending | `PENDING` |
| challenge | `CHALLENGE` |
| deny | `DENIED` |
| expire | `EXPIRED` |
| cancel | `CANCELED` |
| other failure | `FAILED` |

---

## Implementation checklist

1. ✅ Payment ↔ Enrollment + Midtrans webhook/Status API
2. ✅ SSE + Core checkout UI (Course / Live / Tryout)
3. ✅ Local payment icons + grouped methods
4. ✅ Student payment history
5. ✅ Midtrans Core-only (Snap + Client Key + manual bridge removed)
6. ✅ Terminal Payment closes PENDING Enrollment (cancel + webhook)
7. ✅ `EnrollmentLog` REQUESTED + PAYMENT_SETTLED
8. ✅ Admin method toggles + 402 auto-disable
9. ✅ Admin Antrian Midtrans-open + CMS grant retained

### Out of scope

- Cart, vouchers, second PSP, subscriptions, refunds
- Proof-of-transfer upload
- Pulling live channel list from Midtrans (API does not exist)
- Backfill historical EnrollmentLog for old payments
