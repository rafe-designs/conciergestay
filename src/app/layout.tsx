import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import SecurityGuard from "@/components/SecurityGuard";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DEFAULT_TITLE = "Luxury Shortlets in Lagos | Sunshine Concierge";
const DEFAULT_DESCRIPTION =
  "Book handpicked luxury shortlet apartments and villas in Lagos with 24/7 concierge, private chef and security. Instant reservation, verified homes.";

export const metadata: Metadata = {
  // All relative URLs below (og-image, canonical) resolve against this.
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: "Sunshine Concierge Residences" }],
  creator: SITE_NAME,
  icons: {
    icon: "/favicon.png",
  },
  // NOTE: no canonical here on purpose. A canonical set in the root layout is inherited by every page.
  // Each page sets its own (see the listing page and the homepage snippet).
  openGraph: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    siteName: SITE_NAME,
    images: [
      {
        url: "/icon.png", // make sure public/icon.png exists (1200x630)
        width: 1200,
        height: 630,
        alt: "Sunshine Concierge luxury shortlet apartments in Lagos",
      },
    ],
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  // Optional: set NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION in Netlify to the token from Google Search Console.
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#020617",
};

// Organization data for Google. Add real values for the TODO fields when you have them.
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  description: DEFAULT_DESCRIPTION,
  areaServed: { "@type": "City", name: "Lagos" },
  // TODO: add "telephone", "email", "logo" (absolute URL) and "sameAs": [Instagram, Facebook, ...]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-rose-500 selection:text-white">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <SecurityGuard>
            {children}
          </SecurityGuard>
        </ThemeProvider>
      </body>
    </html>
  );
}