import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ bookings: bookings || [] }, { status: 200 });
  } catch (error: any) {
    console.error('[API GET Bookings Error]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings', details: error.message || String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

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
      dailyMealSelections,
      parsedMeals,
      addons,
      activeAddons,
      status,
      paymentStatus,
    } = body;

    const parsedBaseRent = Number(baseRentTotal ?? stayCost ?? 0);
    const parsedServices = Number(servicesTotal ?? totalConciergePrice ?? 0);
    const parsedGrandTotal = Number(grandTotal ?? 0);
    const parsedKitchenCut = Number(kitchenCut ?? totalMealPrice ?? 0);
    const bookingRef = reference || transactionRef || id || `CS_REF_${Date.now()}`;

    // Database payload mapped for Supabase (adjust keys if your table uses camelCase or snake_case)
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
      concierge_cut: Number(conciergeCut ?? parsedServices),
      kitchen_cut: parsedKitchenCut,
      status: status || 'Confirmed',
      payment_status: paymentStatus || 'Paid',
    };

    if (id) bookingData.id = id;
    if (customerName) bookingData.customer_name = customerName;
    if (customerEmail) bookingData.customer_email = customerEmail;
    if (guestCount) bookingData.guest_count = Number(guestCount);
    if (apartmentTitle) bookingData.apartment_title = apartmentTitle;
    if (guestInfo) bookingData.guest_info = typeof guestInfo === 'string' ? guestInfo : JSON.stringify(guestInfo);
    if (listingId) bookingData.listing_id = listingId;
    if (userId) bookingData.user_id = userId;

    bookingData.daily_meal_selections = dailyMealSelections || parsedMeals || [];
    bookingData.addons = addons || activeAddons || {};

    let newBooking;
    let { data, error } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select()
      .single();

    if (error) {
      console.warn('[Supabase Insert Notice]: Primary create hit constraint. Retrying without relational IDs...', error.message);

      // Fallback removing foreign key relation fields if constraint fails
      delete bookingData.listing_id;
      delete bookingData.user_id;

      const retryResult = await supabase
        .from('bookings')
        .insert([bookingData])
        .select()
        .single();

      if (retryResult.error) {
        throw retryResult.error;
      }
      newBooking = retryResult.data;
    } else {
      newBooking = data;
    }

    return NextResponse.json({ success: true, booking: newBooking }, { status: 201 });
  } catch (error: any) {
    console.error('[API POST Booking Detailed Error]:', {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    });

    return NextResponse.json(
      {
        error: 'Failed to save booking',
        message: error?.message || 'Internal Database Error',
        code: error?.code || 'UNKNOWN_SUPABASE_ERROR',
      },
      { status: 500 }
    );
  }
}