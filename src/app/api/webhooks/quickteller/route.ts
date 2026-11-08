// ====================================================================
// FILE 4 OF 6: api/webhooks/quickteller/route
// PASTE INTO: app/api/webhooks/quickteller/route.ts
// REPLACE the whole existing file. Needs file 5 (lib/bookingPayments.ts) to exist.
// ====================================================================

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { confirmBookingByReference } from '@/lib/bookingPayments';

// Save as: your existing webhook route path (e.g. app/api/webhooks/quickteller/route.ts)
//
// Safety model: this endpoint NEVER marks anything paid because a request says so.
// It only takes a reference out of the payload, then confirmBookingByReference() asks
// Interswitch directly and checks the amount we stored. A forged webhook can't create a paid booking.

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();

    // If a signature is sent and we have a secret, it must match (extra layer, not the only one).
    const signature = request.headers.get('x-interswitch-signature');
    const secret = process.env.QUICKTELLER_CLIENT_SECRET;
    if (signature && secret) {
      const computed = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
      const a = Buffer.from(computed.toLowerCase());
      const b = Buffer.from(signature.toLowerCase());
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        console.warn('[Webhook] Invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const event = String(payload?.event || '');
    const data = payload?.data || {};
    console.log('[Webhook] received', event, JSON.stringify(data).slice(0, 300));

    if (!event.startsWith('TRANSACTION.')) {
      return NextResponse.json({ status: 'IGNORED' }, { status: 200 });
    }

    const txRef = String(data?.paymentReference || data?.transactionReference || data?.merchantReference || '').trim();
    if (!/^[A-Za-z0-9_-]{6,64}$/.test(txRef)) {
      return NextResponse.json({ status: 'NO_REFERENCE' }, { status: 200 });
    }

    const result = await confirmBookingByReference(txRef);

    // Return 5xx only when a retry could help (provider/DB trouble). Otherwise acknowledge.
    if (result.status === 'provider_error' || result.status === 'db_error') {
      return NextResponse.json({ status: 'RETRY' }, { status: 500 });
    }
    return NextResponse.json({ status: 'OK', result: result.status }, { status: 200 });
  } catch (err) {
    console.error('[Webhook Processing Error]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}