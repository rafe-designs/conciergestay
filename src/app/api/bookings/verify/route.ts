import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  '';

const supabase = createClient(supabaseUrl, supabaseKey);

const safeParseJson = (data: any): any => {
  if (!data) return {};
  if (typeof data === 'object') return data;
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return safeParseJson(parsed);
    } catch {
      return {};
    }
  }
  return {};
};

// Helper: Calculate individual service totals for sub-department tracking
export const computeDepartmentalBreakdown = (
  addons: any,
  dailyMealSelections: any,
  nights: number = 1
) => {
  let kitchen = 0;
  let housekeeping = 0;
  let chauffeur = 0;
  let airport = 0;
  let security = 0;
  let laundry = 0;
  let beddings = 0;
  let shopper = 0;

  // 1. Kitchen & Meals
  if (dailyMealSelections && typeof dailyMealSelections === 'object') {
    Object.values(dailyMealSelections).forEach((dayVal: any) => {
      if (typeof dayVal === 'object' && dayVal !== null) {
        Object.values(dayVal).forEach((mealItem: any) => {
          if (typeof mealItem === 'object' && mealItem !== null) {
            kitchen += Number(
              mealItem?.price || mealItem?.amount || mealItem?.cost || mealItem?.total || 0
            );
          } else if (typeof mealItem === 'number') {
            kitchen += mealItem;
          }
        });
      }
    });
  }
  if (kitchen === 0 && (addons?.kitchen || addons?.food || addons?.meals || addons?.chef)) {
    const k = addons?.kitchen || addons?.food || addons?.meals || addons?.chef;
    kitchen = Number(k?.price || k?.amount || k?.total || k?.cost || 0);
  }

  // 2. Chauffeur
  if (addons?.chauffeur || addons?.chauffeurService) {
    const c = addons?.chauffeur || addons?.chauffeurService;
    const baseRate = Number(c?.baseRate || c?.price || c?.amount || 0);
    chauffeur = baseRate > 0 ? baseRate * nights : Number(c?.total || c?.price || c?.amount || 0);
  }

  // 3. Airport Transfer
  if (addons?.airport || addons?.airportTransfer) {
    const a = addons?.airport || addons?.airportTransfer;
    const baseRate = Number(a?.baseRate || a?.price || a?.amount || 0);
    const tripType = String(a?.tripType || a?.direction || '').toLowerCase();
    const multiplier = tripType.includes('round') || tripType.includes('2x') ? 2 : 1;
    airport = baseRate > 0 ? baseRate * multiplier : Number(a?.total || a?.price || a?.amount || 0);
  }

  // 4. Security
  if (addons?.security || addons?.securityService) {
    const s = addons?.security || addons?.securityService;
    const baseRate = Number(s?.baseRate || s?.price || s?.amount || 0);
    const guards = Number(s?.count || s?.guards || s?.personnel || 1);
    security = baseRate > 0 ? baseRate * guards * nights : Number(s?.total || s?.price || s?.amount || 0);
  }

  // 5. Laundry
  if (addons?.laundry || addons?.drycleaning) {
    const l = addons?.laundry || addons?.drycleaning;
    if (typeof l === 'object') {
      Object.entries(l).forEach(([key, val]: [string, any]) => {
        if (key === 'price' || key === 'total' || key === 'amount') return;
        const count = typeof val === 'object' ? Number(val?.count || 0) : parseInt(val || '0', 10);
        const rate = typeof val === 'object' ? Number(val?.rate || 0) : 0;
        if (!isNaN(count) && count > 0) {
          laundry += count * rate;
        }
      });
    }
    if (laundry === 0) laundry = Number(l?.price || l?.total || l?.amount || 0);
  }

  // 6. Housekeeping
  if (addons?.housekeeping || addons?.cleaning) {
    const h = addons?.housekeeping || addons?.cleaning;
    housekeeping = Number(h?.price || h?.amount || h?.total || 0);
  }

  // 7. Beddings & Linen
  if (addons?.beddings || addons?.linen) {
    const b = addons?.beddings || addons?.linen;
    beddings = Number(b?.price || b?.amount || b?.total || 0);
  }

  // 8. Personal Shopper
  if (addons?.shopper || addons?.personalShopper) {
    const sh = addons?.shopper || addons?.personalShopper;
    const baseRate = Number(sh?.baseRate || sh?.price || sh?.amount || 0);
    const count = Number(sh?.count || sh?.shoppers || 1);
    shopper = baseRate > 0 ? baseRate * count * nights : Number(sh?.total || sh?.price || sh?.amount || 0);
  }

  const servicesTotalSum =
    kitchen + housekeeping + chauffeur + airport + security + laundry + beddings + shopper;

  return {
    kitchen,
    housekeeping,
    chauffeur,
    airport,
    security,
    laundry,
    beddings,
    shopper,
    servicesTotalSum,
  };
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference') || searchParams.get('trxref');

    if (!reference) {
      const { data: bookings, error } = await supabase
        .from('Booking')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) {
        console.error('[Supabase Fetch Error]:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      const formattedBookings = (bookings || []).map((b: any) => {
        const parsedMeals = safeParseJson(b.dailyMealSelections);
        const parsedAddons = safeParseJson(b.addons);
        const nights = Number(b.totalNights) || 1;
        const deptBreakdown = computeDepartmentalBreakdown(parsedAddons, parsedMeals, nights);

        const resolvedListing =
          b.listingId && b.listingId !== 'DEFAULT-LISTING'
            ? b.listingId
            : b.apartmentName || b.apartmentTitle || b.listingName || 'DEFAULT-LISTING';

        return {
          ...b,
          listingId: resolvedListing,
          phone: b.phone || b.phoneNumber || b.customerPhone || 'N/A',
          dailyMealSelections: parsedMeals,
          addons: parsedAddons,
          departmentalRevenue: deptBreakdown,
        };
      });

      return NextResponse.json({ bookings: formattedBookings }, { status: 200 });
    }

    // Direct Payment Gateway Verification Flow
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY || '';
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
        'Content-Type': 'application/json',
      },
    });

    const verifyData = await verifyRes.json();

    if (!verifyData.status || verifyData.data.status !== 'success') {
      return NextResponse.json(
        { success: false, message: 'Payment verification failed or pending' },
        { status: 400 }
      );
    }

    const txData = verifyData.data;
    const metadata = txData.metadata || {};
    const parsedMeals = safeParseJson(metadata.dailyMealSelections);
    const parsedAddons = safeParseJson(metadata.addons);
    const nights = Number(metadata.totalNights) || 1;
    const deptBreakdown = computeDepartmentalBreakdown(parsedAddons, parsedMeals, nights);

    const paidAmount = txData.amount / 100; // Convert kobo to Naira

    const payload: Record<string, any> = {
      paymentReference: reference,
      customerName:
        metadata.customerName ||
        `${txData.customer.first_name || ''} ${txData.customer.last_name || ''}`.trim() ||
        'Guest',
      customerEmail: txData.customer.email,
      phone: metadata.phone || metadata.phoneNumber || txData.customer.phone || 'N/A',
      listingId: metadata.listingId || 'DEFAULT-LISTING',
      checkIn: metadata.checkIn || new Date().toISOString(),
      checkOut: metadata.checkOut || new Date().toISOString(),
      totalNights: nights,
      baseRentTotal: Number(metadata.baseRentTotal) || paidAmount - deptBreakdown.servicesTotalSum,
      servicesTotal:
        deptBreakdown.servicesTotalSum > 0
          ? deptBreakdown.servicesTotalSum
          : Number(metadata.servicesTotal || 0),
      grandTotal: paidAmount,
      kitchenRevenue: deptBreakdown.kitchen,
      housekeepingRevenue: deptBreakdown.housekeeping,
      chauffeurRevenue: deptBreakdown.chauffeur,
      airportRevenue: deptBreakdown.airport,
      securityRevenue: deptBreakdown.security,
      laundryRevenue: deptBreakdown.laundry,
      beddingsRevenue: deptBreakdown.beddings,
      shopperRevenue: deptBreakdown.shopper,
      status: 'Confirmed',
      updatedAt: new Date().toISOString(),
      dailyMealSelections:
        typeof metadata.dailyMealSelections === 'string'
          ? metadata.dailyMealSelections
          : JSON.stringify(parsedMeals),
      addons: typeof metadata.addons === 'string' ? metadata.addons : JSON.stringify(parsedAddons),
    };

    let { data: updatedBooking, error: upsertErr } = await supabase
      .from('Booking')
      .upsert(payload, { onConflict: 'paymentReference' })
      .select();

    if (upsertErr && upsertErr.message?.includes('phone')) {
      delete payload.phone;
      const retry = await supabase
        .from('Booking')
        .upsert(payload, { onConflict: 'paymentReference' })
        .select();
      updatedBooking = retry.data;
      upsertErr = retry.error;
    }

    if (upsertErr) {
      console.error('[Supabase Verification Upsert Error]:', upsertErr);
      return NextResponse.json({ error: upsertErr.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, booking: updatedBooking?.[0] }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Verification Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const parseDate = (val: any) => {
      const parsed = new Date(val);
      return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
    };

    const now = new Date().toISOString();

    const resolvedListing =
      body.listingId ||
      body.apartmentName ||
      body.apartmentTitle ||
      body.apartment?.name ||
      body.apartment?.title ||
      'DEFAULT-LISTING';

    const extractedPhone =
      body.phone ||
      body.phoneNumber ||
      body.customerPhone ||
      body.guestInfo?.phone ||
      body.guestInfo?.phoneNumber ||
      '';

    const incomingRef = body.reference || body.paymentReference || `REF_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const parsedMeals = safeParseJson(body.dailyMealSelections);
    const parsedAddons = safeParseJson(body.addons);
    const nights = Number(body.totalNights) || 1;
    const deptBreakdown = computeDepartmentalBreakdown(parsedAddons, parsedMeals, nights);

    const payload: Record<string, any> = {
      userId: body.userId || null,
      listingId: resolvedListing,
      customerName: body.customerName || body.guestInfo?.fullName || 'Guest',
      customerEmail: body.customerEmail || body.guestInfo?.email || '',
      checkIn: parseDate(body.checkIn),
      checkOut: parseDate(body.checkOut),
      totalNights: nights,
      baseRentTotal: Number(body.baseRentTotal || body.stayCost) || 0,
      servicesTotal:
        Number(body.servicesTotal || body.totalConciergePrice) || deptBreakdown.servicesTotalSum,
      grandTotal: Number(body.grandTotal) || 0,
      kitchenRevenue: deptBreakdown.kitchen,
      housekeepingRevenue: deptBreakdown.housekeeping,
      chauffeurRevenue: deptBreakdown.chauffeur,
      airportRevenue: deptBreakdown.airport,
      securityRevenue: deptBreakdown.security,
      laundryRevenue: deptBreakdown.laundry,
      beddingsRevenue: deptBreakdown.beddings,
      shopperRevenue: deptBreakdown.shopper,
      apartmentCut: Number(body.apartmentCut || 0),
      servicesCut: Number(body.servicesCut || 0),
      platformFeeTotal: Number(body.platformFeeTotal || 0),
      status: body.status || 'Confirmed',
      paymentReference: incomingRef,
      updatedAt: now,
      dailyMealSelections:
        typeof body.dailyMealSelections === 'string'
          ? body.dailyMealSelections
          : JSON.stringify(body.dailyMealSelections || {}),
      addons:
        typeof body.addons === 'string'
          ? body.addons
          : JSON.stringify(body.addons || {}),
    };

    if (extractedPhone) {
      payload.phone = extractedPhone;
    }

    let { data, error } = await supabase
      .from('Booking')
      .upsert(
        {
          ...payload,
          createdAt: now,
        },
        { onConflict: 'paymentReference' }
      )
      .select();

    if (error && error.message?.includes('phone')) {
      delete payload.phone;
      const retry = await supabase
        .from('Booking')
        .upsert(
          {
            ...payload,
            createdAt: now,
          },
          { onConflict: 'paymentReference' }
        )
        .select();

      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error('[Supabase Save Error]:', error);
      return NextResponse.json({ error: error.message, details: error.details }, { status: 400 });
    }

    return NextResponse.json({ success: true, booking: data?.[0] }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save booking' }, { status: 500 });
  }
}