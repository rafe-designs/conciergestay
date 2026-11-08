// ====================================================================
// FILE 10: ROBOTS
// PASTE INTO: app/robots.ts
// CREATE app/robots.ts. DELETE any public/robots.txt (yours contained TypeScript code, which is invalid as a .txt file).
// ====================================================================

import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /checkout and /booking-success are NOT blocked here on purpose: they carry a noindex tag,
      // and Google can only obey noindex if it is allowed to fetch the page.
      disallow: ["/api/", "/admin/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}