import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'File Sharing — Secure Document Storage for Your Union',
  description: 'Store and share contracts, agreements, and important documents securely. Organised folders, version history, and role-based access.',
  openGraph: {
    title: 'UnionTab — File Sharing — Secure Document Storage for Your Union',
    description: 'Store and share contracts, agreements, and important documents securely. Organised folders, version history, and role-based access.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
