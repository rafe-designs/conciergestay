// ====================================================================
// FILE: src/app/api/bookings/verify/route.ts
// Fully updated route with clean conditional parsing for Meals & Add-ons,
// SC_ reference standardizing, and distinct Guest vs. Admin emails via Resend.
// ====================================================================

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export const runtime = 'nodejs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';
const supabase = createClient(supabaseUrl, supabaseKey);

const resend = new Resend(process.env.RESEND_API_KEY);

const escapeHtml = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

const sanitizeReference = (ref: string): string => {
  if (!ref) return `SC_${Date.now()}`;
  let clean = ref.replace(/^(VACEUP_|PSTK_|CS_)/i, 'SC_');
  if (!clean.startsWith('SC_')) {
    clean = `SC_${clean.replace(/^(REF_|TRX_)?/, '')}`;
  }
  return clean;
};

// ====================================================================
// CONDITIONAL PARSERS (Renders HTML ONLY if items were selected)
// ====================================================================

function parseMealSelectionsHtml(dailyMealsObj: any): string {
  if (!dailyMealsObj) return '';

  const meals = dailyMealsObj.meals || {};
  const soups = dailyMealsObj.soups || {};
  const dates = Array.from(new Set([...Object.keys(meals), ...Object.keys(soups)])).sort();

  if (dates.length === 0) return '';

  let dayBlocks = '';

  dates.forEach((dateStr, idx) => {
    const formattedDate = new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const dayMeals = meals[dateStr] || {};
    const daySoups = soups[dateStr] || {};

    let listItems = '';

    // Parse Regular Meals
    Object.entries(dayMeals).forEach(([mealId, data]: [string, any]) => {
      if (data?.liters > 0) {
        const proteinList = (data.proteins || [])
          .filter((p: any) => p.qty > 0)
          .map((p: any) => `${escapeHtml(p.id)} (x${p.qty})`)
          .join(', ');
        const proteinStr = proteinList ? ` — <em>Proteins: ${proteinList}</em>` : '';
        listItems += `<li style="margin-bottom:4px;"><strong>${escapeHtml(mealId)}</strong>: ${data.liters} Ltr(s)${proteinStr}</li>`;
      }
    });

    // Parse Soups & Spiced Comforts
    Object.entries(daySoups).forEach(([soupId, data]: [string, any]) => {
      if (data?.liters > 0) {
        const swallowStr = data.swallow ? ` (Swallow: ${escapeHtml(data.swallow)})` : '';
        const proteinList = (data.proteins || [])
          .filter((p: any) => p.qty > 0)
          .map((p: any) => `${escapeHtml(p.id)} (x${p.qty})`)
          .join(', ');
        const proteinStr = proteinList ? ` — <em>Proteins: ${proteinList}</em>` : '';
        listItems += `<li style="margin-bottom:4px;"><strong>${escapeHtml(soupId)}</strong>: ${data.liters} Ltr(s)${swallowStr}${proteinStr}</li>`;
      }
    });

    if (listItems) {
      dayBlocks += `
        <div style="background:#0f172a;border:1px solid #1e293b;padding:12px;border-radius:8px;margin-bottom:10px;">
          <strong style="color:#fbbf24;font-size:13px;display:block;margin-bottom:6px;">Day ${idx + 1} (${formattedDate})</strong>
          <ul style="margin:0;padding-left:18px;color:#e2e8f0;font-size:12px;line-height:1.5;">${listItems}</ul>
        </div>
      `;
    }
  });

  if (!dayBlocks) return '';

  return `
    <h3 style="color:#fbbf24;font-size:14px;margin-top:24px;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px;">🍽️ Culinary & Dining Selections</h3>
    ${dayBlocks}
  `;
}

