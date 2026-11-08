// ====================================================================
// FILE 15: BOOKING-SUCCESS NOINDEX LAYOUT
// PASTE INTO: app/booking-success/layout.tsx
// CREATE this new file (next to page.tsx). Keeps receipts out of Google.
// ====================================================================

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Booking confirmation",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}