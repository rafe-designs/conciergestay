// ====================================================================
// FILE 8: lib/site (NEW FILE)
// PASTE INTO: lib/site.ts
// CREATE this new file (src/lib/ if your project uses src).
// ====================================================================

// One place for your public address. If you later make the apex (sunshineconcierge.org) the main
// site, change SITE_URL here (or set NEXT_PUBLIC_SITE_URL in Netlify) and everything follows.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://app.sunshineconcierge.org').replace(/\/$/, '');
export const SITE_NAME = 'Sunshine Concierge';
export const LISTING_PATH = '/listings';