function parseAddonsHtml(addons: any): string {
  if (!addons) return '';

  const items: string[] = [];

  if (addons.airportTransfer && addons.airportTransfer !== 'None' && addons.airportTransfer !== 'none') {
    items.push(`🚘 <strong>Airport Transfer:</strong> ${escapeHtml(addons.airportTransfer)}`);
  }
  if (addons.chauffeurService && addons.chauffeurService !== 'None' && addons.chauffeurService !== 'none') {
    items.push(`🚘 <strong>Chauffeur Service:</strong> ${escapeHtml(addons.chauffeurService)}`);
  }
  if (addons.securityService && addons.securityService !== 'None' && addons.securityService !== 'none') {
    items.push(`🛡️ <strong>Security Detail:</strong> ${escapeHtml(addons.securityService)}`);
  }
  if (addons.shoppersService && addons.shoppersService !== 'None' && addons.shoppersService !== 'none') {
    items.push(`🛍️ <strong>Personal Shoppers:</strong> ${escapeHtml(addons.shoppersService)}`);
  }

  const laundryParts = [
    Number(addons.laundryAdult) > 0 ? `${addons.laundryAdult} Adult outfit(s)` : '',
    Number(addons.laundryKid) > 0 ? `${addons.laundryKid} Kids outfit(s)` : '',
    Number(addons.laundrySuit) > 0 ? `${addons.laundrySuit} Ceremonial/Suit(s)` : '',
  ].filter(Boolean);
  if (laundryParts.length > 0) {
    items.push(`🧺 <strong>Laundry Service:</strong> ${escapeHtml(laundryParts.join(', '))}`);
  }

  if (addons.housekeepingActive === 'yes') {
    items.push(`🧹 <strong>Housekeeping:</strong> Active (${escapeHtml(addons.housekeepingSchedule)})`);
  }
  if (addons.beddingBeddings === 'yes') {
    items.push(`🛩️ <strong>Daily Fresh Beddings Change:</strong> Included`);
  }
  if (addons.beddingTowels === 'yes') {
    items.push(`🛩️ <strong>Daily Luxury Towels Change:</strong> Included`);
  }

  if (items.length === 0) return '';

  return `
    <h3 style="color:#fbbf24;font-size:14px;margin-top:24px;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px;">✨ Bespoke Concierge Add-Ons</h3>
    <div style="background:#0f172a;border:1px solid #1e293b;padding:12px;border-radius:8px;">
      <ul style="margin:0;padding-left:18px;color:#e2e8f0;font-size:12px;line-height:1.6;">
        ${items.map((i) => `<li>${i}</li>`).join('')}
      </ul>
    </div>
  `;
}

// ====================================================================
// DISPATCH SEPARATE GUEST & ADMIN EMAILS
// ====================================================================

