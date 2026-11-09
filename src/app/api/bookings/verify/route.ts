// ====================================================================
// FILE: app/api/bookings/verify/route.ts (Fixed servicesCut Constraint)
// ====================================================================

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('[API Parse Error]: Request body is empty or invalid JSON');
      return NextResponse.json(
        { error: 'Invalid JSON payload received' },
        { status: 400 }
      );
    }

    const raw = body?.bookingData || body;
    const txRef = (
      body?.transactionRef ||
      body?.reference ||
      raw?.transactionRef ||
      raw?.reference
    )?.trim();

    if (!txRef) {
      return NextResponse.json(
        { error: 'Missing transaction reference' },
        { status: 400 }
      );
    }

    // Extract fields safely with guaranteed defaults matching Supabase schema
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

    // 1. HANDLE INITIATE ACTION (From Checkout before Paystack opens)
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

    // 2. IDEMPOTENCY CHECK / FINAL VERIFICATION
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

    // 4. UPDATE OR INSERT VERIFIED BOOKING
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

    if (existingBooking) {
      const { data: updatedRow, error: updateError } = await supabase
        .from('Booking')
        .update(updatePayload)
        .eq('reference', txRef)
        .select()
        .maybeSingle();

      if (updateError) {
        console.error('[Verify DB Update Error]:', updateError.message);
      }
      return NextResponse.json({ success: true, booking: updatedRow || paystackTx }, { status: 200 });
    }

    // Fallback if initiate didn't run before payment
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

    if (insertError) {
      console.error('[Verify Fallback Insert Error]:', insertError.message);
    }

    return NextResponse.json({ success: true, booking: insertedRow || paystackTx }, { status: 200 });

  } catch (error: any) {
    console.error('[API POST Booking Verification Error]:', error);
    return NextResponse.json(
      { error: 'Failed to process booking verification', message: error?.message || 'Internal Error' },
      { status: 500 }
    );
  }
}