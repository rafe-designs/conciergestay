import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@domain.com';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'SuperSecret123!';
    const ADMIN_SECRET_TOKEN = process.env.ADMIN_SECRET_TOKEN || 'secure_admin_jwt_token_key_2026';

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      return NextResponse.json({
        success: true,
        token: ADMIN_SECRET_TOKEN,
      });
    }

    return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
  } catch (err) {
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}