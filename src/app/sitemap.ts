// ====================================================================
// FILE 11: SITEMAP
// PASTE INTO: app/sitemap.ts
// REPLACE the whole file. It now lists every listing page automatically.
// ====================================================================

import { MetadataRoute } from "next";
import { LISTINGS } from "@/lib/cateringData";
import { SITE_URL, LISTING_PATH } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const listingPages: MetadataRoute.Sitemap = Object.keys(LISTINGS).map((id) => ({
    url: `${SITE_URL}${LISTING_PATH}/${id}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    ...listingPages,
  ];
}