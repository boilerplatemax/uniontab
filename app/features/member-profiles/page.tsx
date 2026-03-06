'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Users,
  Check,
  ArrowRight,
  Shield,
  Search,
  SlidersHorizontal,
  History,
  Lock,
  Download,
  ChevronRight,
} from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { PublicNavbar } from '@/components/public-navbar';
import { PublicFooter } from '@/components/public-footer';

function AnimatedSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

const detailFeatures = [
  {
    icon: Search,
    title: 'Instant Member Search',
    description:
      'Find any member in seconds by name, badge number, department, job classification, or any custom field you define. No more scrolling spreadsheets.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Custom Profile Fields',
    description:
      'Every union is different. Add the fields that matter to your local — seniority date, shift, certifications, grievance history, or anything else you track.',
  },
  {
    icon: History,
    title: 'Complete Membership History',
    description:
      'See a full timeline for every member: when they joined, dues payments, grievances filed, elections voted in, and any status changes over time.',
  },
  {
    icon: Lock,
    title: 'Role-Based Access',
    description:
      'Officers see everything. Stewards see their department. Members see their own profile. Control exactly who can view or edit each piece of information.',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description:
      'Member data is encrypted at rest and in transit. Every action is logged. GDPR and labor law compliance built in — not bolted on.',
  },
  {
    icon: Download,
    title: 'Export & Reports',
    description:
      'Generate membership reports, export to CSV or PDF, and integrate with your international\'s reporting requirements in a few clicks.',
  },
];

const benefits = [
  'Searchable member directory with advanced filters',
  "Custom profile fields for your local's unique data",
  'Employment history, seniority, and classification tracking',
  'Membership status management (active, retired, suspended)',
  'Dues payment history linked to each profile',
  'Grievance and election participation history',
  'Role-based visibility and editing permissions',
  'Bulk import from existing spreadsheets',
  "Export to CSV, PDF, or your international's format",
  'Encrypted storage and full audit log',
];

export default function MemberProfilesPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />

      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="flex flex-col lg:flex-row items-center gap-14">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex-1 space-y-6"
            >
              <Link
                href="/features"
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                ← All Features
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Member Management</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
                Your Entire Membership,{' '}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Organized
                </span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                UnionTab gives you a living, breathing membership directory — not a stale spreadsheet.
                Track every member's history, customize their profiles, and know exactly where your
                membership stands at any moment.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link href="/sign-up">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white h-12 px-8 font-semibold shadow-lg"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button size="lg" variant="outline" className="h-12 px-8 border-gray-300 text-gray-700">
                    View Pricing
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Hero visual */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="flex-1 w-full"
            >
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl p-8 border border-blue-200 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-blue-400/20" />
                {/* Mock member card */}
                <div className="bg-white rounded-xl shadow-lg p-5 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg">
                      JD
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-lg">Jane Doe</div>
                      <div className="text-sm text-gray-500">Badge #4521 · Journeyman Electrician</div>
                      <span className="inline-flex items-center gap-1 mt-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        Active Member
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      ['Seniority Date', 'March 12, 2014'],
                      ['Shift', 'Day Shift'],
                      ['Department', 'Distribution'],
                      ['Dues Status', 'Current'],
                    ].map(([label, value]) => (
                      <div key={label} className="bg-gray-50 rounded-lg p-2.5">
                        <div className="text-xs text-gray-500">{label}</div>
                        <div className="font-medium text-gray-900">{value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md font-medium">3 Grievances</span>
                    <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded-md font-medium">5 Votes</span>
                    <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md font-medium">Steward</span>
                  </div>
                </div>
                {/* Stat */}
                <div className="absolute bottom-5 right-5 bg-white rounded-xl shadow-lg px-4 py-3 text-center">
                  <div className="text-2xl font-bold text-blue-600">10K+</div>
                  <div className="text-xs text-gray-500">members managed</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Detail features grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <AnimatedSection>
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Everything You Need to Manage Membership
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              A member directory that works as hard as you do.
            </p>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {detailFeatures.map((item, i) => (
            <AnimatedSection key={item.title} delay={i * 0.08}>
              <div className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:border-blue-200 transition-all h-full">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                  <item.icon className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>

      {/* Full benefits list */}
      <div className="bg-blue-50 border-y border-blue-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <AnimatedSection>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">What's Included</h2>
            </div>
          </AnimatedSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {benefits.map((benefit, i) => (
              <AnimatedSection key={benefit} delay={i * 0.05}>
                <div className="flex items-center gap-3 bg-white rounded-xl px-5 py-4 border border-blue-100 shadow-sm">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-gray-700 text-sm font-medium">{benefit}</span>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </div>

      {/* Other features */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <AnimatedSection>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Explore More Features</h2>
          </div>
        </AnimatedSection>
        <div className="flex flex-wrap gap-3 justify-center">
          {[
            { name: 'Mass Email & Text', href: '/features/mass-email-text' },
            { name: 'Grievance Tracking', href: '/features/grievance-tracking' },
            { name: 'News & Posts', href: '/features/news-posts' },
            { name: 'File Sharing', href: '/features/file-sharing' },
            { name: 'Events & Meetings', href: '/features/events-meetings' },
            { name: 'Elections & Voting', href: '/features/elections-voting' },
            { name: 'Dues Management', href: '/features/dues-management' },
          ].map((f) => (
            <Link key={f.href} href={f.href}>
              <Button variant="outline" className="border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-600">
                {f.name}
                <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {/* CTA */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <AnimatedSection>
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl font-bold text-white">
                Ready to Take Control of Your Membership?
              </h2>
              <p className="text-lg text-blue-100">
                Get started today and have your member directory set up in minutes.
              </p>
              <Link href="/sign-up">
                <Button
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-gray-50 h-12 px-8 font-semibold shadow-xl"
                >
                  Start Free Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
