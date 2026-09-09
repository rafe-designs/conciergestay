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

// Helper: Formats nested meal objects into clean text lines matching prep modes
const parseMealDetails = (dailyMealSelections: any, nights: number = 1) => {
  const parsed = safeParseJson(dailyMealSelections);
  let formattedLines: string[] = [];
  let totalMealCost = 0;

  const prepModes = parsed.prepModes || {};

  // Helper pricing dictionaries matching frontend layout
  const getSoupBasePrice = (soupKey: string, liters: number) => {
    let base = 35000; // default for 1L egusi/general
    if (soupKey.includes('egusi')) base = 35000;
    return base * (liters || 1);
  };

  const getProteinPrice = (proteinId: string) => {
    if (proteinId.includes('beef')) return 6000;
    if (proteinId.includes('chicken')) return 10000;
    if (proteinId.includes('goat')) return 8000;
    if (proteinId.includes('turkey')) return 12000;
    if (proteinId.includes('fish')) return 9000;
    return 5000;
  };

  // 1. Parse Soups Section
  if (parsed.soups && typeof parsed.soups === 'object') {
    Object.entries(parsed.soups).forEach(([dateStr, soupItems]: [string, any]) => {
      const mode = prepModes[dateStr] || prepModes[''] || 'delivery';
      const isChef = mode === 'in_house' || mode === 'in-house';
      const modeLabel = isChef ? 'IN-HOUSE CHEF' : 'DELIVERY';

      if (soupItems && typeof soupItems === 'object') {
        Object.entries(soupItems).forEach(([soupKey, soupVal]: [string, any]) => {
          const cleanSoupName = soupKey.replace(/^sp_/, '').toUpperCase();
          const liters = Number(soupVal?.liters || 1);
          const soupCost = getSoupBasePrice(soupKey, liters);

          formattedLines.push(`${cleanSoupName} (${liters}L) [${modeLabel}] - ₦${soupCost.toLocaleString()}`);
          totalMealCost += soupCost;

          // Swallow
          if (soupVal?.swallow) {
            formattedLines.push(`  ↳ Swallow: ${String(soupVal.swallow).toUpperCase()}`);
          }

          // Proteins
          if (Array.isArray(soupVal?.proteins)) {
            soupVal.proteins.forEach((p: any) => {
              const pId = p?.id || p?.proteinId || '';
              const pQty = Number(p?.qty || p?.quantity || 1);
              const cleanPName = pId.replace(/^pr_/, '').toUpperCase();
              const pCost = getProteinPrice(pId) * pQty;
              formattedLines.push(`  + Protein: ${cleanPName} (${pQty} pcs) - ₦${pCost.toLocaleString()}`);
              totalMealCost += pCost;
            });
          }
        });
      }
    });
  }

  // 2. Parse Standard Meals Section if present
  if (parsed.meals && typeof parsed.meals === 'object') {
    Object.entries(parsed.meals).forEach(([dateStr, mealItems]: [string, any]) => {
      const mode = prepModes[dateStr] || prepModes[''] || 'delivery';
      const isChef = mode === 'in_house' || mode === 'in-house';
      const modeLabel = isChef ? 'IN-HOUSE CHEF' : 'DELIVERY';

      if (mealItems && typeof mealItems === 'object') {
        Object.entries(mealItems).forEach(([slot, item]: [string, any]) => {
          const name = item?.name || item?.title || item?.dish || String(item || '');
          const cost = Number(item?.price || item?.amount || 0);
          if (name) {
            formattedLines.push(`${slot.toUpperCase()}: ${name} [${modeLabel}]${cost > 0 ? ` - ₦${cost.toLocaleString()}` : ''}`);
            totalMealCost += cost;
          }
        });
      }
    });
  }

  // Add In-House Chef Surcharge if any day is marked in-house
  const hasInHouseChef = Object.values(prepModes).includes('in_house') || Object.values(prepModes).includes('in-house');
  if (hasInHouseChef) {
    const chefFee = 20000 * nights;
    formattedLines.push(`In-House Chef Daily Service Charge (${nights} nights) - ₦${chefFee.toLocaleString()}`);
    totalMealCost += chefFee;
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

  const { totalMealCost } = parseMealDetails(dailyMealSelections, nights);
  kitchen = totalMealCost;

  if (kitchen === 0 && (addons?.kitchen || addons?.food || addons?.meals)) {
    const k = addons?.kitchen || addons?.food || addons?.meals;
    kitchen = Number(k?.price || k?.amount || k?.total || 0);
  }

  // 2. Chauffeur Service (Ignore 'none')
  const chauffeurVal = addons?.chauffeur || addons?.chauffeurService;
  if (chauffeurVal && !['none', 'None', 'No Dedicated Chauffeur', 'false'].includes(String(chauffeurVal))) {
    const c = chauffeurVal;
    const baseRate = typeof c === 'object' ? Number(c?.baseRate || c?.price || c?.amount || 0) : 0;
    if (baseRate > 0) {
      chauffeur = baseRate * nights;
    } else {
      if (typeof c === 'string') {
        if (c === 'sedan') chauffeur = 250000 * nights;
        else if (c === 'luxury_sedan') chauffeur = 350000 * nights;
        else if (c === 'commuter') chauffeur = 150000 * nights;
      } else if (typeof c === 'object') {
        chauffeur = Number(c?.total || 0);
      }
    }
  }

  // 3. Airport Transfer (Ignore 'none')
  const airportVal = addons?.airport || addons?.airportTransfer || addons?.airportTransferType;
  if (airportVal && !['none', 'None', 'No Airport Transfer', 'false'].includes(String(airportVal))) {
    const a = airportVal;
    let baseRate = typeof a === 'object' ? Number(a?.baseRate || a?.price || a?.amount || 0) : 0;
    
    if (baseRate === 0) {
      if (String(a) === 'sedans' || String(a) === 'sedan') baseRate = 45000;
      else if (String(a) === 'suv') baseRate = 85000;
    }

    const tripTypeObj = addons?.airportTripDirection || (typeof a === 'object' ? a?.tripType || a?.direction : '') || '';
    const tripType = String(tripTypeObj).toLowerCase();
    const multiplier = tripType.includes('round') || tripType.includes('2x') ? 2 : 1;
    
    airport = baseRate > 0 ? baseRate * multiplier : Number((typeof a === 'object' ? a?.total : 0) || 0);
  }

  // 4. Close Protection / Security (Ignore 'none')
  const securityVal = addons?.security || addons?.securityService;
  if (securityVal && !['none', 'None', 'No Additional Security', 'false'].includes(String(securityVal))) {
    const s = securityVal;
    let baseRate = typeof s === 'object' ? Number(s?.baseRate || s?.price || s?.amount || 0) : 0;

    if (baseRate === 0) {
      if (String(s) === 'tactical') baseRate = 80000;
      else if (String(s) === 'bodyguard') baseRate = 120000;
      else if (String(s) === 'bouncer') baseRate = 200000;
    }

    const guards = Number(addons?.securityCount || (typeof s === 'object' ? s?.count || s?.guards || s?.personnel : 1) || 1);
    const cappedSec = Math.min(Math.max(1, guards), 5);
    
    security = baseRate > 0 ? baseRate * cappedSec * nights : Number((typeof s === 'object' ? s?.total : 0) || 0);
  }

  // 5. Laundry & Dry Cleaning
  const laundryAdult = Number(addons?.laundryAdult || 0);
  const laundryKid = Number(addons?.laundryKid || 0);
  const laundrySuit = Number(addons?.laundrySuit || 0);
  if (laundryAdult > 0 || laundryKid > 0 || laundrySuit > 0) {
    laundry += laundryAdult * 1500 + laundryKid * 1000 + laundrySuit * 5000;
  } else {
    const l = addons?.laundry || addons?.drycleaning;
    if (l && typeof l === 'object') {
      Object.entries(l).forEach(([key, val]: [string, any]) => {
        if (key === 'price' || key === 'total' || key === 'amount') return;
        const count = typeof val === 'object' ? Number(val?.count || 0) : parseInt(val || '0', 10);
        const rate = typeof val === 'object' ? Number(val?.rate || 0) : 0;
        if (!isNaN(count) && count > 0) {
          laundry += count * rate;
        }
      });
    }
    if (laundry === 0 && l) laundry = Number(l?.price || l?.total || l?.amount || 0);
  }

  // 6. Housekeeping Service
  const hkVal = addons?.housekeeping || addons?.housekeepingActive;
  if (hkVal && !['no', 'none', 'None', 'No Housekeeping Service', 'false'].includes(String(hkVal))) {
    const schedule = addons?.housekeepingSchedule || 'daily';
    if (schedule === 'daily') {
      housekeeping = 25000 * nights;
    } else {
      const cleaningSessions = Math.max(1, Math.ceil(nights / 2));
      housekeeping = 25000 * cleaningSessions;
    }
  }

  // 7. Extra Beddings & Linen
  const beddingVal = addons?.beddingBeddings || addons?.beddings;
  if (beddingVal && !['no', 'none', 'Standard (No Daily Change)', 'false'].includes(String(beddingVal))) {
    beddings += 10000 * nights;
  }
  const towelVal = addons?.beddingTowels;
  if (towelVal && !['no', 'none', 'Standard Towel Rotation', 'false'].includes(String(towelVal))) {
    beddings += 3000 * nights;
  }

  // 8. Personal Shopper Service
  const shoppersCount = Number(addons?.shoppersCount || 0);
  if (shoppersCount > 0) {
    const cappedShoppers = Math.min(shoppersCount, 5);
    shopper = cappedShoppers * 15000 * nights;
  } else {
    const sh = addons?.shopper || addons?.personalShopper;
    if (sh && !['none', 'false'].includes(String(sh))) {
      const baseRate = typeof sh === 'object' ? Number(sh?.baseRate || sh?.price || sh?.amount || 0) : 15000;
      const count = Number(sh?.count || sh?.shoppers || 1);
      shopper = baseRate > 0 ? baseRate * count * nights : Number(sh?.total || 0);
    }
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
      const { formattedLines, totalMealCost } = parseMealDetails(parsedMeals, nights);
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