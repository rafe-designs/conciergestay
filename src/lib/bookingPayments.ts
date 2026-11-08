// ====================================================================
// FILE 5 OF 6: lib/bookingPayments (UPDATED: one mode switch, loud failures, better logs)
// PASTE INTO: lib/bookingPayments.ts
// CREATE this new file (use src/lib/ if your project has a src folder, next to cateringData.ts).
// ====================================================================

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import crypto from 'crypto';

// Server-only. Save as: lib/bookingPayments.ts

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

const resend = new Resend(process.env.RESEND_API_KEY);

// Same switch the checkout page uses (NEXT_PUBLIC_QUICKTELLER_MODE) so the payment and its verification
// can never point at different environments. QUICKTELLER_ENV is only a fallback when that is unset.
const MODE = (process.env.NEXT_PUBLIC_QUICKTELLER_MODE || process.env.QUICKTELLER_ENV || '').trim().toUpperCase();
const IS_LIVE = MODE === 'LIVE';
const INTERSWITCH_BASE = IS_LIVE ? 'https://webpay.interswitchng.com' : 'https://qa.interswitchng.com';

const escapeHtml = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

/** Ask Interswitch (server to server) what really happened to this transaction. */
export async function verifyWithInterswitch(txRef: string, amountKobo: number) {
  // No hardcoded fallbacks: if config is missing we want a loud failure, not a wrong merchant.
  const merchantCode = process.env.NEXT_PUBLIC_QUICKTELLER_MERCHANT_CODE;
  if (!merchantCode) throw new Error('NEXT_PUBLIC_QUICKTELLER_MERCHANT_CODE is not set');

  const url =
    `${INTERSWITCH_BASE}/collections/api/v1/gettransaction.json` +
    `?merchantcode=${encodeURIComponent(merchantCode)}` +
    `&transactionreference=${encodeURIComponent(txRef)}` +
    `&amount=${amountKobo}`;

  // Optional signed request. Only used if you set a real MAC key (separate from the client secret).
  const payItemId = process.env.NEXT_PUBLIC_QUICKTELLER_PAY_ITEM_ID || '';
  const macKey = process.env.QUICKTELLER_MAC_KEY || '';
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (macKey) {
    headers.Hash = crypto.createHash('sha512').update(`${payItemId}${txRef}${macKey}`).digest('hex');
  }

  const attempt = async (u: string) => {
    const r = await fetch(u, { headers, cache: 'no-store' });
    const t = await r.text();
    let d: any = null;
    try { d = JSON.parse(t); } catch { /* not json */ }
    return { res: r, text: t, data: d };
  };

  let { res, text, data } = await attempt(url);
  if (!data || res.status === 404) {
    ({ res, text, data } = await attempt(url.replace('/gettransaction.json?', '/gettransaction?')));
  }
  data = data || {};

  console.log('[Interswitch verify]', {
    mode: IS_LIVE ? 'LIVE' : 'TEST',
    base: INTERSWITCH_BASE,
    txRef,
    amountKobo,
    http: res.status,
    body: text.slice(0, 500),
  });

  const code = String(data?.ResponseCode ?? data?.responseCode ?? '');
  const returnedAmount = Number(data?.Amount ?? data?.amount);

  // No response code at all = we did not get a real answer (HTML error page, auth/hash rejected, outage).
  // That is "could not check", NOT "not paid", so callers retry instead of declaring failure.
  if (!code) throw new Error(`Interswitch returned no ResponseCode (HTTP ${res.status})`);

  const approved = code === '00';
  const amountMatches = returnedAmount === amountKobo;
  if (approved && !amountMatches) {
    console.error('[Interswitch verify] APPROVED BUT AMOUNT MISMATCH', { txRef, expected: amountKobo, got: returnedAmount });
  }

  return {
    // Strict: approved AND the exact amount we stored. A missing/zero amount is NOT accepted.
    paid: approved && amountMatches,
    code,
    description:
      approved && !amountMatches
        ? `Approved but amount mismatch (expected ${amountKobo}, got ${returnedAmount})`
        : data?.ResponseDescription ?? data?.responseDescription,
  };
}

export type ConfirmResult =
  | { status: 'paid'; booking: any; newlyConfirmed: boolean }
  | { status: 'not_found' }
  | { status: 'not_paid'; code: string; description?: string }
  | { status: 'provider_error' }
  | { status: 'db_error' };

/**
 * The ONE place a booking becomes Paid. Used by both the success-page verify route and the webhook.
 * It never trusts the caller: the amount comes from our stored row and the payment is confirmed with Interswitch.
 */
