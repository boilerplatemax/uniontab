'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, Check } from 'lucide-react';
import Link from 'next/link';
import { customerPortalAction, checkoutAction } from '@/lib/payments/actions';
import useSWR from 'swr';
import { UnionDataWithMembers } from '@/lib/db/schema';
import { useState, useEffect } from 'react';
import { StorageUsageBar } from '@/components/storage/storage-usage-bar';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface BillingContentProps {
  slug: string;
  union: {
    id: number;
    name: string;
    localNumber: string | null;
    publicName: string | null;
  };
}

interface Price {
  id: string;
  productId: string;
  unitAmount: number | null;
  currency: string;
  interval: string | undefined;
  trialPeriodDays: number | null | undefined;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  defaultPriceId: string | undefined;
  prices: Price[];
}

export function BillingContent({ slug, union }: BillingContentProps) {
  const { data: unionData } = useSWR<UnionDataWithMembers>('/api/team', fetcher);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const hasActiveSubscription = unionData?.subscriptionStatus === 'active' || unionData?.subscriptionStatus === 'trialing';
  const hasCancelledSubscription = unionData?.subscriptionStatus === 'canceled';
  const shouldShowProducts = !hasActiveSubscription || hasCancelledSubscription;

  useEffect(() => {
    if (shouldShowProducts) {
      async function fetchProducts() {
        try {
          const response = await fetch('/api/products');
          const data = await response.json();
          setProducts(data);
        } catch (error) {
          console.error('Failed to fetch products:', error);
        } finally {
          setLoadingProducts(false);
        }
      }

      fetchProducts();
    }
  }, [shouldShowProducts]);

  const formatPrice = (amount: number | null, currency: string) => {
    if (amount === null) return 'Contact us';
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
    }).format(amount / 100);
    return formatted;
  };

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
                      : unionData?.subscriptionStatus === 'canceled'
                      ? 'Subscription cancelled'
                      : 'No active subscription'}
                  </p>
                </div>
                {hasActiveSubscription && (
                  <form action={customerPortalAction}>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                      Manage Subscription
                    </Button>
                  </form>
                )}
              </div>

              {unionData?.subscriptionStatus && unionData.subscriptionStatus !== 'active' && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    {unionData.subscriptionStatus === 'trialing'
                      ? 'You are currently in your free trial period. Enjoy full access to all features!'
                      : unionData.subscriptionStatus === 'canceled'
                      ? 'Your subscription has been cancelled. You can reactivate by choosing a plan below.'
                      : 'Upgrade your subscription to unlock premium features for your union.'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Storage Usage */}
        <div className="mb-6">
          <StorageUsageBar unionSlug={slug} />
        </div>

        {/* Available Plans - Show if no active subscription or subscription is cancelled */}
        {shouldShowProducts && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                {hasCancelledSubscription ? 'Reactivate Your Subscription' : 'Available Plans'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingProducts ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Loading pricing plans...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No pricing plans available at the moment.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {products.map((product) => {
                    const price = product.prices.find(p => p.id === product.defaultPriceId) || product.prices[0];

                    return (
                      <Card key={product.id} className="border hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <CardTitle className="text-xl">{product.name}</CardTitle>
                          {product.description && (
                            <p className="text-gray-600 text-sm mt-1">{product.description}</p>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <div className="text-3xl font-bold text-gray-900">
                              {price ? formatPrice(price.unitAmount, price.currency) : 'Contact us'}
                            </div>
                            {price?.interval && (
                              <p className="text-gray-600 mt-1">per {price.interval}</p>
                            )}
                            {price?.trialPeriodDays && !hasCancelledSubscription && (
                              <p className="text-sm text-blue-600 mt-2">
                                {price.trialPeriodDays}-day free trial
                              </p>
                            )}
                          </div>

                          <form action={checkoutAction}>
                            <input type="hidden" name="priceId" value={price?.id || ''} />
                            <Button
                              type="submit"
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                              disabled={!price}
                            >
                              {hasCancelledSubscription ? 'Reactivate Plan' : 'Subscribe Now'}
                            </Button>
                          </form>

                          <div className="pt-4 border-t">
                            <ul className="space-y-2">
                              <li className="flex items-start gap-2">
                                <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-gray-600">Custom union website</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-gray-600">Member management</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-gray-600">Members-only content</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-gray-600">Unlimited custom pages</span>
                              </li>
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Billing History Card */}
        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
          </CardHeader>
          <CardContent>
            {hasActiveSubscription ? (
              <>
                <p className="text-sm text-gray-600">
                  View and download your billing history, invoices, and payment receipts through the Stripe Customer Portal.
                </p>
                <form action={customerPortalAction} className="mt-4">
                  <Button type="submit" variant="outline">
                    View Billing History
                  </Button>
                </form>
              </>
            ) : (
              <p className="text-sm text-gray-600">
                No billing history available. Subscribe to a plan to start tracking your billing history.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
