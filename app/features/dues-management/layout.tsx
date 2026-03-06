import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dues Management — Track Payments and Send Reminders',
  description: 'Know exactly who has paid and who has not. Automated reminders, financial reports, and international reporting integration.',
  openGraph: {
    title: 'UnionTab — Dues Management — Track Payments and Send Reminders',
    description: 'Know exactly who has paid and who has not. Automated reminders, financial reports, and international reporting integration.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
