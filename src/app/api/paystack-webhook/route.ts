import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const signature = req.headers.get('x-paystack-signature');
    const secret = process.env.PAYSTACK_SECRET_KEY; // Secret Key (NOT public key)

    // Verify webhook signature for security
    const hash = crypto
      .createHmac('sha512', secret || '')
      .update(JSON.stringify(body))
      .digest('hex');

    if (hash !== signature) {
      return NextResponse.json({ message: 'Invalid signature' }, { status: 400 });
    }

    const event = body;

    // Listen for charge success event
    if (event.event === 'charge.success') {
      const data = event.data;
      const reference = data.reference;
      const guestEmail = data.customer.email;
      const metadata = data.metadata;

      // TODO: Save to your Database (Prisma, MongoDB, Supabase, etc.)
      console.log('Payment Verified via Webhook:', {
        reference,
        guestEmail,
        amount: data.amount / 100, // Convert Kobo back to NGN
        metadata,
      });
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}