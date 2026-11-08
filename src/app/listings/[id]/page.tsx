// ====================================================================
// FILE 12: LISTING PAGE (server component, gives each listing its own SEO)
// PASTE INTO: app/listings/[id]/page.tsx
// REPLACE the whole file. It no longer has 'use client'; the interactive part is file 13.
// ====================================================================

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LISTINGS } from '@/lib/cateringData';
import { SITE_URL, SITE_NAME, LISTING_PATH } from '@/lib/site';
import ListingClient from './listingclient';

type Props = { params: Promise<{ id: string }> };

// Pre-build every listing page at deploy time: fastest for guests and for Google.
export function generateStaticParams() {
  return Object.keys(LISTINGS).map((id) => ({ id }));
}

const absolute = (url?: string) => {
  if (!url) return undefined;
  return /^https?:\/\//i.test(url) ? url : `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

const trimTo = (text: string, max: number) => {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : clean.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const listing = LISTINGS[id];
  if (!listing) return { title: 'Residence not found', robots: { index: false, follow: false } };

  const title = `${listing.title}, ${listing.location}`;
  const description = trimTo(
    `${listing.title} in ${listing.location}. ${listing.description} From ₦${listing.pricePerNight.toLocaleString()} per night with 24/7 concierge.`,
    158
  );
  const url = `${SITE_URL}${LISTING_PATH}/${id}`;
  const image = absolute(listing.heroImage);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'en_NG',
      images: image ? [{ url: image, alt: `${listing.title} in ${listing.location}` }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${SITE_NAME}`,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ListingPage({ params }: Props) {
  const { id } = await params;
  const listing = LISTINGS[id];

  // A real 404 (not a "soft 404" page that returns 200): this is what Google expects.
  if (!listing) notFound();

  const images = Array.from(new Set([listing.heroImage, ...(listing.gallery || [])].filter(Boolean)))
    .map((u) => absolute(u as string));

  // Structured data. Deliberately NO rating/review fields: only add those when you have real, verifiable reviews.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: listing.title,
    description: listing.description,
    url: `${SITE_URL}${LISTING_PATH}/${id}`,
    image: images,
    priceRange: `₦${listing.pricePerNight.toLocaleString()} per night`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: listing.address || undefined,
      addressLocality: listing.location,
      addressCountry: 'NG',
    },
    amenityFeature: (listing.features || []).map((f: string) => ({
      '@type': 'LocationFeatureSpecification',
      name: f,
      value: true,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <ListingClient listing={listing} />
    </>
  );
}