export async function confirmBookingByReference(txRef: string): Promise<ConfirmResult> {
  const { data: row, error: readErr } = await supabase.from('Booking').select('*').eq('reference', txRef).maybeSingle();
  if (readErr) {
    console.error('[confirm] read error:', readErr.message);
    return { status: 'db_error' };
  }
  if (!row) return { status: 'not_found' };
  if (row.paymentStatus === 'Paid') return { status: 'paid', booking: row, newlyConfirmed: false };

  const amountKobo = Math.round(Number(row.grandTotal) * 100);

  let result;
  try {
    result = await verifyWithInterswitch(txRef, amountKobo);
  } catch (err) {
    console.error('[confirm] Interswitch unreachable/misconfigured:', err);
    return { status: 'provider_error' };
  }
  if (!result.paid) return { status: 'not_paid', code: result.code, description: result.description };

  // Atomic Pending -> Paid. Only the caller that flips it sends the email.
  const { data: updated, error: updErr } = await supabase
    .from('Booking')
    .update({ status: 'Confirmed', paymentStatus: 'Paid', updatedAt: new Date().toISOString() })
    .eq('id', row.id)
    .neq('paymentStatus', 'Paid')
    .select()
    .maybeSingle();

  if (updErr) {
    console.error('[confirm] update error:', updErr.message);
    return { status: 'db_error' };
  }
  if (!updated) {
    const { data: again } = await supabase.from('Booking').select('*').eq('reference', txRef).maybeSingle();
    return { status: 'paid', booking: again || row, newlyConfirmed: false };
  }

  await sendConfirmationEmail(updated);
  return { status: 'paid', booking: updated, newlyConfirmed: true };
}

export async function sendConfirmationEmail(b: any) {
  try {
    if (!b.customerEmail) return;

    let mealsHtml = '';
    const meals = b.dailyMealSelections?.meals;
    if (meals && typeof meals === 'object') {
      Object.entries(meals as Record<string, any>).forEach(([date, dayMeals]) => {
        const items = Object.entries(dayMeals as Record<string, any>);
        if (!items.length) return;
        mealsHtml += `<h4 style="color:#fbbf24;margin:10px 0 4px;">${escapeHtml(date)}</h4><ul>`;
        items.forEach(([mealId, d]: [string, any]) => {
          mealsHtml += `<li><strong>${escapeHtml(mealId)}</strong> - ${escapeHtml(d?.liters ?? d?.qty ?? 1)} L/portions</li>`;
        });
        mealsHtml += `</ul>`;
      });
    }

    const addons = b.addons && typeof b.addons === 'object' ? b.addons : {};
    let addonsHtml = '<p>No additional concierge services selected.</p>';
    if (Object.keys(addons).length > 0) {
      addonsHtml = '<ul>' + Object.entries(addons).map(([k, v]) =>
        `<li><strong>${escapeHtml(k)}:</strong> ${escapeHtml(typeof v === 'object' ? JSON.stringify(v) : v)}</li>`
      ).join('') + '</ul>';
    }

    await resend.emails.send({
      // Until your domain is verified in Resend, use onboarding@resend.dev
      // (it can only deliver to your own Resend account email).
      from: process.env.RESEND_FROM_EMAIL || 'Concierge Stay <onboarding@resend.dev>',
      to: [b.customerEmail],
      subject: `Booking Confirmation - ${b.apartmentTitle || 'Luxury Apartment'}`,
      html: `
        <div style="font-family:sans-serif;background:#060b13;color:#f8fafc;padding:24px;border-radius:12px;">
          <h2 style="color:#fbbf24;border-bottom:1px solid #334155;padding-bottom:12px;">Reservation Confirmed!</h2>
          <p>Hello <strong>${escapeHtml(b.customerName || 'Valued Guest')}</strong>,</p>
          <p>Your payment has been verified and your reservation is secured.</p>
          <div style="background:#0b121e;padding:16px;border-radius:8px;margin:16px 0;border:1px solid #1e293b;">
            <h3 style="color:#fbbf24;margin-top:0;">Stay Details</h3>
            <p><strong>Apartment:</strong> ${escapeHtml(b.apartmentTitle || 'N/A')}</p>
            <p><strong>Duration:</strong> ${escapeHtml(b.totalNights)} Night(s)</p>
            <p><strong>Reference ID:</strong> ${escapeHtml(b.reference)}</p>
          </div>
          <div style="background:#0b121e;padding:16px;border-radius:8px;margin:16px 0;border:1px solid #1e293b;">
            <h3 style="color:#fbbf24;margin-top:0;">Meals</h3>${mealsHtml || '<p>No meals selected.</p>'}
          </div>
          <div style="background:#0b121e;padding:16px;border-radius:8px;margin:16px 0;border:1px solid #1e293b;">
            <h3 style="color:#fbbf24;margin-top:0;">Concierge Add-Ons</h3>${addonsHtml}
          </div>
          <p style="font-size:16px;color:#fbbf24;"><strong>Total Paid: ₦${Number(b.grandTotal).toLocaleString()}</strong></p>
        </div>`,
    });
  } catch (emailError) {
    console.error('[Resend email error]:', emailError);
  }
}