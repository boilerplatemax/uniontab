import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'News & Posts — Keep Members Informed and Engaged',
  description: 'Post union news, announcements, and stories with photos and rich text. Members can comment and react, building community engagement.',
  openGraph: {
    title: 'UnionTab — News & Posts — Keep Members Informed and Engaged',
    description: 'Post union news, announcements, and stories with photos and rich text. Members can comment and react, building community engagement.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