async function dispatchBookingEmails(booking: any, rawPayload: any) {
  try {
    const guestEmail = booking.customerEmail || booking.email;
    const adminEmail = process.env.CONTACT_TO_EMAIL || 'info@sunshineconcierge.org';
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Concierge Stay <bookings@sunshineconcierge.org>';

    const mealsSection = parseMealSelectionsHtml(rawPayload?.dailyMealSelections);
    const addonsSection = parseAddonsHtml(rawPayload?.addons);

    // 1. GUEST CONFIRMATION EMAIL (Clean, elegant receipt)
    if (guestEmail) {
      const guestHtml = `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#060b13;color:#f8fafc;padding:28px;border-radius:14px;border:1px solid #1e293b;">
          <h2 style="color:#fbbf24;margin-top:0;font-size:20px;">Reservation Confirmed</h2>
          <p style="font-size:14px;line-height:1.5;">Dear <strong>${escapeHtml(booking.customerName || 'Guest')}</strong>,</p>
          <p style="font-size:14px;line-height:1.5;color:#cbd5e1;">Your payment of <strong>₦${Number(booking.grandTotal || 0).toLocaleString()}</strong> for your stay at <strong>${escapeHtml(booking.apartmentTitle)}</strong> has been successfully processed.</p>
          
          <div style="background:#0b121e;padding:16px;border-radius:10px;margin:20px 0;border:1px solid #1e293b;font-size:13px;line-height:1.6;">
            <p style="margin:4px 0;"><strong>Reference:</strong> <span style="color:#fbbf24;font-family:monospace;font-weight:bold;">${escapeHtml(booking.reference)}</span></p>
            <p style="margin:4px 0;"><strong>Check-In:</strong> ${new Date(booking.checkIn).toLocaleDateString()}</p>
            <p style="margin:4px 0;"><strong>Check-Out:</strong> ${new Date(booking.checkOut).toLocaleDateString()} (${booking.totalNights} Night/s)</p>
          </div>

          ${mealsSection}
          ${addonsSection}

          <hr style="border:0;border-top:1px solid #1e293b;margin:28px 0;" />
          <p style="font-size:12px;color:#94a3b8;text-align:center;margin:0;">Our concierge team will reach out shortly to assist with your arrival and coordinate your stay.</p>
        </div>
      `;

      await resend.emails.send({
        from: fromEmail,
        to: [guestEmail],
        subject: `Booking Confirmation [${booking.reference}] - Sunshine Concierge`,
        html: guestHtml,
      });
    }

    // 2. ADMIN OPERATIONAL ALERT (Fulfillment & Ops details)
    const adminHtml = `
      <div style="font-family:sans-serif;max-width:650px;margin:auto;background:#090d16;color:#f8fafc;padding:28px;border-radius:14px;border:2px solid #fbbf24;">
        <span style="background:#fbbf24;color:#090d16;font-size:10px;font-weight:bold;padding:4px 8px;border-radius:4px;text-transform:uppercase;letter-spacing:1px;">Paid Reservation — Action Required</span>
        <h2 style="color:#ffffff;margin:12px 0 4px;font-size:20px;">Operational Summary: ${escapeHtml(booking.reference)}</h2>
        <p style="color:#94a3b8;font-size:13px;margin:0 0 20px;">Confirmed via Paystack. Please initiate team assignments and fulfillment scheduling.</p>

        <div style="background:#131c2e;padding:16px;border-radius:10px;margin-bottom:16px;border:1px solid #1e293b;">
          <h4 style="color:#fbbf24;margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Guest Information</h4>
          <p style="margin:4px 0;font-size:13px;"><strong>Name:</strong> ${escapeHtml(booking.customerName)}</p>
          <p style="margin:4px 0;font-size:13px;"><strong>Email:</strong> ${escapeHtml(booking.customerEmail)}</p>
          <p style="margin:4px 0;font-size:13px;"><strong>Phone:</strong> ${escapeHtml(booking.phone || 'N/A')}</p>
          <p style="margin:4px 0;font-size:13px;"><strong>Residence:</strong> ${escapeHtml(booking.apartmentTitle)}</p>
          <p style="margin:4px 0;font-size:13px;"><strong>Dates:</strong> ${new Date(booking.checkIn).toLocaleDateString()} to ${new Date(booking.checkOut).toLocaleDateString()} (${booking.totalNights} Nights)</p>
        </div>

        <div style="background:#131c2e;padding:16px;border-radius:10px;margin-bottom:16px;border:1px solid #1e293b;">
          <h4 style="color:#fbbf24;margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Financial Summary</h4>
          <p style="margin:4px 0;font-size:13px;"><strong>Base Rent Total:</strong> ₦${Number(booking.baseRentTotal || 0).toLocaleString()}</p>
          <p style="margin:4px 0;font-size:13px;"><strong>Services & Dining Total:</strong> ₦${Number(booking.servicesTotal || 0).toLocaleString()}</p>
          <p style="margin:4px 0;font-size:15px;color:#fbbf24;font-weight:bold;"><strong>Grand Total Collected:</strong> ₦${Number(booking.grandTotal || 0).toLocaleString()}</p>
        </div>

        ${mealsSection}
        ${addonsSection}
      </div>
    `;

    await resend.emails.send({
      from: fromEmail,
      to: [adminEmail],
      subject: `🚨 NEW BOOKING ALERT [${booking.reference}] - ${booking.customerName}`,
      html: adminHtml,
    });
  } catch (err) {
    console.error('[Resend Dispatch Error]:', err);
  }
}

// ====================================================================
// MAIN API ROUTE HANDLER
// ====================================================================

