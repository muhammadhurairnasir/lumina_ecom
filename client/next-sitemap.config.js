/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://thelumina.shop',
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [
      // Allow all crawlers access to public content
      { userAgent: '*', allow: '/' },
      // Block private/admin areas from all bots
      { userAgent: '*', disallow: '/admin' },
      { userAgent: '*', disallow: '/admin/*' },
      { userAgent: '*', disallow: '/account' },
      { userAgent: '*', disallow: '/account/*' },
      { userAgent: '*', disallow: '/cart' },
      { userAgent: '*', disallow: '/checkout' },
      { userAgent: '*', disallow: '/checkout/*' },
      { userAgent: '*', disallow: '/api/' },
      { userAgent: '*', disallow: '/login' },
      { userAgent: '*', disallow: '/register' },
      // Allow Google Image bot to index product images
      { userAgent: 'Googlebot-Image', allow: '/' },
    ],
  },
  exclude: ['/admin', '/admin/*', '/account', '/account/*', '/cart', '/checkout', '/checkout/*', '/login', '/register'],
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
