// ====================================================================
// FILE: app/api/webhooks/paystack/route.ts
// ====================================================================

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const rawBody = await req.text(); // Read raw text for exact cryptographic signature verification
    const signature = req.headers.get('x-paystack-signature');
    
    // Fallback order: PAYSTACK_WEBHOOK_SECRET first, then standard PAYSTACK_SECRET_KEY
    const secret = process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY || '';

    if (!secret) {
      console.error('[Paystack Webhook Error]: Missing webhook or secret key in environment variables.');
      return NextResponse.json({ message: 'Server configuration error' }, { status: 500 });
    }

    // 1. Verify Paystack webhook signature security
    const hash = crypto
      .createHmac('sha512', secret)
      .update(rawBody)
      .digest('hex');

    if (!signature || hash !== signature) {
      console.warn('[Paystack Webhook]: Invalid signature received.');
      return NextResponse.json({ message: 'Invalid signature' }, { status: 400 });
    }

    const body = JSON.parse(rawBody);
    const event = body?.event;
    const data = body?.data;

    // 2. Handle successful charge event
    if (event === 'charge.success') {
      const reference = data?.reference;
      const amountPaid = (data?.amount || 0) / 100; // Convert kobo to NGN
      const customerEmail = data?.customer?.email;

      console.log(`[Paystack Webhook]: charge.success received for reference: ${reference}`);

      // Check if booking already exists in Supabase
      const { data: existingBooking } = await supabase
        .from('bookings')
        .select('*')
        .or(`reference.eq.${reference},payment_reference.eq.${reference}`)
        .maybeSingle();

      if (existingBooking) {
        // Update existing booking status to Paid / Confirmed
        const { error: updateError } = await supabase
          .from('bookings')
          .update({
            status: 'Confirmed',
            payment_status: 'Paid',
            payment_reference: String(data?.id || reference),
          })
          .eq('id', existingBooking.id);

        if (updateError) {
          console.error('[Paystack Webhook Update Error]:', updateError.message);
        } else {
          console.log(`[Paystack Webhook]: Existing booking ${existingBooking.id} updated to Paid.`);
        }
      } else {
        // Fallback: If verification route hadn't created it yet, insert a clean record now
        const { error: insertError } = await supabase.from('bookings').insert([
          {
            reference: reference,
            payment_reference: String(data?.id || reference),
            customer_email: customerEmail,
            customer_name: data?.customer?.first_name || 'Valued Guest',
            grand_total: amountPaid,
            status: 'Confirmed',
            payment_status: 'Paid',
            check_in: new Date().toISOString(),
            check_out: new Date(Date.now() + 86400000).toISOString(),
            total_nights: 1,
            base_rent_total: amountPaid,
          },
        ]);

        if (insertError) {
          console.error('[Paystack Webhook Insert Error]:', insertError.message);
        } else {
          console.log(`[Paystack Webhook]: New booking auto-created for reference: ${reference}`);
        }
      }
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error: any) {
    console.error('[Paystack Webhook Error]:', error?.message);
    return NextResponse.json({ message: error?.message || 'Internal Error' }, { status: 500 });
  }
}