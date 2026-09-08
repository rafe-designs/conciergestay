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
      id,
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
      guestCount,
      guestInfo,
      baseRentTotal,
      stayCost,
      servicesTotal,
      totalConciergePrice,
      grandTotal,
      apartmentCut,
      platformFee,
      platformFeeTotal,
      diningTotal,
      servicesCut,
      dailyMealSelections,
      parsedMeals,
      addons,
      activeAddons,
      status,
      paymentStatus,
    } = raw || {};

    const resolvedTxRef = txRefFromRoot || transactionRef || reference || `CS_REF_${Date.now()}`;
    const parsedBaseRent = Number(baseRentTotal ?? stayCost ?? 0);
    const parsedServices = Number(servicesTotal ?? diningTotal ?? totalConciergePrice ?? 0);
    const parsedGrandTotal = Number(grandTotal ?? 0);
    const parsedPlatformFee = Number(platformFeeTotal ?? platformFee ?? 0);

    const resolvedCustomerName = customerName || guestInfo?.fullName || '';
    const resolvedCustomerEmail = customerEmail || guestInfo?.email || '';
    const resolvedPhone = phone || guestInfo?.phone || '';
    const resolvedGuestCount = Number(guestCount || guestInfo?.guests || 1);

    const bookingData: Record<string, any> = {
      id: id || crypto.randomUUID(),
      reference: resolvedTxRef,
      paymentReference: resolvedTxRef,
      checkIn: checkIn ? new Date(checkIn).toISOString() : new Date().toISOString(),
      checkOut: checkOut ? new Date(checkOut).toISOString() : new Date().toISOString(),
      totalNights: Number(totalNights) || 1,
      baseRentTotal: parsedBaseRent,
      servicesTotal: parsedServices,
      grandTotal: parsedGrandTotal,
      apartmentCut: Number(apartmentCut ?? parsedBaseRent),
      servicesCut: Number(servicesCut ?? parsedServices),
      platformFee: parsedPlatformFee,
      platformFeeTotal: parsedPlatformFee, // Added to fulfill non-null constraint
      status: status || 'Confirmed',
      paymentStatus: paymentStatus || 'Paid',
      customerName: resolvedCustomerName,
      customerEmail: resolvedCustomerEmail,
      phone: resolvedPhone,
      guestCount: resolvedGuestCount,
      apartmentTitle: apartmentTitle || '',
      listingId: listingId || '',
      dailyMealSelections: dailyMealSelections || parsedMeals || [],
      addons: addons || activeAddons || {},
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