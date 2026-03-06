import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About UnionTab — Built by Union People',
  description:
    'Learn about UnionTab — the union management platform built by labour people, for labour people. Our mission, story, and values.',
  openGraph: {
    title: 'About UnionTab — Built by Union People, for Union People',
    description: 'Our mission is to give every union local the digital tools they deserve — regardless of size or budget.',
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
