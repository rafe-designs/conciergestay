// ====================================================================
// CONTACT FORM API (replaces the Gmail app-password version)
// PASTE INTO: src/app/api/contact/route.ts
// REPLACE the whole existing file.
// Sends through Resend (your verified domain) straight to your info mailbox.
// Env vars (Netlify):
//   RESEND_API_KEY        already set
//   RESEND_FROM_EMAIL     already set (Concierge Stay <bookings@sunshineconcierge.org>)
//   CONTACT_TO_EMAIL      optional, defaults to info@sunshineconcierge.org
// After this works you can delete the old Gmail variables (the Gmail address and app password).
// ====================================================================

import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export const runtime = 'nodejs';

const resend = new Resend(process.env.RESEND_API_KEY);

const escapeHtml = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

// Single-line fields: collapse any line breaks so nothing can inject extra email headers.
const oneLine = (v: unknown, max: number) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

// Best-effort limiter (in-memory, so it resets when the serverless instance restarts).
// It stops casual spam bursts; the hidden "company" field on the form catches most bots.
const hits = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 5;

function tooMany(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_HITS;
}

export async function POST(request: Request) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }

    // Honeypot: real visitors never see or fill this field. Pretend success so bots learn nothing.
    if (body?.company) return NextResponse.json({ ok: true }, { status: 200 });

    const ip =
      request.headers.get('x-nf-client-connection-ip') ||
      (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
      'unknown';
    if (tooMany(ip)) {
      return NextResponse.json({ error: 'Too many messages. Please try again in a few minutes.' }, { status: 429 });
    }

    const name = oneLine(body?.name, 100);
    const email = oneLine(body?.email, 150).toLowerCase();
    const phone = oneLine(body?.phone, 30);
    const message = String(body?.message ?? '').trim().slice(0, 3000);

    if (name.length < 2) return NextResponse.json({ error: 'Please enter your full name.' }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (message.length < 10) {
      return NextResponse.json({ error: 'Please add a little more detail to your message.' }, { status: 400 });
    }

    const to = process.env.CONTACT_TO_EMAIL || 'info@sunshineconcierge.org';

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Concierge Stay <bookings@sunshineconcierge.org>',
      to: [to],
      // Hitting "Reply" in your inbox answers the visitor, not your own bookings address.
      replyTo: email,
      subject: `New website inquiry from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\n\n${message}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;">
          <h2 style="margin:0 0 12px;">New website inquiry</h2>
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Phone:</strong> ${escapeHtml(phone || 'N/A')}</p>
          <p><strong>Message:</strong></p>
          <div style="white-space:pre-wrap;border-left:3px solid #fbbf24;padding-left:12px;">${escapeHtml(message)}</div>
        </div>`,
    });

    // Resend reports failures in the returned `error` (it does not throw), so it must be checked.
    if (error) {
      console.error('[Contact] Resend error:', error);
      return NextResponse.json(
        { error: 'We could not send your message right now. Please try again or reach us on WhatsApp.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error('[Contact] failed:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
