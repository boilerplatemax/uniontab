import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mass Email & Text — Reach Every Member Instantly',
  description: 'Send targeted mass emails and SMS messages to your entire membership or custom segments. Scheduled sending, delivery tracking, and rich templates.',
  openGraph: {
    title: 'UnionTab — Mass Email & Text — Reach Every Member Instantly',
    description: 'Send targeted mass emails and SMS messages to your entire membership or custom segments. Scheduled sending, delivery tracking, and rich templates.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
