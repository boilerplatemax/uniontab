'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Check,
  ArrowRight,
  FileText,
  Bell,
  ClipboardList,
  Archive,
  Users,
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
    icon: ClipboardList,
    title: 'Structured Filing Workflow',
    description:
      'Standardize how grievances are filed. Capture the incident, the violated contract article, the relief sought, and all supporting details from day one.',
  },
  {
    icon: AlertTriangle,
    title: 'Step-by-Step Status Tracking',
    description:
      'Track every grievance through each step — from informal discussion to arbitration. Everyone involved knows exactly where each case stands.',
  },
  {
    icon: FileText,
    title: 'Document & Evidence Attachments',
    description:
      'Attach written warnings, corrective actions, witness statements, photos, and any other evidence directly to the case file.',
  },
  {
    icon: Bell,
    title: 'Deadline Alerts & Reminders',
    description:
      'Never miss a contractual deadline. The system automatically alerts stewards and officers when a response or escalation is due.',
  },
  {
    icon: Archive,
    title: 'Full Case History & Audit Log',
    description:
      'Every action taken on a grievance is logged — who did it, when, and what changed. Build a permanent institutional record.',
  },
  {
    icon: Users,
    title: 'Steward & Officer Assignment',
    description:
      'Assign cases to specific stewards or officers. They get notified immediately and can update the case from their own account.',
  },
];

const steps = [
  {
    step: '01',
    title: 'Member Files',
    description: 'A member or steward files the grievance with all relevant details and the specific contract article violated.',
  },
  {
    step: '02',
    title: 'Case Assigned',
    description: 'The system assigns it to the right steward or officer, who gets notified immediately.',
  },
  {
    step: '03',
    title: 'Track Progress',
    description: 'Move the case through each contractual step — Step 1, Step 2, arbitration — with full notes at each stage.',
  },
  {
    step: '04',
    title: 'Resolved & Archived',
    description: 'Document the outcome and resolution. The full case becomes part of your permanent grievance history.',
  },
];

const benefits = [
  'Structured grievance filing form',
  'Step-by-step status workflow',
  'Document and evidence attachments',
  'Contractual deadline tracking with alerts',
  'Steward and officer assignment',
  'Grievance history and precedent tracking',
  'Management response logging',
  'Arbitration case preparation',
  'Member notification on case updates',
  'Full audit log on every change',
];

export default function GrievanceTrackingPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />

      {/* Hero */}
      <div className="bg-gradient-to-br from-amber-50 via-white to-amber-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="flex flex-col lg:flex-row items-center gap-14">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex-1 space-y-6"
            >
              <Link href="/features" className="inline-flex items-center text-sm text-amber-600 hover:text-amber-700 font-medium">
                ← All Features
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <AlertTriangle className="h-7 w-7 text-white" />
                </div>
                <span className="text-sm font-semibold text-amber-600 uppercase tracking-wider">Grievance Management</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
                Never Let a Grievance{' '}
                <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                  Slip Through
                </span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Track every workplace grievance from the moment it's filed to final resolution.
                Know the status of every case, never miss a deadline, and build the institutional
                memory your union needs to win.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link href="/sign-up">
                  <Button size="lg" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white h-12 px-8 font-semibold shadow-lg">
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
              <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl p-8 border border-amber-200 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-amber-400/20" />
                {/* Mock grievance card */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="px-5 py-4 border-b flex items-center justify-between">
                    <div>
                      <div className="font-bold text-gray-900">GRV-2024-047</div>
                      <div className="text-xs text-gray-500">Filed March 1 · Article 12.3 — Overtime</div>
                    </div>
                    <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-3 py-1 rounded-full">Step 2</span>
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">Grievant:</span> Michael Torres
                    </div>
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">Relief sought:</span> Back pay for 12 hours at OT rate
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full w-2/4 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full" />
                      </div>
                      <span className="text-xs text-gray-500">Step 2 of 4</span>
                    </div>
                    <div className="text-xs text-red-600 font-medium flex items-center gap-1.5">
                      <Bell className="h-3.5 w-3.5" />
                      Response due in 3 days
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-5 right-5 bg-white rounded-xl shadow-lg px-4 py-3 text-center">
                  <div className="text-2xl font-bold text-amber-600">99%</div>
                  <div className="text-xs text-gray-500">case resolution rate</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <AnimatedSection>
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">How It Works</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-xl mx-auto">
              A simple, structured process from filing to resolution.
            </p>
          </div>
        </AnimatedSection>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <AnimatedSection key={s.step} delay={i * 0.1}>
              <div className="text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {s.step}
                </div>
                <h3 className="font-bold text-gray-900">{s.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{s.description}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>

      {/* Detail features */}
      <div className="bg-amber-50 border-y border-amber-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <AnimatedSection>
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-gray-900">Built for How Unions Actually Work</h2>
            </div>
          </AnimatedSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {detailFeatures.map((item, i) => (
              <AnimatedSection key={item.title} delay={i * 0.08}>
                <div className="bg-white border border-amber-100 rounded-2xl p-6 hover:shadow-lg hover:border-amber-300 transition-all h-full">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mb-4">
                    <item.icon className="h-5 w-5 text-amber-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits list */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <AnimatedSection>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">What's Included</h2>
          </div>
        </AnimatedSection>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {benefits.map((benefit, i) => (
            <AnimatedSection key={benefit} delay={i * 0.05}>
              <div className="flex items-center gap-3 bg-white rounded-xl px-5 py-4 border border-gray-100 shadow-sm">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center flex-shrink-0">
                  <Check className="h-3 w-3 text-white" />
                </div>
                <span className="text-gray-700 text-sm font-medium">{benefit}</span>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>

      {/* Other features */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <AnimatedSection>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Explore More Features</h2>
          </div>
        </AnimatedSection>
        <div className="flex flex-wrap gap-3 justify-center">
          {[
            { name: 'Member Profiles', href: '/features/member-profiles' },
            { name: 'Mass Email & Text', href: '/features/mass-email-text' },
            { name: 'News & Posts', href: '/features/news-posts' },
            { name: 'File Sharing', href: '/features/file-sharing' },
            { name: 'Events & Meetings', href: '/features/events-meetings' },
            { name: 'Elections & Voting', href: '/features/elections-voting' },
            { name: 'Dues Management', href: '/features/dues-management' },
          ].map((f) => (
            <Link key={f.href} href={f.href}>
              <Button variant="outline" className="border-gray-200 text-gray-700 hover:border-amber-300 hover:text-amber-700">
                {f.name}
                <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {/* CTA */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" />
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <AnimatedSection>
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl font-bold text-white">
                Win More Grievances. Build a Stronger Local.
              </h2>
              <p className="text-lg text-amber-100">
                Start managing your grievances the organized way — free to get started.
              </p>
              <Link href="/sign-up">
                <Button size="lg" className="bg-white text-amber-600 hover:bg-gray-50 h-12 px-8 font-semibold shadow-xl">
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
