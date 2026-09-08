import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('[API Parse Error]: Request body is empty or invalid JSON');
      return NextResponse.json({ error: 'Invalid JSON payload received' }, { status: 400 });
    }

    const raw = body?.bookingData || body;
    const txRefFromRoot = body?.transactionRef;

    const {
      reference,
      transactionRef,
      listingId,
      apartmentTitle,
      customerEmail,
      customerName,
      phone,
      checkIn,
      checkOut,
      totalNights,
      guestInfo,
      baseRentTotal,
      stayCost,
      servicesTotal,
      totalConciergePrice,
      diningTotal,
      grandTotal,
      status,
    } = raw || {};

    const resolvedTxRef = txRefFromRoot || transactionRef || reference || `CS_REF_${Date.now()}`;
    const parsedBaseRent = Number(baseRentTotal ?? stayCost ?? 0);
    const parsedServices = Number(servicesTotal ?? diningTotal ?? totalConciergePrice ?? 0);
    const parsedGrandTotal = Number(grandTotal ?? 0);

    const resolvedCustomerName = customerName || guestInfo?.fullName || '';
    const resolvedCustomerEmail = customerEmail || guestInfo?.email || '';
    const resolvedPhone = phone || guestInfo?.phone || '';

    // Core safe columns guaranteed to exist or match default setups
    const bookingData: Record<string, any> = {
      reference: resolvedTxRef,
      checkIn: checkIn ? new Date(checkIn).toISOString() : new Date().toISOString(),
      checkOut: checkOut ? new Date(checkOut).toISOString() : new Date().toISOString(),
      totalNights: Number(totalNights) || 1,
      baseRentTotal: parsedBaseRent,
      servicesTotal: parsedServices,
      grandTotal: parsedGrandTotal,
      status: status || 'Confirmed',
      customerName: resolvedCustomerName,
      customerEmail: resolvedCustomerEmail,
      phone: resolvedPhone,
    };

    let { data: newBooking, error } = await supabase
      .from('Booking')
      .insert([bookingData])
      .select()
      .single();

    if (error) {
      console.error('[Supabase Insert Error]:', error.message);
      return NextResponse.json({ error: 'Database insert failed', message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, booking: newBooking }, { status: 201 });
  } catch (error: any) {
    console.error('[API POST Booking Detailed Error]:', error);
    return NextResponse.json(
      { error: 'Failed to save booking', message: error?.message || 'Internal Error' },
      { status: 500 }
    );
  }
}