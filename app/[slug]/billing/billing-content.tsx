'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, Check, Download, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { customerPortalAction, checkoutAction, changePlanAction } from '@/lib/payments/actions';
import useSWR from 'swr';
import { UnionDataWithMembers } from '@/lib/db/schema';
import { useState, useEffect } from 'react';

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

interface Invoice {
  id: string;
  number: string | null;
  created: number;
  amount: number;
  currency: string;
  status: string | null;
  invoicePdf: string | null;
  hostedInvoiceUrl: string | null;
}

export function BillingContent({ slug, union }: BillingContentProps) {
  const { data: unionData } = useSWR<UnionDataWithMembers>('/api/team', fetcher);
  const { data: invoiceData } = useSWR<{ invoices: Invoice[] }>('/api/stripe/invoices', fetcher);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [showChangePlan, setShowChangePlan] = useState(false);

  const hasActiveSubscription = unionData?.subscriptionStatus === 'active' || unionData?.subscriptionStatus === 'trialing';
  const hasCancelledSubscription = unionData?.subscriptionStatus === 'canceled';
  const shouldShowProducts = !hasActiveSubscription || hasCancelledSubscription;

  useEffect(() => {
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
  }, []);

  const formatPrice = (amount: number | null, currency: string) => {
    if (amount === null) return 'Contact us';
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
    }).format(amount / 100);
    return formatted;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'paid':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Paid</span>;
      case 'open':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Open</span>;
      case 'draft':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">Draft</span>;
      case 'void':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">Void</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">{status || 'Unknown'}</span>;
    }
  };

  // Filter products to show plans different from current plan for upgrades
  const availablePlansForUpgrade = products.filter(
    (product) => product.name !== unionData?.planName
  );

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
                  <div className="flex flex-col sm:flex-row gap-2">
                    {availablePlansForUpgrade.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowChangePlan(!showChangePlan)}
                        className="flex items-center gap-1"
                      >
                        Change Plan
                        {showChangePlan ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    )}
                    <form action={customerPortalAction}>
                      <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                        Manage Payment Method
                      </Button>
                    </form>
                  </div>
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

              {/* Change Plan Section - Expandable for active subscribers */}
              {hasActiveSubscription && showChangePlan && availablePlansForUpgrade.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h3 className="font-medium text-gray-900 mb-3">Switch to a different plan</h3>
                  <div className="grid gap-3">
                    {availablePlansForUpgrade.map((product) => {
                      const price = product.prices.find(p => p.id === product.defaultPriceId) || product.prices[0];
                      return (
                        <div
                          key={product.id}
                          className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg hover:bg-gray-50"
                        >
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-gray-600">
                              {price ? formatPrice(price.unitAmount, price.currency) : 'Contact us'}
                              {price?.interval && ` / ${price.interval}`}
                            </p>
                            {product.description && (
                              <p className="text-xs text-gray-500 mt-1">{product.description}</p>
                            )}
                          </div>
                          <form action={changePlanAction} className="mt-2 sm:mt-0">
                            <input type="hidden" name="priceId" value={price?.id || ''} />
                            <Button
                              type="submit"
                              variant="outline"
                              size="sm"
                              disabled={!price}
                            >
                              Switch to {product.name}
                            </Button>
                          </form>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    Plan changes take effect immediately. You&apos;ll be charged or credited the prorated difference.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

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
            {invoiceData?.invoices && invoiceData.invoices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium text-gray-600">Invoice</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-600">Date</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-600">Amount</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-600">Status</th>
                      <th className="text-right py-3 px-2 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceData.invoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b last:border-0">
                        <td className="py-3 px-2 text-gray-900">
                          {invoice.number || invoice.id.slice(0, 8)}
                        </td>
                        <td className="py-3 px-2 text-gray-600">
                          {formatDate(invoice.created)}
                        </td>
                        <td className="py-3 px-2 text-gray-900">
                          {formatPrice(invoice.amount, invoice.currency)}
                        </td>
                        <td className="py-3 px-2">
                          {getStatusBadge(invoice.status)}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="flex justify-end gap-2">
                            {invoice.invoicePdf && (
                              <a
                                href={invoice.invoicePdf}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-blue-600 hover:text-blue-800"
                                title="Download PDF"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                            )}
                            {invoice.hostedInvoiceUrl && (
                              <a
                                href={invoice.hostedInvoiceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-blue-600 hover:text-blue-800"
                                title="View invoice"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : hasActiveSubscription || hasCancelledSubscription ? (
              <p className="text-sm text-gray-600">
                No invoices yet. Your first invoice will appear here after your trial ends or first payment.
              </p>
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
