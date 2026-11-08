// ====================================================================
// FILE 2 OF 6: api/bookings/verify/route  (UPDATED: protected ₦100 test switch)
// PASTE INTO: app/api/bookings/verify/route.ts
// REPLACE the whole existing file. Needs file 5 (lib/bookingPayments.ts) to exist.
// ====================================================================

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { LISTINGS } from '@/lib/cateringData';
import { supabase, confirmBookingByReference } from '@/lib/bookingPayments';

// Save as: app/api/bookings/verify/route.ts

function sanitizeAddons(rawAddons: any): Record<string, any> {
  if (!rawAddons || typeof rawAddons !== 'object') return {};

  const sanitized: Record<string, any> = {};

  const sec = rawAddons.security || rawAddons.securityType || rawAddons.securityService;
  if (sec && !['None', 'No Additional Security', 'false'].includes(String(sec))) {
    sanitized.security = String(sec).slice(0, 100);
    if (rawAddons.securityCount || rawAddons.guards) {
      sanitized.securityCount = Math.min(5, Math.max(1, Number(rawAddons.securityCount || rawAddons.guards || 1)));
    }
  }

  const airport = rawAddons.airport || rawAddons.airportTransfer;
  if (airport && !['None', 'No Airport Transfer', 'false'].includes(String(airport))) {
    sanitized.airport = String(airport).slice(0, 100);
    const explicitDirection = rawAddons.airportDirection || rawAddons.direction || rawAddons.tripType;
    if (explicitDirection) {
      sanitized.airportDirection = String(explicitDirection).slice(0, 50);
    } else {
      const stringVal = String(airport).toLowerCase();
      if (stringVal.includes('round trip') || stringVal.includes('round_trip')) {
        sanitized.airportDirection = 'round_trip';
      } else if (stringVal.includes('one way') || stringVal.includes('one_way')) {
        sanitized.airportDirection = 'one_way';
      }
    }
  }

  const hk = rawAddons.housekeeping || rawAddons.housekeepingService || rawAddons.housekeepingActive;
  if (hk && !['None', 'No Housekeeping Service', 'no', 'false'].includes(String(hk))) {
    sanitized.housekeeping = String(hk).slice(0, 50);
    if (rawAddons.housekeepingSchedule || rawAddons.frequency) {
      sanitized.housekeepingSchedule = String(rawAddons.housekeepingSchedule || rawAddons.frequency).slice(0, 50);
    }
  }

  const chauffeur = rawAddons.chauffeur || rawAddons.chauffeurService;
  if (chauffeur && !['None', 'No Chauffeur Service', 'false'].includes(String(chauffeur))) {
    sanitized.chauffeur = String(chauffeur).slice(0, 100);
  }

  const laundryObj = rawAddons.laundry && typeof rawAddons.laundry === 'object' ? rawAddons.laundry : {
    adult: Number(rawAddons.laundryAdult) || 0,
    kid: Number(rawAddons.laundryKid) || 0,
    suit: Number(rawAddons.laundrySuit) || 0,
  };
  const totalPcs = (Number(laundryObj.adult) || 0) + (Number(laundryObj.kid) || 0) + (Number(laundryObj.suit) || 0);
  if (totalPcs > 0) {
    sanitized.laundry = {
      adult: Math.min(100, Math.max(0, Number(laundryObj.adult) || 0)),
      kid: Math.min(100, Math.max(0, Number(laundryObj.kid) || 0)),
      suit: Math.min(100, Math.max(0, Number(laundryObj.suit) || 0)),
    };
  }

  let beddingsObj = rawAddons.beddings || rawAddons.linen;
  if (!beddingsObj || typeof beddingsObj !== 'object') {
    beddingsObj = {
      towels: rawAddons.beddingTowels || 'no',
      beddings: rawAddons.beddingBeddings || 'no',
      selection: rawAddons.beddingSelection || 'Standard'
    };
  }

  sanitized.beddings = {
    towels: String(beddingsObj.towels || 'no').slice(0, 20),
    beddings: String(beddingsObj.beddings || 'no').slice(0, 20),
    selection: String(beddingsObj.selection || 'Standard').slice(0, 50),
  };

  const shopper = rawAddons.shopper || rawAddons.personalShopper;
  if (shopper && !['None', 'false'].includes(String(shopper))) {
    sanitized.shopper = String(shopper).slice(0, 100);
  }

  return sanitized;
}

/**
 * Two actions on one route:
 *  - { action: 'initiate', transactionRef, bookingData } -> store a PENDING booking BEFORE the guest goes to Interswitch
 *  - { transactionRef }                                  -> verify with Interswitch, mark that stored booking PAID
 */
