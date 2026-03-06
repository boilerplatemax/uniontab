import './globals.css';
import type { Metadata, Viewport } from 'next';
// import { Manrope } from 'next/font/google';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { SWRConfig } from 'swr';
import { LanguageProvider } from '@/lib/i18n';
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  metadataBase: new URL('https://uniontab.com'),
  title: {
    default: 'UnionTab — Union Management Software for Labour Locals',
    template: '%s | UnionTab',
  },
  description:
    'UnionTab is the all-in-one union management platform for labour locals. Run secure elections, track grievances, manage dues, send mass communications, and more — free for small locals.',
  keywords: [
    'union management software',
    'labour union website',
    'union member portal',
    'union dues tracking',
    'union elections software',
    'grievance tracking',
    'union communications',
    'UnionTab',
  ],
  authors: [{ name: 'UnionTab' }],
  creator: 'UnionTab',
  openGraph: {
    type: 'website',
    locale: 'en_CA',
    url: 'https://uniontab.com',
    siteName: 'UnionTab',
    title: 'UnionTab — Union Management Software for Labour Locals',
    description:
      'The all-in-one platform built for union locals. Secure elections, grievance tracking, dues management, mass communications, and more.',
    images: [{ url: '/assets/landing/hero-workers.jpg', width: 1200, height: 630, alt: 'UnionTab' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UnionTab — Union Management Software',
    description: 'Run your union smarter. Free for small locals.',
    images: ['/assets/landing/hero-workers.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
};

export const viewport: Viewport = {
  maximumScale: 1,
};

// const manrope = Manrope({ subsets: ['latin'] });

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className="bg-white dark:bg-gray-950 text-black dark:text-white font-sans"
    >
      <body className="min-h-[100dvh] bg-gray-50">
        <LanguageProvider>
          <SWRConfig
            value={{
              fallback: {
                // We do NOT await here
                // Only components that read this data will suspend
                '/api/user': getUser(),
                '/api/team': getTeamForUser()
              }
            }}
          >
            {children}
          </SWRConfig>
        </LanguageProvider>
        <Analytics />
      </body>
    </html>
  );
}
