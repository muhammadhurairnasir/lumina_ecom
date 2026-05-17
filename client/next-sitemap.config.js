/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/' },
      { userAgent: '*', disallow: '/admin' },
      { userAgent: '*', disallow: '/api/' },
    ],
  },
  exclude: ['/admin', '/admin/*', '/account', '/account/*'],
  additionalPaths: async (_config) => {
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const res = await fetch(`${apiUrl}/sitemap`);
      if (!res.ok) return [];
      const { products = [], categories = [] } = await res.json();
      return [
        ...products.map((slug) => ({
          loc: `/products/${slug}`,
          priority: 0.7,
          changefreq: 'daily',
        })),
        ...categories.map((slug) => ({
          loc: `/products?category=${slug}`,
          priority: 0.8,
          changefreq: 'weekly',
        })),
      ];
    } catch {
      return [];
    }
  },
};
