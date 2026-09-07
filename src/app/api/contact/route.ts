import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { name, email, phone, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailAppPassword) {
      console.warn('Gmail credentials missing. Logging message instead:', { name, email, phone, message });
      return NextResponse.json({ success: true, message: 'Form processed (development mode)' });
    }

    // Configure Nodemailer with Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword, // Use an App Password, not your standard Gmail password
      },
    });

    // Send Mail
    await transporter.sendMail({
      from: `"${name} via ConciergeStay" <${gmailUser}>`,
      to: gmailUser, // Directs inquiries directly to your Gmail inbox
      replyTo: email,
      subject: `New Concierge Inquiry from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #0f172a; background-color: #f8fafc;">
          <h2 style="color: #0284c7; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">New Guest Inquiry</h2>
          <p><strong>Guest Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone || 'Not Provided'}</p>
          <p><strong>Message / Request:</strong></p>
          <blockquote style="background: #ffffff; padding: 15px; border-left: 4px solid #0284c7; margin: 0; border-radius: 4px;">
            ${message}
          </blockquote>
        </div>
      `,
    });

    return NextResponse.json({ success: true, message: 'Inquiry transmitted successfully' });
  } catch (error: any) {
    console.error('Gmail SMTP API error:', error);
    return NextResponse.json({ error: 'Failed to send email message' }, { status: 500 });
  }
}