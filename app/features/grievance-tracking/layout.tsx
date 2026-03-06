import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Grievance Tracking — From Filing to Resolution',
  description: 'File, track, and resolve grievances with a step-by-step workflow, document attachments, status notifications, and full audit history.',
  openGraph: {
    title: 'UnionTab — Grievance Tracking — From Filing to Resolution',
    description: 'File, track, and resolve grievances with a step-by-step workflow, document attachments, status notifications, and full audit history.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
