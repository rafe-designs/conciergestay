// ====================================================================
// FILE 14: CHECKOUT NOINDEX LAYOUT
// PASTE INTO: app/checkout/layout.tsx
// CREATE this new file (next to the [id] folder). Keeps checkout pages out of Google.
// ====================================================================

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}