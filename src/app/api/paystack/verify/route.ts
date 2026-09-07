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
      return NextResponse.json(
        { error: 'Invalid JSON payload received' },
        { status: 400 }
      );
    }

    // Unwrap bookingData if nested by the frontend payload structure
    const raw = body?.bookingData || body;
    const txRefFromRoot = body?.transactionRef;

    const {
      id,
      reference,
      transactionRef,
      listingId,
      apartmentTitle,
      userId,
      customerEmail,
      customerName,
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
      conciergeCut,
      kitchenCut,
      totalMealPrice,
      diningTotal,
      servicesCut,
      dailyMealSelections,
      parsedMeals,
      addons,
      activeAddons,
      status,
      paymentStatus,
    } = raw || {};

    const resolvedTxRef = txRefFromRoot || transactionRef || reference;
    const parsedBaseRent = Number(baseRentTotal ?? stayCost ?? 0);
    const parsedServices = Number(servicesTotal ?? diningTotal ?? totalConciergePrice ?? 0);
    const parsedGrandTotal = Number(grandTotal ?? 0);
    const parsedKitchenCut = Number(kitchenCut ?? totalMealPrice ?? diningTotal ?? 0);
    const bookingRef = resolvedTxRef || id || `CS_REF_${Date.now()}`;

    // Extract values safely from nested guestInfo object
    const resolvedCustomerName = customerName || guestInfo?.fullName;
    const resolvedCustomerEmail = customerEmail || guestInfo?.email;
    const resolvedGuestCount = guestCount || guestInfo?.guests;

    const bookingData: Record<string, any> = {
      reference: bookingRef,
      check_in: checkIn ? new Date(checkIn).toISOString() : new Date().toISOString(),
      check_out: checkOut ? new Date(checkOut).toISOString() : new Date().toISOString(),
      total_nights: Number(totalNights) || 1,
      base_rent_total: parsedBaseRent,
      services_total: parsedServices,
      grand_total: parsedGrandTotal,
      apartment_cut: Number(apartmentCut ?? parsedBaseRent),
      platform_fee: Number(platformFee ?? 0),
      concierge_cut: Number(conciergeCut ?? servicesCut ?? parsedServices),
      kitchen_cut: parsedKitchenCut,
      status: status || 'Confirmed',
      payment_status: paymentStatus || 'Paid',
    };

    if (id) bookingData.id = id;
    if (resolvedCustomerName) bookingData.customer_name = resolvedCustomerName;
    if (resolvedCustomerEmail) bookingData.customer_email = resolvedCustomerEmail;
    if (resolvedGuestCount) bookingData.guest_count = Number(resolvedGuestCount);
    if (apartmentTitle) bookingData.apartment_title = apartmentTitle;
    if (guestInfo) bookingData.guest_info = typeof guestInfo === 'string' ? guestInfo : JSON.stringify(guestInfo);
    if (listingId) bookingData.listing_id = listingId;
    if (userId) bookingData.user_id = userId;

    bookingData.daily_meal_selections = dailyMealSelections || parsedMeals || [];
    bookingData.addons = addons || activeAddons || {};

    let { data: newBooking, error } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select()
      .single();

    if (error) {
      console.warn('[Supabase Insert Notice]: Retrying without relational IDs...', error.message);
      delete bookingData.listing_id;
      delete bookingData.user_id;

      const retryResult = await supabase
        .from('bookings')
        .insert([bookingData])
        .select()
        .single();

      if (retryResult.error) throw retryResult.error;
      newBooking = retryResult.data;
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