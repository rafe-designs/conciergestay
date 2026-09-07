import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ConciergeStay | Book Unique Stays & Luxury Vacation Rentals",
    template: "%s | ConciergeStay Stays",
  },
  description:
    "Find and book unique vacation homes, luxury penthouses, cabins, and beachside villas around the world. Instant guest checkout with full concierge services.",
  keywords: [
    "vacation rentals",
    "luxury apartments",
    "book stays",
    "concierge rentals",
    "penthouses",
    "villas",
    "airbnb",
  ],
  authors: [{ name: "ConciergeStay Luxury Residences" }],
  creator: "ConciergeStay",
  metadataBase: new URL("https://conciergestay.com"),
  openGraph: {
    title: "ConciergeStay | Book Unique Stays Around the World",
    description:
      "Handpicked homes, verified penthouses, and luxury villas with 24/7 concierge support.",
    url: "https://conciergestay.com",
    siteName: "ConciergeStay",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ConciergeStay Luxury Vacation Rentals",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ConciergeStay | Book Unique Stays Around the World",
    description:
      "Handpicked homes, verified penthouses, and luxury villas with 24/7 concierge support.",
    images: ["/og-image.jpg"],
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
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}