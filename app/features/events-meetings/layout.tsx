import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Events & Meetings — Organise and Track Attendance',
  description: 'Create events, collect RSVPs, publish agendas and meeting minutes, and track attendance — all in one place.',
  openGraph: {
    title: 'UnionTab — Events & Meetings — Organise and Track Attendance',
    description: 'Create events, collect RSVPs, publish agendas and meeting minutes, and track attendance — all in one place.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
