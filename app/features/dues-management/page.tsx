'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  Check,
  ArrowRight,
  Bell,
  BarChart3,
  History,
  CreditCard,
  FileText,
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
    icon: History,
    title: 'Full Payment History',
    description:
      'See every dues payment ever recorded for each member — date, amount, method, and who entered it. A permanent ledger at your fingertips.',
  },
  {
    icon: Bell,
    title: 'Automatic Overdue Reminders',
    description:
      'Set it once: members who fall behind get automatic email and text reminders. Your treasurer stops chasing people and starts managing.',
  },
  {
    icon: BarChart3,
    title: 'Treasurer Reporting',
    description:
      'Generate monthly or quarterly financial reports in seconds. Export to PDF or spreadsheet for your treasurer\'s report at the next meeting.',
  },
  {
    icon: CreditCard,
    title: 'Online Payment Collection',
    description:
      'Let members pay dues online with a credit or debit card. Payments sync to their profile automatically. No more cash envelopes at the hall.',
  },
  {
    icon: DollarSign,
    title: 'Dues Schedule Management',
    description:
      'Set your dues rate, define payment periods (monthly, quarterly, annual), and track pro-rated amounts for new members automatically.',
  },
  {
    icon: FileText,
    title: 'Good Standing Reports',
    description:
      'Generate a list of members in good standing for meetings, elections, or contract voting. Know instantly who's current and who isn't.',
  },
];

const benefits = [
  'Full dues payment history per member',
  'Automatic overdue notifications (email & SMS)',
  'Online dues payment with card processing',
  'Monthly and quarterly financial reports',
  'Dues schedule and rate management',
  'Pro-rated dues for new members',
  'Good-standing member lists',
  'Export to CSV, PDF, and spreadsheets',
  'Payment method tracking',
  'Integration with member profiles',
];

export default function DuesManagementPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />

      {/* Hero */}
      <div className="bg-gradient-to-br from-teal-50 via-white to-teal-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="flex flex-col lg:flex-row items-center gap-14">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex-1 space-y-6"
            >
              <Link href="/features" className="inline-flex items-center text-sm text-teal-600 hover:text-teal-700 font-medium">
                ← All Features
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <DollarSign className="h-7 w-7 text-white" />
                </div>
                <span className="text-sm font-semibold text-teal-600 uppercase tracking-wider">Financial Management</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
                Know Exactly Who's Paid{' '}
                <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                  and Who Hasn't
                </span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Take the guesswork out of dues collection. Track every payment, send automatic
                reminders, accept online payments, and give your treasurer the reports they need —
                all without a single spreadsheet.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link href="/sign-up">
                  <Button size="lg" className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white h-12 px-8 font-semibold shadow-lg">
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
              <div className="bg-gradient-to-br from-teal-100 to-emerald-100 rounded-2xl p-8 border border-teal-200 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-teal-400/20" />
                {/* Mock dues dashboard */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="px-5 py-4 border-b">
                    <div className="font-bold text-gray-900">March 2024 — Dues Overview</div>
                    <div className="text-xs text-gray-500">Local 1247 · 380 members</div>
                  </div>
                  <div className="p-5 grid grid-cols-3 gap-3">
                    {[
                      { label: 'Current', value: '342', color: 'text-teal-600', bg: 'bg-teal-50' },
                      { label: 'Overdue', value: '28', color: 'text-amber-600', bg: 'bg-amber-50' },
                      { label: 'Collected', value: '$12,840', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    ].map((stat) => (
                      <div key={stat.label} className={`${stat.bg} rounded-lg p-3 text-center`}>
                        <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
                        <div className="text-xs text-gray-500">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="px-5 pb-5 space-y-2">
                    <div className="text-xs font-semibold text-gray-500 mb-2">Recent Payments</div>
                    {[
                      ['Sarah Kim', '$38.00', 'Online', 'Mar 4'],
                      ['Derek Osei', '$38.00', 'Check', 'Mar 3'],
                      ['Pat Williams', '$38.00', 'Online', 'Mar 2'],
                    ].map(([name, amt, method, date]) => (
                      <div key={name} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-400">{method} · {date}</span>
                          <span className="font-semibold text-teal-700">{amt}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute bottom-5 right-5 bg-white rounded-xl shadow-lg px-4 py-3 text-center">
                  <div className="text-2xl font-bold text-teal-600">95%</div>
                  <div className="text-xs text-gray-500">collection rate</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Detail features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <AnimatedSection>
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Dues Management That Works for Your Treasurer
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Simple tools that make collecting and tracking dues less work for everyone.
            </p>
          </div>
        </AnimatedSection>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {detailFeatures.map((item, i) => (
            <AnimatedSection key={item.title} delay={i * 0.08}>
              <div className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:border-teal-200 transition-all h-full">
                <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center mb-4">
                  <item.icon className="h-5 w-5 text-teal-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-teal-50 border-y border-teal-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <AnimatedSection>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">What's Included</h2>
            </div>
          </AnimatedSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {benefits.map((benefit, i) => (
              <AnimatedSection key={benefit} delay={i * 0.05}>
                <div className="flex items-center gap-3 bg-white rounded-xl px-5 py-4 border border-teal-100 shadow-sm">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center flex-shrink-0">
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
            { name: 'Member Profiles', href: '/features/member-profiles' },
            { name: 'Mass Email & Text', href: '/features/mass-email-text' },
            { name: 'Grievance Tracking', href: '/features/grievance-tracking' },
            { name: 'News & Posts', href: '/features/news-posts' },
            { name: 'File Sharing', href: '/features/file-sharing' },
            { name: 'Events & Meetings', href: '/features/events-meetings' },
            { name: 'Elections & Voting', href: '/features/elections-voting' },
          ].map((f) => (
            <Link key={f.href} href={f.href}>
              <Button variant="outline" className="border-gray-200 text-gray-700 hover:border-teal-300 hover:text-teal-600">
                {f.name}
                <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {/* CTA */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700" />
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <AnimatedSection>
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl font-bold text-white">
                Stop Chasing Dues. Start Collecting Them.
              </h2>
              <p className="text-lg text-teal-100">
                Give your treasurer a system that does the follow-up automatically.
              </p>
              <Link href="/sign-up">
                <Button size="lg" className="bg-white text-teal-600 hover:bg-gray-50 h-12 px-8 font-semibold shadow-xl">
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
