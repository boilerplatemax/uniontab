'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Check, Sparkles, Zap, Crown, Mail, MessageSquare, Vote, Database, ArrowRight } from 'lucide-react';
import { motion, useInView } from 'framer-motion';

// Animation component for scroll-triggered animations
function AnimatedCard({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

interface PricingPlan {
  name: string;
  price: string;
  interval: string;
  description: string;
  icon: React.ReactNode;
  popular?: boolean;
  features: {
    name: string;
    included: boolean;
    limit?: string;
  }[];
  cta: string;
  ctaLink: string;
  gradient: string;
  borderColor: string;
}

const pricingPlans: PricingPlan[] = [
  {
    name: "Free",
    price: "$0",
    interval: "forever",
    description: "Perfect for small unions getting started",
    icon: <Sparkles className="h-6 w-6" />,
    gradient: "from-gray-500 to-gray-600",
    borderColor: "border-gray-200 hover:border-gray-300",
    features: [
      { name: "Members", included: true, limit: "Up to 50 members" },
      { name: "Email Messages", included: true, limit: "100/month" },
      { name: "SMS Messages", included: true, limit: "50/month" },
      { name: "Elections", included: true, limit: "2/year" },
      { name: "Storage", included: true, limit: "1 GB" },
      { name: "Custom Pages", included: true, limit: "5 pages" },
      { name: "Member Portal", included: true },
      { name: "Basic Analytics", included: true },
      { name: "Email Support", included: true },
      { name: "Custom Domain", included: false },
      { name: "Priority Support", included: false },
      { name: "Advanced Analytics", included: false },
    ],
    cta: "Get Started Free",
    ctaLink: "/sign-up",
  },
  {
    name: "Base",
    price: "$49",
    interval: "month",
    description: "For growing unions with more members",
    icon: <Zap className="h-6 w-6" />,
    popular: true,
    gradient: "from-blue-500 to-indigo-600",
    borderColor: "border-blue-200 hover:border-blue-400",
    features: [
      { name: "Members", included: true, limit: "Up to 500 members" },
      { name: "Email Messages", included: true, limit: "2,500/month" },
      { name: "SMS Messages", included: true, limit: "500/month" },
      { name: "Elections", included: true, limit: "Unlimited" },
      { name: "Storage", included: true, limit: "10 GB" },
      { name: "Custom Pages", included: true, limit: "Unlimited" },
      { name: "Member Portal", included: true },
      { name: "Advanced Analytics", included: true },
      { name: "Custom Domain", included: true },
      { name: "Email & Chat Support", included: true },
      { name: "Event Management", included: true },
      { name: "Document Versioning", included: true },
    ],
    cta: "Start 14-Day Trial",
    ctaLink: "/sign-up?plan=base",
  },
  {
    name: "Plus",
    price: "$149",
    interval: "month",
    description: "For large unions with advanced needs",
    icon: <Crown className="h-6 w-6" />,
    gradient: "from-purple-500 to-pink-600",
    borderColor: "border-purple-200 hover:border-purple-400",
    features: [
      { name: "Members", included: true, limit: "Unlimited" },
      { name: "Email Messages", included: true, limit: "10,000/month" },
      { name: "SMS Messages", included: true, limit: "2,500/month" },
      { name: "Elections", included: true, limit: "Unlimited" },
      { name: "Storage", included: true, limit: "30 GB" },
      { name: "Custom Pages", included: true, limit: "Unlimited" },
      { name: "Member Portal", included: true },
      { name: "Advanced Analytics", included: true },
      { name: "Custom Domain", included: true },
      { name: "Priority 24/7 Support", included: true },
      { name: "Event Management", included: true },
      { name: "Document Versioning", included: true },
      { name: "White-label Branding", included: true },
      { name: "API Access", included: true },
      { name: "Dedicated Account Manager", included: true },
    ],
    cta: "Start 14-Day Trial",
    ctaLink: "/sign-up?plan=plus",
  },
];

export default function PricingPage() {
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Enhanced Navbar */}
      <nav className="border-b bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/info" className="flex items-center hover:opacity-80 transition-opacity group">
              <div className="relative">
                <Users className="h-8 w-8 text-blue-600 group-hover:scale-110 transition-transform" />
                <div className="absolute -inset-1 bg-blue-600/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="ml-2 text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                UnionTab
              </span>
            </Link>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/blogs">
                <Button variant="ghost" className="text-gray-700 hover:text-blue-600">
                  Blog
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="ghost" className="text-gray-700 hover:text-blue-600">
                  Pricing
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button variant="ghost" className="text-gray-700 hover:text-blue-600">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-6"
        >
          <div className="inline-block">
            <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Transparent Pricing, No Hidden Fees
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900">
            Choose Your
            <span className="block mt-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Perfect Plan
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Start free and upgrade as you grow. All paid plans include a 14-day free trial with no credit card required.
          </p>
        </motion.div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <AnimatedCard key={plan.name} delay={index * 0.1}>
              <Card className={`border-2 ${plan.borderColor} ${plan.popular ? 'ring-2 ring-blue-500 shadow-2xl scale-105' : 'shadow-lg'} transition-all duration-300 hover:shadow-2xl h-full flex flex-col relative overflow-hidden`}>
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1 text-xs font-semibold rounded-bl-lg">
                    MOST POPULAR
                  </div>
                )}

                <CardHeader className="pb-8 pt-8">
                  <div className={`w-12 h-12 bg-gradient-to-br ${plan.gradient} rounded-xl flex items-center justify-center text-white mb-4 shadow-lg`}>
                    {plan.icon}
                  </div>
                  <CardTitle className="text-3xl font-bold text-gray-900">{plan.name}</CardTitle>
                  <p className="text-gray-600 text-sm mt-2">{plan.description}</p>

                  <div className="mt-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-gray-600">/{plan.interval}</span>
                    </div>
                    {plan.name !== "Free" && (
                      <p className="text-sm text-blue-600 mt-2 font-medium">
                        14-day free trial included
                      </p>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  <Link href={plan.ctaLink} className="block mb-6">
                    <Button
                      className={`w-full h-12 text-base font-semibold ${
                        plan.popular
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg'
                          : 'bg-gray-900 hover:bg-gray-800 text-white'
                      }`}
                    >
                      {plan.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>

                  <div className="pt-6 border-t space-y-4 flex-1">
                    <p className="text-sm font-semibold text-gray-900 mb-4">Everything included:</p>
                    <ul className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          {feature.included ? (
                            <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          ) : (
                            <div className="h-5 w-5 flex-shrink-0 mt-0.5">
                              <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />
                            </div>
                          )}
                          <div className="flex-1">
                            <span className={`text-sm ${feature.included ? 'text-gray-900' : 'text-gray-400'}`}>
                              {feature.name}
                            </span>
                            {feature.limit && (
                              <span className={`block text-xs mt-0.5 ${feature.included ? 'text-gray-600' : 'text-gray-400'}`}>
                                {feature.limit}
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </AnimatedCard>
          ))}
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <AnimatedCard>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Compare Features
            </h2>
            <p className="text-xl text-gray-600">
              See what's included in each plan
            </p>
          </div>
        </AnimatedCard>

        <AnimatedCard delay={0.2}>
          <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
            <div className="grid grid-cols-4 gap-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2">
              <div className="font-semibold text-gray-900">Feature</div>
              <div className="text-center font-semibold text-gray-900">Free</div>
              <div className="text-center font-semibold text-blue-600">Base</div>
              <div className="text-center font-semibold text-purple-600">Plus</div>
            </div>

            {[
              { feature: "Members", free: "50", base: "500", plus: "Unlimited" },
              { feature: "Email/month", free: "100", base: "2,500", plus: "10,000" },
              { feature: "SMS/month", free: "50", base: "500", plus: "2,500" },
              { feature: "Elections", free: "2/year", base: "Unlimited", plus: "Unlimited" },
              { feature: "Storage", free: "1 GB", base: "10 GB", plus: "30 GB" },
              { feature: "Custom Pages", free: "5", base: "Unlimited", plus: "Unlimited" },
            ].map((row, i) => (
              <div key={i} className={`grid grid-cols-4 gap-4 p-6 ${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                <div className="font-medium text-gray-900">{row.feature}</div>
                <div className="text-center text-gray-700">{row.free}</div>
                <div className="text-center text-gray-700 font-medium">{row.base}</div>
                <div className="text-center text-gray-700 font-medium">{row.plus}</div>
              </div>
            ))}
          </div>
        </AnimatedCard>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <AnimatedCard>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>
        </AnimatedCard>

        <div className="space-y-6">
          <AnimatedCard delay={0.1}>
            <Card className="border-2 border-gray-100 hover:border-blue-200 transition-colors">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Can I upgrade or downgrade at any time?
                </h3>
                <p className="text-gray-600">
                  Yes! You can change your plan at any time. Upgrades take effect immediately, and downgrades will take effect at the end of your current billing period.
                </p>
              </CardContent>
            </Card>
          </AnimatedCard>

          <AnimatedCard delay={0.2}>
            <Card className="border-2 border-gray-100 hover:border-blue-200 transition-colors">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  What happens if I exceed my plan limits?
                </h3>
                <p className="text-gray-600">
                  We'll notify you when you're approaching your limits. You can either upgrade to a higher plan or wait until the next billing cycle. Your service won't be interrupted.
                </p>
              </CardContent>
            </Card>
          </AnimatedCard>

          <AnimatedCard delay={0.3}>
            <Card className="border-2 border-gray-100 hover:border-blue-200 transition-colors">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Is the free plan really free forever?
                </h3>
                <p className="text-gray-600">
                  Yes! Our free plan is completely free with no time limit. It's perfect for small unions getting started. You only pay when you need more features or capacity.
                </p>
              </CardContent>
            </Card>
          </AnimatedCard>
        </div>
      </div>

      {/* CTA Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxIDAgNiAyLjY5IDYgNnMtMi42OSA2LTYgNi02LTIuNjktNi02IDIuNjktNiA2LTZ6TTI0IDQyYzMuMzEgMCA2IDIuNjkgNiA2cy0yLjY5IDYtNiA2LTYtMi42OS02LTYgMi42OS02IDYtNnoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ii8+PC9nPjwvc3ZnPg==')] opacity-20" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedCard>
            <div className="space-y-8">
              <h2 className="text-4xl sm:text-5xl font-bold text-white">
                Still Have Questions?
              </h2>
              <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                Our team is here to help you find the perfect plan for your union.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/contact">
                  <Button
                    size="lg"
                    className="bg-white text-blue-600 hover:bg-gray-50 h-14 px-8 text-lg font-semibold shadow-xl"
                  >
                    Contact Sales
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-transparent border-2 border-white text-white hover:bg-white/10 h-14 px-8 text-lg font-semibold"
                  >
                    Start Free Trial
                  </Button>
                </Link>
              </div>
            </div>
          </AnimatedCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center">
                <Users className="h-6 w-6 text-blue-400" />
                <span className="ml-2 text-lg font-bold text-white">
                  UnionTab
                </span>
              </div>
              <p className="text-sm">
                Empowering unions with modern digital tools to build stronger, more connected communities.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/pricing" className="hover:text-white transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/blogs" className="hover:text-white transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/sign-up" className="hover:text-white transition-colors">
                    Get Started
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/about" className="hover:text-white transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/privacy" className="hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2026 UnionTab. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
