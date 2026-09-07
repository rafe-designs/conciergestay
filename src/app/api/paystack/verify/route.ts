import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const bookings = await (prisma as any).booking.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ bookings }, { status: 200 });
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

    // Base database payload aligned with Prisma schema
    const bookingData: Record<string, any> = {
      reference: bookingRef,
      checkIn: checkIn ? new Date(checkIn) : new Date(),
      checkOut: checkOut ? new Date(checkOut) : new Date(),
      totalNights: Number(totalNights) || 1,
      baseRentTotal: parsedBaseRent,
      servicesTotal: parsedServices,
      grandTotal: parsedGrandTotal,
      apartmentCut: Number(apartmentCut ?? parsedBaseRent),
      platformFee: Number(platformFee ?? 0),
      conciergeCut: Number(conciergeCut ?? parsedServices),
      kitchenCut: parsedKitchenCut,
      status: status || 'Confirmed',
      paymentStatus: paymentStatus || 'Paid',
    };

    // Optional & relation fields
    if (id) bookingData.id = id;
    if (customerName) bookingData.customerName = customerName;
    if (customerEmail) bookingData.customerEmail = customerEmail;
    if (guestCount) bookingData.guestCount = Number(guestCount);
    if (apartmentTitle) bookingData.apartmentTitle = apartmentTitle;
    if (guestInfo) bookingData.guestInfo = typeof guestInfo === 'string' ? guestInfo : JSON.stringify(guestInfo);

    if (listingId) {
      bookingData.listingId = listingId;
    }

    if (userId) {
      bookingData.userId = userId;
    }

    // Handle JSON / Array conversions safely
    const rawMeals = dailyMealSelections || parsedMeals || [];
    bookingData.dailyMealSelections = rawMeals;

    const rawAddons = addons || activeAddons || {};
    bookingData.addons = rawAddons;

    let newBooking;
    try {
      newBooking = await (prisma as any).booking.create({
        data: bookingData,
      });
    } catch (primaryDbError: any) {
      console.warn('[Prisma Insert Notice]: Primary create hit constraint. Retrying with fallback object structure...', primaryDbError?.message);

      // Defensive fallback if relational fields like listingId cause foreign key violations (P2003)
      delete bookingData.listingId;
      delete bookingData.userId;

      newBooking = await (prisma as any).booking.create({
        data: bookingData,
      });
    }

    return NextResponse.json({ success: true, booking: newBooking }, { status: 201 });
  } catch (error: any) {
    console.error('[API POST Booking Detailed Error]:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack,
    });

    return NextResponse.json(
      {
        error: 'Failed to save booking',
        message: error?.message || 'Internal Database Error',
        code: error?.code || 'UNKNOWN_PRISMA_ERROR',
        meta: error?.meta || null,
      },
      { status: 500 }
    );
  }
}