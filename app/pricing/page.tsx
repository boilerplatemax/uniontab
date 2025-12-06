'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Check } from 'lucide-react';
import { checkoutAction } from '@/lib/payments/actions';

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

export default function PricingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch('/api/products');
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Navbar - Same as info page */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
              <Users className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                UnionTab
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/sign-in">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/sign-up">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Create my website
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the perfect plan for your union. All plans include a 14-day free trial.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading pricing plans...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No pricing plans available at the moment.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto justify-center">
            {products.sort((a, b) => {
              // Sort to show Base first, then Plus
              const order = { 'Base': 1, 'Plus': 2 };
              const aOrder = order[a.name as keyof typeof order] || 999;
              const bOrder = order[b.name as keyof typeof order] || 999;
              return aOrder - bOrder;
            }).map((product) => {
              const price = product.prices.find(p => p.id === product.defaultPriceId) || product.prices[0];

              return (
                <Card key={product.id} className="border-2 hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-2xl">{product.name}</CardTitle>
                    {product.description && (
                      <p className="text-gray-600 text-sm mt-2">{product.description}</p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <div className="text-4xl font-bold text-gray-900">
                        {price ? formatPrice(price.unitAmount, price.currency) : 'Contact us'}
                      </div>
                      {price?.interval && (
                        <p className="text-gray-600 mt-1">per {price.interval}</p>
                      )}
                      {price?.trialPeriodDays && (
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
                        Get Started
                      </Button>
                    </form>

                    <div className="pt-4 border-t">
                      <p className="text-sm font-semibold text-gray-900 mb-3">Features:</p>
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

        {/* FAQ or additional info section */}
        <div className="mt-16 max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Questions about pricing?
          </h2>
          <p className="text-gray-600 mb-6">
            We're here to help. Contact our team to learn more about our plans and find the perfect fit for your union.
          </p>
          <Link href="/contact">
            <Button variant="outline" size="lg">
              Contact Us
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
