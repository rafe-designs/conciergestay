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

// Enforces 'CS_' reference prefix and sanitizes legacy 'VACEUP_' strings
const sanitizeReference = (ref: string): string => {
  if (!ref) return `CS_${Date.now()}`;
  let clean = ref.replace(/^VACEUP_/i, 'CS_');
  if (!clean.startsWith('CS_')) {
    clean = `CS_${clean.replace(/^(REF_|TRX_)?/, '')}`;
  }
  return clean;
};

// Helper: Formats nested meal objects into clean text lines (e.g., "Breakfast: Yam and Garden Egg (₦5,000)")
const parseMealDetails = (dailyMealSelections: any) => {
  const parsed = safeParseJson(dailyMealSelections);
  let formattedLines: string[] = [];
  let totalMealCost = 0;

  if (typeof parsed === 'object' && parsed !== null) {
    Object.entries(parsed).forEach(([dateOrCategory, val]: [string, any]) => {
      if (typeof val === 'object' && val !== null) {
        Object.entries(val).forEach(([timeSlot, item]: [string, any]) => {
          let name = '';
          let cost = 0;

          if (typeof item === 'object' && item !== null) {
            name = item.name || item.title || item.dish || item.mealName || item.item || '';
            cost = Number(item.price || item.amount || item.cost || 0);
          } else if (typeof item === 'string') {
            name = item;
          }

          if (name) {
            const slotLabel = timeSlot.charAt(0).toUpperCase() + timeSlot.slice(1);
            const lineCost = cost > 0 ? ` (₦${cost.toLocaleString()})` : '';
            formattedLines.push(`${slotLabel}: ${name}${lineCost}`);
            totalMealCost += cost;
          }
        });
      }
    });
  }

  return { formattedLines, totalMealCost };
};

