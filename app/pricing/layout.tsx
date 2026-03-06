import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing — Free for Small Locals',
  description:
    'UnionTab is free for small union locals. Transparent, affordable pricing that scales with your membership. No long-term contracts.',
  openGraph: {
    title: 'UnionTab Pricing — Free for Small Locals, Scales with You',
    description: 'Straightforward pricing with no hidden fees. Start free and upgrade only when you need to.',
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
