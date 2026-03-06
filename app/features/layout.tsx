import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Features — Union Management Tools',
  description:
    'Explore every tool UnionTab offers: member profiles, secure elections, grievance tracking, mass email & text, dues management, events, file sharing, and more.',
  openGraph: {
    title: 'UnionTab Features — Everything Your Local Needs',
    description:
      'One platform for member management, secure elections, grievance tracking, mass communications, dues, events, and documents.',
  },
};

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
