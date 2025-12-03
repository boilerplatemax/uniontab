'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { customerPortalAction } from '@/lib/payments/actions';
import useSWR from 'swr';
import { UnionDataWithMembers } from '@/lib/db/schema';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface BillingContentProps {
  slug: string;
  union: {
    id: number;
    name: string;
    publicName: string | null;
    localNumber: string | null;
  };
}

export function BillingContent({ slug, union }: BillingContentProps) {
  const { data: unionData } = useSWR<UnionDataWithMembers>('/api/team', fetcher);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link
            href={`/${slug}`}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {union.publicName || `${union.name}${union.localNumber ? ` ${union.localNumber}` : ''}`}
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="text-gray-600 mt-1">
            Manage your subscription and billing details
          </p>
        </div>

        {/* Subscription Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="font-medium text-lg">
                    {unionData?.planName || 'Free'} Plan
                  </p>
                  <p className="text-sm text-gray-600">
                    {unionData?.subscriptionStatus === 'active'
                      ? 'Billed monthly'
                      : unionData?.subscriptionStatus === 'trialing'
                      ? 'Trial period - No charges yet'
                      : 'No active subscription'}
                  </p>
                </div>
                <form action={customerPortalAction}>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    Manage Subscription
                  </Button>
                </form>
              </div>

              {unionData?.subscriptionStatus && unionData.subscriptionStatus !== 'active' && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    {unionData.subscriptionStatus === 'trialing'
                      ? 'You are currently in your free trial period. Enjoy full access to all features!'
                      : 'Upgrade your subscription to unlock premium features for your union.'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Billing History Card */}
        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              View and download your billing history through the Stripe Customer Portal.
            </p>
            <form action={customerPortalAction} className="mt-4">
              <Button type="submit" variant="outline">
                View Billing History
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
