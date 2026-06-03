import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    console.log('Clerk Webhook Payload:', payload);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}