# Payment model — JepangKu LMS

**Status:** Dual-mode via `PAYMENT_PROVIDER` (2026-08-04); Midtrans remains production target  
**Scope:** Business rules + settle path + payment engine boundaries  
**Related:** Admin `/admin/pembayaran`; schema `Enrollment` / `Payment` / `EnrollmentLog`; code `lib/payment-engine/`, `features/checkout/`, `features/payment/`

---

## Decision (locked)

**Checkout = one product per payment.** No shopping cart.

| Approach | JepangKu |
| :--- | :--- |
| Per-item (adopted) | Yes — one `Course` / `LiveClass` / `TryoutSession` → one payment/enrollment |
| Cart (multi-line) | Out of scope |
| CMS grant | **Kept** — admin may `GRANTED` access without payment |

Bundles later are a single SKU with one `priceIdr` that grants multiple enrollments — still one checkout.

### Provider modes (`PAYMENT_PROVIDER`)

| Env | Siswa | Settle |
| :--- | :--- | :--- |
| `midtrans` | Core/Snap checkout | Webhook → `PAID` + Enrollment `ACTIVE` |
| `manual` | Bank transfer UI (bridge sampai Midtrans production approved) | Admin **Setujui** di Antrian |
| unset / other | CTA unavailable + WhatsApp konsultasi | CMS grant only |

`manual` is a **temporary bridge** — not a permanent ADR rollback. After Midtrans business review: set `PAYMENT_PROVIDER=midtrans` + `MIDTRANS_IS_PRODUCTION=true`.

---

## Current state

```text
Course / Live Class / Tryout (priceIdr > 0, PAYMENT_PROVIDER=midtrans)
  → /dashboard/checkout/{kursus|live-class|tryout}/… → metode (ikon + grup)
  → Midtrans Core charge → Payment.instructions
  → /dashboard/pembayaran/[paymentId] + SSE (+ Cek status)
  → Webhook settle → Payment PAID + Enrollment ACTIVE
  → EnrollmentLog: REQUESTED (charge) → PAYMENT_SETTLED (first PAID)

Course / Live Class / Tryout (priceIdr > 0, PAYMENT_PROVIDER=manual)
  → tampil rekening (PAYMENT_BANK_*) + Konfirmasi WA
  → Enrollment PENDING (tanpa baris Payment Midtrans)
  → Admin Setujui → Enrollment ACTIVE (+ EnrollmentLog APPROVED)

CMS grant
  → grantEnrollmentAction → Enrollment ACTIVE + EnrollmentLog GRANTED

priceIdr <= 0 → Enrollment ACTIVE immediately (no PSP)

/dashboard/pembayaran → riwayat pembayaran siswa (Midtrans)
```

- **Access SoT:** `Enrollment.status`
- **Money SoT (Midtrans):** `Payment.status`
- Engine: `lib/payment-engine/` — `chargeProductPayment`, product resolvers, method icons under `public/payment-icons/`

---

## Admin `/admin/pembayaran`

| Tab | Role |
| :--- | :--- |
| Antrian | Filter enrollment status + filter pembayaran Midtrans (`pending` / `paid` / `terminal` / tanpa Payment) |
| Riwayat | `EnrollmentLog` including **Dibayar otomatis** (`PAYMENT_SETTLED`) and **Diberikan manual** (`GRANTED`) |

- Midtrans PENDING: **Batalkan** (Cancel API + tutup enrollment). Settle hanya lewat webhook.
- Manual / tanpa Payment PENDING: **Setujui** + **Tolak**.

---

## Rules

1. Unit of sale: polymorphic product (`COURSE` | `LIVE_CLASS` | `TRYOUT`).
2. Amount = product `priceIdr` (IDR).
3. One Midtrans order → one enrollment (when Midtrans).
4. Free products never call Midtrans / never need bank transfer.
5. `PAYMENT_PROVIDER=manual` requires `PAYMENT_BANK_NAME` / `ACCOUNT_NAME` / `ACCOUNT_NUMBER` in production.

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
5. ✅ Midtrans paid path + **manual bridge** via `PAYMENT_PROVIDER`
6. ✅ `EnrollmentLog` REQUESTED + PAYMENT_SETTLED
7. ✅ Admin payment filters + Riwayat “Dibayar otomatis”
8. ✅ CMS grant (`GRANTED`) retained

### Out of scope

- Cart, vouchers, second PSP, subscriptions, refunds
- Proof-of-transfer upload
- Backfill historical EnrollmentLog for old payments