// Compute individual service totals for sub-department revenue tracking
const computeDepartmentalBreakdown = (addons: any, dailyMealSelections: any, nights: number = 1) => {
  let kitchen = 0;
  let housekeeping = 0;
  let chauffeur = 0;
  let airport = 0;
  let security = 0;
  let laundry = 0;
  let beddings = 0;
  let shopper = 0;

  const { totalMealCost } = parseMealDetails(dailyMealSelections);
  kitchen = totalMealCost;

  if (kitchen === 0 && (addons?.kitchen || addons?.food || addons?.meals)) {
    const k = addons?.kitchen || addons?.food || addons?.meals;
    kitchen = Number(k?.price || k?.amount || k?.total || 0);
  }

  // 2. Chauffeur Service
  if (addons?.chauffeur || addons?.chauffeurService) {
    const c = addons?.chauffeur || addons?.chauffeurService;
    const baseRate = Number(c?.baseRate || c?.price || c?.amount || 0);
    chauffeur = baseRate > 0 ? baseRate * nights : Number(c?.total || 0);
  }

  // 3. Airport Transfer
  if (addons?.airport || addons?.airportTransfer) {
    const a = addons?.airport || addons?.airportTransfer;
    const baseRate = Number(a?.baseRate || a?.price || a?.amount || 0);
    const tripType = String(a?.tripType || a?.direction || '').toLowerCase();
    const multiplier = tripType.includes('round') || tripType.includes('2x') ? 2 : 1;
    airport = baseRate > 0 ? baseRate * multiplier : Number(a?.total || 0);
  }

  // 4. Close Protection / Security
  if (addons?.security || addons?.securityService) {
    const s = addons?.security || addons?.securityService;
    const baseRate = Number(s?.baseRate || s?.price || s?.amount || 0);
    const guards = Number(s?.count || s?.guards || s?.personnel || 1);
    security = baseRate > 0 ? baseRate * guards * nights : Number(s?.total || 0);
  }

  // 5. Laundry & Dry Cleaning
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

  // 6. Housekeeping Service
  if (addons?.housekeeping || addons?.cleaning) {
    const h = addons?.housekeeping || addons?.cleaning;
    housekeeping = Number(h?.price || h?.amount || h?.total || 0);
  }

  // 7. Extra Beddings & Linen
  if (addons?.beddings || addons?.linen) {
    const b = addons?.beddings || addons?.linen;
    beddings = Number(b?.price || b?.amount || b?.total || 0);
  }

  // 8. Personal Shopper Service
  if (addons?.shopper || addons?.personalShopper) {
    const sh = addons?.shopper || addons?.personalShopper;
    const baseRate = Number(sh?.baseRate || sh?.price || sh?.amount || 0);
    const count = Number(sh?.count || sh?.shoppers || 1);
    shopper = baseRate > 0 ? baseRate * count * nights : Number(sh?.total || 0);
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

export async function GET() {
  try {
    const { data: bookings, error } = await supabase
      .from('Booking')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('[Supabase Fetch Error]:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    let overallApartmentsRevenue = 0;
    let overallServicesRevenue = 0;
    let overallGrandTotal = 0;

    const formattedBookings = (bookings || []).map((b: any) => {
      const parsedMeals = safeParseJson(b.dailyMealSelections);
      const parsedAddons = safeParseJson(b.addons);
      const nights = Math.max(1, Number(b.totalNights) || 1);

      const cleanRef = sanitizeReference(b.paymentReference || b.id);
      const { formattedLines, totalMealCost } = parseMealDetails(parsedMeals);
      const deptBreakdown = computeDepartmentalBreakdown(parsedAddons, parsedMeals, nights);

      const resolvedListing =
        b.listingId && b.listingId !== 'DEFAULT-LISTING'
          ? b.listingId
          : b.apartmentName || b.apartmentTitle || b.listingName || 'DEFAULT-LISTING';

      const kitchenRevenue = Number(b.kitchenRevenue) || deptBreakdown.kitchen || totalMealCost;
      const housekeepingRevenue = Number(b.housekeepingRevenue) || deptBreakdown.housekeeping;
      const chauffeurRevenue = Number(b.chauffeurRevenue) || deptBreakdown.chauffeur;
      const airportRevenue = Number(b.airportRevenue) || deptBreakdown.airport;
      const securityRevenue = Number(b.securityRevenue) || deptBreakdown.security;
      const laundryRevenue = Number(b.laundryRevenue) || deptBreakdown.laundry;
      const beddingsRevenue = Number(b.beddingsRevenue) || deptBreakdown.beddings;
      const shopperRevenue = Number(b.shopperRevenue) || deptBreakdown.shopper;

      const apartmentRevenue = Number(b.baseRentTotal || b.apartmentRevenue || b.stayCost || 0);
      const grandTotal =
        Number(b.grandTotal || b.totalAmount || b.total || 0) ||
        apartmentRevenue + deptBreakdown.servicesTotalSum;

      if (b.status?.toLowerCase() !== 'cancelled') {
        overallApartmentsRevenue += apartmentRevenue;
        overallServicesRevenue += deptBreakdown.servicesTotalSum;
        overallGrandTotal += grandTotal;
      }

      return {
        ...b,
        paymentReference: cleanRef,
        listingId: resolvedListing,
        phone: b.phone || b.phoneNumber || b.customerPhone || 'N/A',
        dailyMealSelections: parsedMeals,
        addons: parsedAddons,
        totalNights: nights,
        kitchenRevenue,
        housekeepingRevenue,
        chauffeurRevenue,
        airportRevenue,
        securityRevenue,
        laundryRevenue,
        beddingsRevenue,
        shopperRevenue,
        apartmentRevenue,
        grandTotal,
        departmentalBreakdown: deptBreakdown,
        kitchenDetails: {
          mealsFormatted: formattedLines,
          departmentTotal: kitchenRevenue,
        },
      };
    });

    return NextResponse.json(
      {
        bookings: formattedBookings,
        summary: {
          totalApartmentsRevenue: overallApartmentsRevenue,
          totalServicesRevenue: overallServicesRevenue,
          grandTotalRevenue: overallGrandTotal,
          totalBookingsCount: formattedBookings.length,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const now = new Date().toISOString();

    const incomingRef = body.reference || body.paymentReference || body.id;
    const cleanRef = sanitizeReference(incomingRef);

    const parsedMeals = safeParseJson(body.dailyMealSelections);
    const parsedAddons = safeParseJson(body.addons);
    const nights = Math.max(1, Number(body.totalNights) || 1);
    const deptBreakdown = computeDepartmentalBreakdown(parsedAddons, parsedMeals, nights);

    const baseRentTotal = Number(body.baseRentTotal || body.stayCost || body.apartmentRevenue) || 0;
    const servicesTotal =
      Number(body.servicesTotal || body.totalConciergePrice) || deptBreakdown.servicesTotalSum;
    const grandTotal = Number(body.grandTotal) || baseRentTotal + servicesTotal;

    const payload: Record<string, any> = {
      id: cleanRef,
      paymentReference: cleanRef,
      userId: body.userId || null,
      listingId: body.listingId || 'DEFAULT-LISTING',
      customerName: body.customerName || body.guestInfo?.fullName || 'Guest',
      customerEmail: body.customerEmail || body.guestInfo?.email || '',
      checkIn: body.checkIn || now,
      checkOut: body.checkOut || now,
      totalNights: nights,
      baseRentTotal,
      servicesTotal,
      grandTotal,
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

    if (body.phone || body.phoneNumber) {
      payload.phone = body.phone || body.phoneNumber;
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