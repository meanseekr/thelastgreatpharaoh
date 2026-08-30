import type { MetadataRoute } from "next";

const SITE_URL = "https://www.thelastgreatpharaoh.com";

// Only the pages meant to be discovered via search are listed here.
// /join/success and /join/confirmed are transactional pages reached only
// after a form submission or a confirmation-email click — they aren't
// useful search landing pages, so they're intentionally left out.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/join`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/privacy-policy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
