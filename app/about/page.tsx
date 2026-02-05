'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Users,
  Shield,
  Heart,
  Zap,
  ArrowRight,
  Vote,
  Mail,
  BarChart3,
  Target,
  Handshake,
  Eye,
} from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { PublicNavbar } from '@/components/public-navbar';
import { PublicFooter } from '@/components/public-footer';

function AnimatedSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-6 max-w-3xl mx-auto"
        >
          <div className="inline-block">
            <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold inline-flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Built by Union People, for Union People
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
            Stronger Unions Start with{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Better Tools
            </span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
            UnionTab is the all-in-one platform that helps union leaders organize,
            communicate, and serve their members — without the headaches of
            outdated systems.
          </p>
        </motion.div>
      </section>

      {/* Mission Section with Image */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <AnimatedSection>
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                    Our Mission
                  </h2>
                </div>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Too many unions still rely on spreadsheets, paper sign-up sheets,
                  and scattered email threads to manage thousands of members. We
                  believe the labor movement deserves the same modern tools that
                  every other organization takes for granted.
                </p>
                <p className="text-lg text-gray-600 leading-relaxed">
                  UnionTab was founded to close that gap. We give union executives
                  a single platform to manage members, run secure elections, send
                  mass communications, track grievances, and share files — all
                  without needing an IT department.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                <Image
                  src="/assets/landing/built-by-union-people.jpg"
                  alt="Union steward engaging with workers on site"
                  width={600}
                  height={400}
                  className="w-full h-auto object-cover"
                />
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-full blur-xl -z-10" />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                What UnionTab Does
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                One platform to replace the patchwork of tools unions have been
                forced to cobble together.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-8">
            <AnimatedSection delay={0.1}>
              <Card className="border-2 border-gray-100 hover:border-blue-200 transition-all hover:shadow-lg h-full overflow-hidden">
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src="/assets/features/elections.png"
                    alt="Secure election voting interface"
                    fill
                    className="object-cover object-top"
                  />
                </div>
                <CardContent className="p-6 space-y-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg -mt-10 relative z-10 border-4 border-white">
                    <Vote className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Secure Elections
                  </h3>
                  <p className="text-gray-600">
                    Run anonymous, auditable elections that members trust.
                    Real-time results, candidate profiles, and full ballot
                    history — all built in.
                  </p>
                </CardContent>
              </Card>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <Card className="border-2 border-gray-100 hover:border-indigo-200 transition-all hover:shadow-lg h-full overflow-hidden">
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src="/assets/features/communications.png"
                    alt="Mass email composer interface"
                    fill
                    className="object-cover object-top"
                  />
                </div>
                <CardContent className="p-6 space-y-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg -mt-10 relative z-10 border-4 border-white">
                    <Mail className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Mass Communications
                  </h3>
                  <p className="text-gray-600">
                    Send emails and text messages to your entire membership —
                    or target specific groups. Track delivery and engagement so
                    no message gets lost.
                  </p>
                </CardContent>
              </Card>
            </AnimatedSection>

            <AnimatedSection delay={0.3}>
              <Card className="border-2 border-gray-100 hover:border-purple-200 transition-all hover:shadow-lg h-full overflow-hidden">
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src="/assets/features/member-portal.png"
                    alt="Member portal dashboard"
                    fill
                    className="object-cover object-top"
                  />
                </div>
                <CardContent className="p-6 space-y-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg -mt-10 relative z-10 border-4 border-white">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Member Management
                  </h3>
                  <p className="text-gray-600">
                    A modern member directory with profiles, contact info,
                    and membership tracking. Import your roster and get
                    organized in minutes.
                  </p>
                </CardContent>
              </Card>
            </AnimatedSection>

            <AnimatedSection delay={0.4}>
              <Card className="border-2 border-gray-100 hover:border-cyan-200 transition-all hover:shadow-lg h-full overflow-hidden">
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src="/assets/features/analytics.png"
                    alt="Analytics dashboard with charts"
                    fill
                    className="object-cover object-top"
                  />
                </div>
                <CardContent className="p-6 space-y-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg -mt-10 relative z-10 border-4 border-white">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Analytics & Insights
                  </h3>
                  <p className="text-gray-600">
                    See how engaged your members are. Track email opens,
                    election participation, event attendance, and more with
                    dashboards built for union leaders.
                  </p>
                </CardContent>
              </Card>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <AnimatedSection delay={0.1}>
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                <Image
                  src="/assets/landing/hero-workers.jpg"
                  alt="Union workers collaborating around a laptop"
                  width={600}
                  height={400}
                  className="w-full h-auto object-cover"
                />
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <div className="space-y-6">
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                  Our Story
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  UnionTab started with a simple frustration: why do unions still
                  manage critical operations with the same tools they used two
                  decades ago?
                </p>
                <p className="text-lg text-gray-600 leading-relaxed">
                  After spending years watching union leaders juggle spreadsheets,
                  paper ballots, and mass-BCC emails, we decided to build
                  something better. UnionTab was created from the ground up by
                  people who understand what unions actually need — not what a
                  Silicon Valley product team thinks they need.
                </p>
                <p className="text-lg text-gray-600 leading-relaxed">
                  The result is a platform that&apos;s simple enough for any local
                  to adopt on day one, but powerful enough to serve the largest
                  unions in the country.
                </p>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                What We Stand For
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Everything we build is guided by these principles.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <AnimatedSection delay={0.1}>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                  <Eye className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Transparency</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Unions thrive on trust. Our elections are auditable, our pricing
                  is straightforward, and our data practices are clear.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Security</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Member data is sensitive. We use end-to-end encryption,
                  role-based access, and anonymous voting to keep it protected.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.3}>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                  <Handshake className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Accessibility</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Every local deserves modern tools, regardless of size or budget.
                  That&apos;s why our free plan covers unions with up to 150 members.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.4}>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Simplicity</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  You shouldn&apos;t need IT training to run your union. We design
                  every feature to be intuitive from the first click.
                </p>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* By the Numbers Section */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                Built for Real Unions
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                The platform handles the complexity so you can focus on your
                members.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <AnimatedSection delay={0.1}>
              <div className="text-center p-6 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50">
                <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                  6+
                </p>
                <p className="text-gray-700 font-medium">Core Modules</p>
                <p className="text-gray-500 text-sm mt-1">
                  Elections, email, SMS, grievances, files, and more
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <div className="text-center p-6 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50">
                <p className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  99.9%
                </p>
                <p className="text-gray-700 font-medium">Uptime Target</p>
                <p className="text-gray-500 text-sm mt-1">
                  Your platform is available when you need it
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.3}>
              <div className="text-center p-6 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50">
                <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  Free
                </p>
                <p className="text-gray-700 font-medium">For Small Locals</p>
                <p className="text-gray-500 text-sm mt-1">
                  Unions under 150 members use UnionTab at no cost
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.4}>
              <div className="text-center p-6 rounded-xl bg-gradient-to-br from-emerald-50 to-cyan-50">
                <p className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                  24hr
                </p>
                <p className="text-gray-700 font-medium">Support Response</p>
                <p className="text-gray-500 text-sm mt-1">
                  Real people responding to real questions
                </p>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxIDAgNiAyLjY5IDYgNnMtMi42OSA2LTYgNi02LTIuNjktNi02IDIuNjktNiA2LTZ6TTI0IDQyYzMuMzEgMCA2IDIuNjkgNiA2cy0yLjY5IDYtNiA2LTYtMi42OS02LTYgMi42OS02IDYtNnoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ii8+PC9nPjwvc3ZnPg==')] opacity-20" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection>
            <div className="space-y-8">
              <h2 className="text-4xl sm:text-5xl font-bold text-white">
                Ready to Modernize Your Union?
              </h2>
              <p className="text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
                Start for free and see why union leaders are making the switch.
                No credit card required.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link href="/sign-up">
                  <Button
                    size="lg"
                    className="bg-white text-blue-600 hover:bg-gray-50 h-16 px-10 text-lg font-semibold shadow-2xl transition-all transform hover:scale-105"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button
                    size="lg"
                    className="bg-transparent border-2 border-white text-white hover:bg-white/10 hover:text-white hover:border-white h-16 px-10 text-lg font-semibold transition-all"
                  >
                    Talk to Our Team
                  </Button>
                </Link>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