export async function POST(request: Request) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload received' }, { status: 400 });
    }

    const raw = body?.bookingData || body;
    const rawTxRef = (
      body?.transactionRef ||
      body?.reference ||
      raw?.transactionRef ||
      raw?.reference
    )?.trim();

    const txRef = sanitizeReference(rawTxRef);

    if (!txRef) {
      return NextResponse.json({ error: 'Missing transaction reference' }, { status: 400 });
    }

    const nights = Number(raw?.totalNights ?? raw?.nights ?? 1);
    const baseRent = Number(raw?.baseRentTotal ?? raw?.stayCost ?? 0);
    const services = Number(raw?.servicesTotal ?? raw?.diningTotal ?? raw?.totalConciergePrice ?? 0);
    const grandTot = Number(raw?.grandTotal ?? (baseRent + services) ?? 0);
    const aptCut = Number(raw?.apartmentCut ?? baseRent ?? 0);
    const platFee = Number(raw?.platformFee ?? 0);
    const servCut = Number(raw?.servicesCut ?? services ?? 0);

    const custName = raw?.guestInfo?.fullName || raw?.customerName || 'Guest';
    const custEmail = raw?.guestInfo?.email || raw?.customerEmail || '';
    const custPhone = raw?.guestInfo?.phone || raw?.phone || '';
    const aptTitle = raw?.apartmentTitle || 'Sunshine Concierge Residence';
    const listId = raw?.listingId || 'new-horizon';
    const nowIso = new Date().toISOString();

    // 1. INITIATE ACTION (From Checkout before Paystack iframe opens)
    if (body?.action === 'initiate') {
      const bookingData: Record<string, any> = {
        reference: txRef,
        paymentReference: txRef,
        customerName: custName,
        customerEmail: custEmail,
        phone: custPhone,
        grandTotal: grandTot,
        baseRentTotal: baseRent,
        servicesTotal: services,
        apartmentCut: aptCut,
        platformFee: platFee,
        servicesCut: servCut,
        apartmentTitle: aptTitle,
        listingId: listId,
        totalNights: nights > 0 ? nights : 1,
        status: 'Pending',
        paymentStatus: 'Pending',
        checkIn: raw?.checkIn ? new Date(raw.checkIn).toISOString() : nowIso,
        checkOut: raw?.checkOut ? new Date(raw.checkOut).toISOString() : nowIso,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      const { data: existing } = await supabase
        .from('Booking')
        .select('id')
        .eq('reference', txRef)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ success: true, alreadyExists: true }, { status: 200 });
      }

      const { error } = await supabase.from('Booking').insert([bookingData]);

      if (error) {
        console.error('[Verify Initiate Error]:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true }, { status: 201 });
    }

    // 2. IDEMPOTENCY CHECK
    const { data: existingBooking } = await supabase
      .from('Booking')
      .select('*')
      .or(`reference.eq.${txRef},paymentReference.eq.${txRef}`)
      .maybeSingle();

    if (existingBooking && (existingBooking.paymentStatus === 'Paid' || existingBooking.status === 'Confirmed')) {
      return NextResponse.json({ success: true, booking: existingBooking }, { status: 200 });
    }

    // 3. PAYSTACK SERVER VERIFICATION
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      return NextResponse.json({ error: 'Paystack secret key missing on server' }, { status: 500 });
    }

    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(txRef)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );

    const paystackData = await paystackRes.json();

    if (!paystackRes.ok || !paystackData.status || paystackData.data?.status !== 'success') {
      const failReason = paystackData?.data?.gateway_response || paystackData?.message || 'Payment verification failed';
      return NextResponse.json({ error: 'Payment verification failed', message: failReason }, { status: 402 });
    }

    const paystackTx = paystackData.data;
    const verifiedAmount = paystackTx.amount / 100;

    // 4. UPDATE DB ROW & DISPATCH SEPARATE EMAILS
    const updatePayload = {
      status: 'Confirmed',
      paymentStatus: 'Paid',
      paymentReference: String(paystackTx.id || txRef),
      grandTotal: grandTot > 0 ? grandTot : verifiedAmount,
      totalNights: nights > 0 ? nights : 1,
      apartmentCut: aptCut,
      platformFee: platFee,
      servicesCut: servCut,
      updatedAt: nowIso,
    };

    let finalBookingRow: any = null;

    if (existingBooking) {
      const { data: updatedRow, error: updateError } = await supabase
        .from('Booking')
        .update(updatePayload)
        .eq('reference', txRef)
        .select()
        .maybeSingle();

      if (updateError) console.error('[Verify DB Update Error]:', updateError.message);
      finalBookingRow = updatedRow || existingBooking;
    } else {
      const newRow = {
        reference: txRef,
        paymentReference: String(paystackTx.id || txRef),
        customerName: custName || paystackTx.customer?.first_name || 'Guest',
        customerEmail: custEmail || paystackTx.customer?.email || '',
        phone: custPhone,
        grandTotal: grandTot > 0 ? grandTot : verifiedAmount,
        apartmentTitle: aptTitle,
        listingId: listId,
        totalNights: nights > 0 ? nights : 1,
        baseRentTotal: baseRent,
        servicesTotal: services,
        apartmentCut: aptCut,
        platformFee: platFee,
        servicesCut: servCut,
        status: 'Confirmed',
        paymentStatus: 'Paid',
        checkIn: nowIso,
        checkOut: nowIso,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      const { data: insertedRow, error: insertError } = await supabase
        .from('Booking')
        .insert([newRow])
        .select()
        .single();

      if (insertError) console.error('[Verify Fallback Insert Error]:', insertError.message);
      finalBookingRow = insertedRow;
    }

    // Trigger Resend Emails (Asynchronous execution)
    if (finalBookingRow) {
      dispatchBookingEmails(finalBookingRow, raw);
    }

    return NextResponse.json({ success: true, booking: finalBookingRow || paystackTx }, { status: 200 });

  } catch (error: any) {
    console.error('[API POST Booking Verification Error]:', error);
    return NextResponse.json(
      { error: 'Failed to process booking verification', message: error?.message || 'Internal Error' },
      { status: 500 }
    );
  }
}