import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Member Profiles — Manage Your Full Membership Directory',
  description: 'Keep a complete, searchable member directory with custom fields, role-based access, bulk import/export, and a self-service member portal.',
  openGraph: {
    title: 'UnionTab — Member Profiles — Manage Your Full Membership Directory',
    description: 'Keep a complete, searchable member directory with custom fields, role-based access, bulk import/export, and a self-service member portal.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
