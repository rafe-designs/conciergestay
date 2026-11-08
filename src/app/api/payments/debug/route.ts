// ====================================================================
// FILE 7 (OPTIONAL, DEV ONLY): api/payments/debug/route
// PASTE INTO: app/api/payments/debug/route.ts   (CREATE this new file)
// Needs file 5 (lib/bookingPayments.ts). Returns 404 in production.
// Delete this file before you go live if you prefer.
// ====================================================================

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/bookingPayments';

export const dynamic = 'force-dynamic';

const IS_LIVE = (process.env.QUICKTELLER_ENV || process.env.NEXT_PUBLIC_QUICKTELLER_MODE) === 'LIVE';
const BASE = IS_LIVE ? 'https://webpay.interswitchng.com' : 'https://sandbox.interswitchng.com';

/**
 * Open in your browser after a failed payment:
 *   http://localhost:3000/api/payments/debug            (checks your most recent booking)
 *   http://localhost:3000/api/payments/debug?ref=CS_...  (checks a specific reference)
 * It asks Interswitch what THEY recorded for that reference, checks your config,
 * prints a summary in this terminal, and returns the same as JSON.
 */
export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const url = new URL(request.url);
  let ref = (url.searchParams.get('ref') || '').trim();
  if (ref && !/^[A-Za-z0-9_-]{6,64}$/.test(ref)) {
    return NextResponse.json({ error: 'Invalid ref format' }, { status: 400 });
  }

  const cols = 'reference, grandTotal, paymentStatus, status, createdAt, customerEmail';
  const { data: row } = ref
    ? await supabase.from('Booking').select(cols).eq('reference', ref).maybeSingle()
    : await supabase.from('Booking').select(cols).order('createdAt', { ascending: false }).limit(1).maybeSingle();
  if (row && !ref) ref = row.reference;

  // 1. Config check (values shown only for non-secret settings)
  const config = {
    mode: IS_LIVE ? 'LIVE' : 'TEST',
    merchantCode: process.env.NEXT_PUBLIC_QUICKTELLER_MERCHANT_CODE || 'MISSING',
    payItemId: process.env.NEXT_PUBLIC_QUICKTELLER_PAY_ITEM_ID || 'MISSING',
    supabaseServiceKeySet: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    resendKeySet: !!process.env.RESEND_API_KEY,
    interswitchBase: BASE,
  };

  // 2. Ask Interswitch what they recorded
  let interswitch: any = { note: 'No reference to check.' };
  let verdict = 'No booking found yet. Click Pay on your checkout first, then reload this page.';

  if (row && ref) {
    const amountKobo = Math.round(Number(row.grandTotal) * 100);
    const q =
      `?merchantcode=${encodeURIComponent(config.merchantCode)}` +
      `&transactionreference=${encodeURIComponent(ref)}&amount=${amountKobo}`;

    let httpStatus = 0;
    let raw = '';
    let data: any = null;
    for (const path of ['/collections/api/v1/gettransaction', '/collections/api/v1/gettransaction.json']) {
      try {
        const r = await fetch(`${BASE}${path}${q}`, { headers: { Accept: 'application/json' }, cache: 'no-store' });
        httpStatus = r.status;
        raw = await r.text();
        try { data = JSON.parse(raw); } catch { data = null; }
        if (data) break;
      } catch (e: any) {
        raw = `Network error reaching Interswitch: ${e?.message}`;
      }
    }

    interswitch = { httpStatus, expectedAmountKobo: amountKobo, response: data ?? raw.slice(0, 400) };

    const code = String(data?.ResponseCode ?? data?.responseCode ?? '');
    const desc = data?.ResponseDescription ?? data?.responseDescription ?? '';

    if (code === '00') {
      verdict =
        `Interswitch shows this payment as SUCCESSFUL (${desc || 'approved'}). ` +
        (row.paymentStatus === 'Paid'
          ? 'Your booking is already Paid.'
          : 'Your booking is still "' + row.paymentStatus + '": open /booking-success?txnref=' + ref + ' to confirm it.');
    } else if (code) {
      verdict = `Interswitch recorded this attempt as NOT successful. Code ${code}: ${desc || 'no description'}.`;
    } else {
      verdict =
        'Interswitch has no usable record for this reference. The attempt was most likely rejected on their ' +
        'payment page before any payment was registered (this matches the "A server error occurred" page). ' +
        'This message is produced on Interswitch\'s servers, so only they can say why. Send them this reference.';
    }
  }

  const summary = { reference: ref || null, booking: row ?? null, config, interswitch, verdict };

  console.log('\n[Payment debug] ================================');
  console.log('Reference :', ref || '(none)');
  console.log('Booking   :', row ? `${row.paymentStatus} / ₦${Number(row.grandTotal).toLocaleString()} / ${row.createdAt}` : 'not found');
  console.log('Config    :', JSON.stringify(config));
  console.log('Interswitch:', JSON.stringify(interswitch).slice(0, 600));
  console.log('VERDICT   :', verdict);
  console.log('===============================================\n');

  return NextResponse.json(summary, { status: 200 });
}