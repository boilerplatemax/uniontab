import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/member-login', '/sign-up', '/sign-in'],
      },
    ],
    sitemap: 'https://uniontab.com/sitemap.xml',
  };
}
