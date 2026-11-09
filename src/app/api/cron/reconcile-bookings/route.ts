// ====================================================================
// NEW FILE: RECONCILE PENDING BOOKINGS (safety net)
// PASTE INTO: app/api/cron/reconcile-bookings/route.ts
// CREATE this new file. Needs the updated lib/bookingPayments.ts.
// Called every 5 minutes by the Netlify scheduled function (reconcile-bookings.mjs).
// Requires the env var CRON_SECRET (any long random string).
// ====================================================================

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase, confirmBookingByReference } from '@/lib/bookingPayments';

export const dynamic = 'force-dynamic';

const LOOKBACK_MS = 60 * 60 * 1000; // only bookings started in the last hour
const MIN_AGE_MS = 2 * 60 * 1000; // give the normal flow (page polling / webhook) a head start
const MAX_PER_RUN = 10; // keep each run well inside the serverless time limit
const CONCURRENCY = 5;
const REF_RE = /^[A-Za-z0-9_-]{6,64}$/;

function sha256(v: string) {
  return crypto.createHash('sha256').update(v).digest();
}

function authorised(request: Request) {
  const secret = process.env.CRON_SECRET || '';
  if (!secret) return false; // no secret configured = endpoint is closed
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  return crypto.timingSafeEqual(sha256(token), sha256(secret));
}

export async function POST(request: Request) {
  if (!authorised(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = Date.now();
    const { data: rows, error } = await supabase
      .from('Booking')
      .select('reference, createdAt')
      .eq('paymentStatus', 'Pending')
      .not('reference', 'is', null)
      .gte('createdAt', new Date(now - LOOKBACK_MS).toISOString())
      .lte('createdAt', new Date(now - MIN_AGE_MS).toISOString())
      .order('createdAt', { ascending: true })
      .limit(MAX_PER_RUN);

    if (error) {
      console.error('[Reconcile] query error:', error.message);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    const refs = (rows || []).map((r: any) => String(r.reference)).filter((r) => REF_RE.test(r));

    const counts: Record<string, number> = {};
    const confirmed: string[] = [];

    for (let i = 0; i < refs.length; i += CONCURRENCY) {
      const batch = refs.slice(i, i + CONCURRENCY);
      const settled = await Promise.allSettled(batch.map((ref) => confirmBookingByReference(ref)));
      settled.forEach((s, idx) => {
        const status = s.status === 'fulfilled' ? s.value.status : 'error';
        counts[status] = (counts[status] || 0) + 1;
        // newlyConfirmed = this run flipped it (so this run also sent the confirmation email)
        if (s.status === 'fulfilled' && s.value.status === 'paid' && (s.value as any).newlyConfirmed) {
          confirmed.push(batch[idx]);
        }
        if (s.status === 'rejected') console.error('[Reconcile] error for', batch[idx], s.reason);
      });
    }

    console.log('[Reconcile] done', { checked: refs.length, counts, confirmed });
    return NextResponse.json({ checked: refs.length, counts, confirmed }, { status: 200 });
  } catch (err) {
    console.error('[Reconcile] failed:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}