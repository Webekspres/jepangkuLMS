import { auth } from '@clerk/nextjs/server';
import { parsePaymentInstructions } from '@/lib/payment-engine/charge-product';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const QRIS_FILENAME = 'qris-jepangku.png';

type RouteContext = {
  params: Promise<{ paymentId: string }>;
};

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Same-origin proxy for Midtrans QRIS image — iOS ignores `<a download>` on cross-origin URLs.
 */
export async function GET(_request: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { paymentId } = await context.params;
  if (!paymentId?.trim()) {
    return Response.json({ ok: false, message: 'paymentId required' }, { status: 400 });
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { id: true, userId: true, instructions: true },
  });

  if (!payment || payment.userId !== userId) {
    return Response.json({ ok: false, message: 'Pembayaran tidak ditemukan.' }, { status: 404 });
  }

  const instructions = parsePaymentInstructions(payment.instructions);
  if (!instructions || instructions.kind !== 'qris') {
    return Response.json({ ok: false, message: 'QRIS tidak tersedia.' }, { status: 404 });
  }

  const qrUrl = instructions.qrUrl?.trim() ?? '';
  if (!qrUrl || !isHttpUrl(qrUrl)) {
    return Response.json({ ok: false, message: 'URL QR tidak valid.' }, { status: 404 });
  }

  try {
    const upstream = await fetch(qrUrl, {
      headers: { Accept: 'image/*,*/*' },
      cache: 'no-store',
    });
    if (!upstream.ok) {
      return Response.json(
        { ok: false, message: 'Gagal mengambil gambar QR dari Midtrans.' },
        { status: 502 },
      );
    }

    const bytes = await upstream.arrayBuffer();
    const contentType = upstream.headers.get('content-type')?.split(';')[0]?.trim() || 'image/png';

    return new Response(bytes, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${QRIS_FILENAME}"`,
        'Cache-Control': 'private, max-age=60',
      },
    });
  } catch {
    return Response.json(
      { ok: false, message: 'Gagal mengambil gambar QR dari Midtrans.' },
      { status: 502 },
    );
  }
}
