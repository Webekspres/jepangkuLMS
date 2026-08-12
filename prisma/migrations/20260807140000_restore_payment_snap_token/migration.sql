-- Restore nullable Snap token for interim Snap dual-mode (Core path leaves NULL).
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "snapToken" TEXT;
