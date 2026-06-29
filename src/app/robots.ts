import type { MetadataRoute } from 'next';

const SITE_URL = 'https://www.snapforgeui.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // The app/API surface isn't useful to crawl.
      disallow: ['/api/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