export async function POST(request: Request) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const txRef = String(body?.transactionRef || body?.reference || '').trim();
    if (!/^[A-Za-z0-9_-]{6,64}$/.test(txRef)) {
      return NextResponse.json({ error: 'Invalid transaction reference' }, { status: 400 });
    }

    if (body?.action === 'initiate') return await handleInitiate(txRef, body?.bookingData, body?.testCode);

    const result = await confirmBookingByReference(txRef);
    switch (result.status) {
      case 'paid':
        return NextResponse.json({ success: true, booking: result.booking }, { status: 200 });
      case 'not_found':
        return NextResponse.json({ error: 'No booking found for this reference', pending: true }, { status: 404 });
      case 'not_paid':
        return NextResponse.json(
          { error: 'Payment not verified', code: result.code, description: result.description },
          { status: 402 }
        );
      case 'provider_error':
        return NextResponse.json({ error: 'Could not reach payment provider', pending: true }, { status: 502 });
      default:
        return NextResponse.json({ error: 'Database error', pending: true }, { status: 500 });
    }
  } catch (error) {
    console.error('[Bookings route error]:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

function safeEqual(a: string, b: string) {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

const TEST_TOTAL_NGN = 100;

async function handleInitiate(txRef: string, raw: any, testCode?: string) {
  if (!raw || typeof raw !== 'object') {
    return NextResponse.json({ error: 'Missing booking data' }, { status: 400 });
  }

  const { listingId, apartmentTitle, checkIn, checkOut, totalNights, guestInfo,
    baseRentTotal, servicesTotal, diningTotal, conciergeTotal, grandTotal, dailyMealSelections, addons } = raw;

  const listing = (LISTINGS as Record<string, any>)[String(listingId)];
  if (!listing) return NextResponse.json({ error: 'Unknown listing' }, { status: 400 });

  // Protected test mode: needs the secret TEST_MODE_CODE env var AND a matching code from the URL.
  // With no TEST_MODE_CODE set on the server, test mode is impossible.
  let isTest = false;
  if (testCode) {
    const secret = process.env.TEST_MODE_CODE || '';
    if (!secret || !safeEqual(String(testCode), secret)) {
      return NextResponse.json({ error: 'Invalid test code' }, { status: 403 });
    }
    isTest = true;
  }

  const nights = Math.max(1, Number(totalNights) || 1);
  const total = isTest ? TEST_TOTAL_NGN : Number(grandTotal);
  const minimumDue = listing.pricePerNight * nights;
  if (!isTest && (!Number.isFinite(total) || total < minimumDue)) {
    console.warn('[Initiate] grandTotal below accommodation minimum', { txRef, total, minimumDue });
    return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
  }

  const email = String(guestInfo?.email || '').toLowerCase().trim().slice(0, 150);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email address format' }, { status: 400 });
  }

  const { data: existing } = await supabase.from('Booking').select('id, paymentStatus').eq('reference', txRef).maybeSingle();
  if (existing) return NextResponse.json({ success: true, alreadyExists: true }, { status: 200 });

  const nowIso = new Date().toISOString();
  const baseRent = isTest ? TEST_TOTAL_NGN : Number(baseRentTotal || 0);
  const services = isTest ? 0 : Number(servicesTotal ?? (Number(diningTotal || 0) + Number(conciergeTotal || 0)));

  const record: Record<string, any> = {
    id: crypto.randomUUID(),
    createdAt: nowIso,
    updatedAt: nowIso,
    reference: txRef,
    paymentReference: txRef,
    checkIn: checkIn ? new Date(checkIn).toISOString() : nowIso,
    checkOut: checkOut ? new Date(checkOut).toISOString() : nowIso,
    totalNights: nights,
    guestCount: Math.min(50, Math.max(1, Number(guestInfo?.guests ?? 1))),
    pricePerNight: listing.pricePerNight,
    baseRentTotal: baseRent,
    servicesTotal: services,
    grandTotal: total,
    apartmentCut: baseRent,
    servicesCut: services,
    platformFee: 0,
    platformFeeTotal: 0,
    status: 'Pending',
    paymentStatus: 'Pending',
    customerName: String(guestInfo?.fullName || '').slice(0, 150),
    customerEmail: email,
    phone: String(guestInfo?.phone || '').slice(0, 50),
    apartmentTitle: ((isTest ? '[TEST] ' : '') + String(apartmentTitle || listing.title || '')).slice(0, 200),
    listingId: String(listingId).slice(0, 100),
    dailyMealSelections: dailyMealSelections || [],
    addons: sanitizeAddons(addons || {}),
  };

  const { error } = await supabase.from('Booking').insert([record]);
  if (error) {
    console.error('[Initiate insert error]:', error.message);
    return NextResponse.json({ error: 'Could not start booking', message: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true }, { status: 201 });
}