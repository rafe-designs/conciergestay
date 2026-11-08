// ====================================================================
// FILE 3 OF 6: api/payments/initiate/route (DISABLED)
// PASTE INTO: app/api/payments/initiate/route.ts
// REPLACE the whole existing file. The old version signed any amount and had your secret hardcoded.
// ====================================================================

import { NextResponse } from 'next/server';

// Payments now start on the checkout page: it saves a Pending booking via
// /api/bookings/verify and then posts the redirect form to Interswitch.
// This route is intentionally disabled so no one can use it to sign payment requests.
export async function POST() {
  return NextResponse.json(
    { error: 'This endpoint is disabled. Payments start from the checkout page.' },
    { status: 410 }
  );
}