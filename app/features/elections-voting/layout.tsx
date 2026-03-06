import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Elections & Voting — Secure Democratic Ballots Online',
  description: 'Run secure, anonymous union elections and votes online. Real-time results, audit trails, and compliance reports built in.',
  openGraph: {
    title: 'UnionTab — Elections & Voting — Secure Democratic Ballots Online',
    description: 'Run secure, anonymous union elections and votes online. Real-time results, audit trails, and compliance reports built in.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
