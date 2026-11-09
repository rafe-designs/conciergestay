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

    // Extract reference passed from frontend popup callback or query params
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

    // 1. IDEMPOTENCY CHECK: Check if this booking reference is already processed
    const { data: existingBooking } = await supabase
      .from('bookings')
      .select('*')
      .or(`reference.eq.${txRef},payment_reference.eq.${txRef}`)
      .maybeSingle();

    if (existingBooking) {
      console.log(`[Verify Route]: Transaction ${txRef} already processed.`);
      return NextResponse.json(
        { success: true, booking: existingBooking, alreadyProcessed: true },
        { status: 200 }
      );
    }

    // 2. PAYSTACK SERVER VERIFICATION
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      console.error('[Verify Route Error]: PAYSTACK_SECRET_KEY is missing in environment variables');
      return NextResponse.json(
        { error: 'Server configuration error: Paystack key missing' },
        { status: 500 }
      );
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
      console.warn(`[Paystack Verification Failed] Ref: ${txRef} - ${failReason}`);
      return NextResponse.json(
        { error: 'Payment verification failed', message: failReason },
        { status: 402 }
      );
    }

    const paystackTx = paystackData.data;
    const verifiedAmount = paystackTx.amount / 100; // Paystack returns amount in kobo

    // 3. MAP DATA & EXTRACT PAYLOAD
    const {
      id,
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
      diningTotal,
      totalConciergePrice,
      grandTotal,
      apartmentCut,
      platformFee,
      conciergeCut,
      servicesCut,
      kitchenCut,
      totalMealPrice,
      dailyMealSelections,
      parsedMeals,
      addons,
      activeAddons,
    } = raw || {};

    const parsedBaseRent = Number(baseRentTotal ?? stayCost ?? 0);
    const parsedServices = Number(servicesTotal ?? diningTotal ?? totalConciergePrice ?? 0);
    const calculatedGrandTotal = Number(grandTotal ?? (verifiedAmount || 0));

    const resolvedCustomerName = customerName || guestInfo?.fullName || paystackTx.customer?.first_name || 'Guest';
    const resolvedCustomerEmail = customerEmail || guestInfo?.email || paystackTx.customer?.email;
    const resolvedGuestCount = Number(guestCount || guestInfo?.guests || 1);

    const bookingData: Record<string, any> = {
      reference: txRef,
      payment_reference: String(paystackTx.id || txRef),
      check_in: checkIn ? new Date(checkIn).toISOString() : new Date().toISOString(),
      check_out: checkOut ? new Date(checkOut).toISOString() : new Date().toISOString(),
      total_nights: Number(totalNights) || 1,
      base_rent_total: parsedBaseRent,
      services_total: parsedServices,
      grand_total: calculatedGrandTotal,
      apartment_cut: Number(apartmentCut ?? parsedBaseRent),
      platform_fee: Number(platformFee ?? 0),
      concierge_cut: Number(conciergeCut ?? servicesCut ?? parsedServices),
      kitchen_cut: Number(kitchenCut ?? totalMealPrice ?? diningTotal ?? 0),
      status: 'Confirmed',
      payment_status: 'Paid',
      customer_name: resolvedCustomerName,
      customer_email: resolvedCustomerEmail,
      guest_count: resolvedGuestCount,
    };

    if (id) bookingData.id = id;
    if (apartmentTitle) bookingData.apartment_title = apartmentTitle;
    if (guestInfo) bookingData.guest_info = typeof guestInfo === 'string' ? guestInfo : JSON.stringify(guestInfo);
    if (listingId) bookingData.listing_id = listingId;
    if (userId) bookingData.user_id = userId;

    bookingData.daily_meal_selections = dailyMealSelections || parsedMeals || [];
    bookingData.addons = addons || activeAddons || {};

    // 4. DATABASE INSERT
    let { data: newBooking, error } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select()
      .single();

    if (error) {
      console.warn('[Supabase Insert Notice]: Initial insert failed, retrying without optional relational IDs...', error.message);
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
    console.error('[API POST Booking Verification Error]:', error);
    return NextResponse.json(
      { error: 'Failed to process and verify booking', message: error?.message || 'Internal Error' },
      { status: 500 }
    );
  }
}