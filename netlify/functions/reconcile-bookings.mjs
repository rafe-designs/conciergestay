// ====================================================================
// NEW FILE: NETLIFY SCHEDULED FUNCTION (runs every 5 minutes)
// PASTE INTO: netlify/functions/reconcile-bookings.mjs
// CREATE this new file at the project root (next to package.json), NOT inside app/.
// Plain JavaScript on purpose, so your Next.js type-check never touches it.
// It only calls the protected route app/api/cron/reconcile-bookings/route.ts,
// which does the real work. Needs the env var CRON_SECRET (same value as the route uses).
// Scheduled functions only run on your PUBLISHED (production) deploy.
// ====================================================================

export default async () => {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error('[reconcile-bookings] CRON_SECRET is not set');
    return;
  }

  const base = (process.env.SITE_URL || process.env.URL || 'https://app.sunshineconcierge.org').replace(/\/$/, '');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);
  try {
    const res = await fetch(`${base}/api/cron/reconcile-bookings`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}` },
      signal: controller.signal,
    });
    const text = await res.text();
    console.log('[reconcile-bookings]', res.status, text.slice(0, 500));
  } catch (err) {
    console.error('[reconcile-bookings] request failed:', err);
  } finally {
    clearTimeout(timer);
  }
};

// Every 5 minutes (cron is in UTC).
export const config = {
  schedule: '*/5 * * * *',
};
