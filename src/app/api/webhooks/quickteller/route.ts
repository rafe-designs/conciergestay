// ====================================================================
// FILE 4 OF 6: api/webhooks/quickteller/route  (UPDATED: finds YOUR reference, never drops a paid booking)
// PASTE INTO: app/api/webhooks/quickteller/route.ts
// REPLACE the whole existing file. Needs file 5 (lib/bookingPayments.ts) to be the updated one.
// ====================================================================

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { confirmBookingByReference } from '@/lib/bookingPayments';

// Safety model: this endpoint NEVER marks anything paid because a request says so.
// It only takes candidate references out of the payload, then confirmBookingByReference() asks
// Interswitch directly and checks the amount we stored. A forged webhook can't create a paid booking.

const REF_RE = /^[A-Za-z0-9_-]{6,64}$/;

// Interswitch sends several reference-like fields. Some are Interswitch's own (e.g. "FBN|WEB|MX..|..",
// which contains "|" and can never match our format). Collect ALL candidates, keep only those that look
// like our txn_ref, and try each one, instead of trusting whichever field happens to be first.
const REF_FIELDS = [
  'merchantReference',
  'transactionReference',
  'txnRef',
  'txn_ref',
  'transactionRef',
  'reference',
  'paymentReference',
];

function extractReferences(payload: any, rawBody: string): string[] {
  const found = new Set<string>();
  for (const src of [payload?.data, payload]) {
    if (!src || typeof src !== 'object') continue;
    for (const f of REF_FIELDS) {
      const v = src[f];
      if (typeof v === 'string' || typeof v === 'number') {
        const t = String(v).trim();
        if (REF_RE.test(t)) found.add(t);
      }
    }
  }
  // Last resort: our references look like CS_<13 digits>_<6 digits> wherever they appear in the body.
  for (const m of rawBody.match(/CS_\d{10,}_\d{4,}/g) || []) found.add(m);
  return [...found];
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();

    // Signature check. confirmBookingByReference() re-verifies every payment with Interswitch itself,
    // so a bad/unknown signature cannot make a booking paid. By default we therefore log a mismatch and
    // carry on (a wrong secret must never silently block real payments). Set
    // QUICKTELLER_ENFORCE_WEBHOOK_SIGNATURE=true once you have confirmed the secret is right to reject them.
    const signature = request.headers.get('x-interswitch-signature');
    const secret = process.env.QUICKTELLER_CLIENT_SECRET;
    if (signature && secret) {
      const computed = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
      const a = Buffer.from(computed.toLowerCase());
      const b = Buffer.from(signature.toLowerCase());
      const valid = a.length === b.length && crypto.timingSafeEqual(a, b);
      if (!valid) {
        console.warn('[Webhook] Signature mismatch (check QUICKTELLER_CLIENT_SECRET is the LIVE secret)');
        if (process.env.QUICKTELLER_ENFORCE_WEBHOOK_SIGNATURE === 'true') {
          return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }
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
    // Log the field NAMES and the start of the body so you can see exactly what Interswitch sends.
    console.log('[Webhook] received', event, 'keys:', Object.keys(data).join(','), rawBody.slice(0, 600));

    if (!event.startsWith('TRANSACTION.')) {
      return NextResponse.json({ status: 'IGNORED' }, { status: 200 });
    }

    const refs = extractReferences(payload, rawBody);
    if (refs.length === 0) {
      console.warn('[Webhook] No usable reference in payload');
      return NextResponse.json({ status: 'NO_REFERENCE' }, { status: 200 });
    }

    // Try each candidate until one matches a stored booking.
    let result: Awaited<ReturnType<typeof confirmBookingByReference>> = { status: 'not_found' };
    let matchedRef = '';
    for (const ref of refs) {
      result = await confirmBookingByReference(ref);
      matchedRef = ref;
      if (result.status !== 'not_found') break;
    }
    console.log('[Webhook] result', { event, tried: refs, matchedRef, status: result.status });

    // Return 5xx only when a retry could help (provider/DB trouble), so Interswitch re-sends.
    if (result.status === 'provider_error' || result.status === 'db_error') {
      return NextResponse.json({ status: 'RETRY' }, { status: 500 });
    }

    // The gateway says the payment COMPLETED successfully but our requery does not show it yet:
    // ask for a retry rather than silently dropping a real payment.
    const gatewayCode = String(data?.responseCode ?? data?.ResponseCode ?? data?.paymentResponseCode ?? '');
    if (event === 'TRANSACTION.COMPLETED' && result.status === 'not_paid' && gatewayCode === '00' && result.code !== '00') {
      return NextResponse.json({ status: 'RETRY' }, { status: 500 });
    }

    return NextResponse.json({ status: 'OK', result: result.status }, { status: 200 });
  } catch (err) {
    console.error('[Webhook Processing Error]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}