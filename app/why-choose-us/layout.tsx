import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Why Choose UnionTab? Compare vs Competitors',
  description:
    'See how UnionTab compares to UnionImpact, Winmill, UnionPowered, and Un1on — feature by feature. The most complete union management platform, free for small locals.',
  openGraph: {
    title: 'Why Choose UnionTab? Feature Comparison vs Competitors',
    description:
      'UnionTab vs UnionImpact, Winmill, UnionPowered, Un1on — compare union management platforms side by side.',
  },
};

export default function WhyChooseUsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
