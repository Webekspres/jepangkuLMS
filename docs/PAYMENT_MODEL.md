# Payment model — JepangKu LMS

**Status:** Midtrans-only paid path (2026-07-31); CMS grant remains  
**Scope:** Business rules + settle path + payment engine boundaries  
**Related:** Admin `/admin/pembayaran`; schema `Enrollment` / `Payment` / `EnrollmentLog`; code `lib/payment-engine/`, `features/checkout/`, `features/payment/`

---

## Decision (locked)

**Checkout = one product per payment.** No shopping cart.

| Approach | JepangKu |
| :--- | :--- |
| Per-item (adopted) | Yes — one `Course` / `LiveClass` / `TryoutSession` → one Midtrans transaction → one `Enrollment` |
| Cart (multi-line) | Out of scope |
| Student bank transfer | **Retired** — Midtrans Core only |
| CMS grant | **Kept** — admin may `GRANTED` access without payment |

Bundles later are a single SKU with one `priceIdr` that grants multiple enrollments — still one checkout.

---

## Current state

```text
Course / Live Class / Tryout (priceIdr > 0, PAYMENT_PROVIDER=midtrans)
  → /dashboard/checkout/{kursus|live-class|tryout}/… → metode (ikon + grup)
  → Midtrans Core charge → Payment.instructions
  → /dashboard/pembayaran/[paymentId] + SSE (+ Cek status)
  → Webhook settle → Payment PAID + Enrollment ACTIVE
  → EnrollmentLog: REQUESTED (charge) → PAYMENT_SETTLED (first PAID)

CMS grant
  → grantEnrollmentAction → Enrollment ACTIVE + EnrollmentLog GRANTED

priceIdr <= 0 → Enrollment ACTIVE immediately (no Midtrans)

/dashboard/pembayaran → riwayat pembayaran siswa
```

- **Access SoT:** `Enrollment.status`
- **Money SoT:** `Payment.status`
- Engine: `lib/payment-engine/` — `chargeProductPayment`, product resolvers, method icons under `public/payment-icons/`

---

## Admin `/admin/pembayaran`

| Tab | Role |
| :--- | :--- |
| Antrian | Filter enrollment status + filter pembayaran Midtrans (`pending` / `paid` / `terminal` / tanpa Payment) |
| Riwayat | `EnrollmentLog` including **Dibayar otomatis** (`PAYMENT_SETTLED`) and **Diberikan manual** (`GRANTED`) |

Midtrans PENDING: **Batalkan** (Cancel API + tutup enrollment). Settle hanya lewat webhook — tidak ada Setujui/Tolak.

---

## Rules

1. Unit of sale: polymorphic product (`COURSE` | `LIVE_CLASS` | `TRYOUT`).
2. Amount = product `priceIdr` (IDR).
3. One Midtrans order → one enrollment.
4. Free products never call Midtrans.
5. No student bank-transfer UX; grant is admin-only.

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
5. ✅ Midtrans-only paid path (bank transfer retired)
6. ✅ `EnrollmentLog` REQUESTED + PAYMENT_SETTLED
7. ✅ Admin payment filters + Riwayat “Dibayar otomatis”
8. ✅ CMS grant (`GRANTED`) retained

### Out of scope

- Cart, vouchers, second PSP, subscriptions, refunds
- Backfill historical EnrollmentLog for old payments
