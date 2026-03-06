'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Vote,
  Check,
  ArrowRight,
  Shield,
  BarChart3,
  Users,
  Lock,
  ClipboardList,
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
    icon: Lock,
    title: 'Secure Online Ballots',
    description:
      'Members vote from any device with a cryptographically secure ballot system. Every vote is encrypted and protected from tampering.',
  },
  {
    icon: Shield,
    title: 'Anonymous Voting with Audit Trail',
    description:
      "Members' votes remain completely anonymous, but every participation is logged. You know who voted — you never know how they voted.",
  },
  {
    icon: Users,
    title: 'One Member, One Vote',
    description:
      'The system enforces that each eligible member can only cast one ballot, preventing duplicate voting or ballot stuffing.',
  },
  {
    icon: ClipboardList,
    title: 'Nomination Management',
    description:
      'Manage the entire nomination process online. Accept nominations, display candidate profiles and statements, and open voting when ready.',
  },
  {
    icon: BarChart3,
    title: 'Live Results Dashboard',
    description:
      'Watch turnout build in real time. Close the election and instantly publish certified results with a full breakdown.',
  },
  {
    icon: Vote,
    title: 'Multiple Election Types',
    description:
      'Officer elections, contract ratification votes, strike authorization ballots, bylaw amendments — run any democratic process your local needs.',
  },
];

const electionTypes = [
  { name: 'Officer Elections', description: 'President, VP, Secretary, Treasurer, Stewards' },
  { name: 'Contract Ratification', description: 'Let members vote yes or no on a tentative agreement' },
  { name: 'Strike Authorization', description: 'Authorize strike action with a verifiable majority vote' },
  { name: 'Bylaw Amendments', description: 'Amend your constitution with a proper ballot process' },
  { name: 'Special Elections', description: 'Fill vacancies, impeachments, or any emergency vote' },
  { name: 'Committee Elections', description: 'Bargaining committee, convention delegates, and more' },
];

const benefits = [
  'Secure encrypted online ballots',
  'Anonymous voting with participation audit',
  'One-member-one-vote enforcement',
  'Candidate nomination and profile management',
  'Election announcement and notification',
  'Live turnout tracking',
  'Instant certified results',
  'PDF results export for records',
  'Multiple simultaneous elections',
  'LMRDA-compliant election process',
];

export default function ElectionsVotingPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />

      {/* Hero */}
      <div className="bg-gradient-to-br from-rose-50 via-white to-rose-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="flex flex-col lg:flex-row items-center gap-14">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex-1 space-y-6"
            >
              <Link href="/features" className="inline-flex items-center text-sm text-rose-600 hover:text-rose-700 font-medium">
                ← All Features
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Vote className="h-7 w-7 text-white" />
                </div>
                <span className="text-sm font-semibold text-rose-600 uppercase tracking-wider">Democratic Process</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
                Democratic Elections,{' '}
                <span className="bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                  Done Right
                </span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Conduct officer elections, contract ratification votes, and strike authorization
                ballots with a secure, verifiable online system. Every vote is private, every
                result is certified, and every process is defensible.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link href="/sign-up">
                  <Button size="lg" className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white h-12 px-8 font-semibold shadow-lg">
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
              <div className="bg-gradient-to-br from-rose-100 to-pink-100 rounded-2xl p-8 border border-rose-200 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-rose-400/20" />
                {/* Mock election results */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="px-5 py-4 border-b">
                    <div className="font-bold text-gray-900">President — 2024 Election</div>
                    <div className="text-xs text-gray-500">Voting closed · 312 of 380 members voted (82%)</div>
                  </div>
                  <div className="p-5 space-y-4">
                    {[
                      { name: 'Maria Santos', votes: 189, pct: 61 },
                      { name: 'James Kowalski', votes: 123, pct: 39 },
                    ].map((candidate, i) => (
                      <div key={candidate.name} className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className={`font-medium ${i === 0 ? 'text-rose-700' : 'text-gray-700'}`}>
                            {candidate.name} {i === 0 && '✓ Elected'}
                          </span>
                          <span className="text-gray-500">{candidate.votes} votes ({candidate.pct}%)</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${i === 0 ? 'bg-gradient-to-r from-rose-400 to-rose-500' : 'bg-gray-300'}`}
                            style={{ width: `${candidate.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute bottom-5 right-5 bg-white rounded-xl shadow-lg px-4 py-3 text-center">
                  <div className="text-2xl font-bold text-rose-600">100%</div>
                  <div className="text-xs text-gray-500">ballot integrity</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Election types */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <AnimatedSection>
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Every Kind of Election, Covered</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-xl mx-auto">
              From officer elections to strike votes — run any democratic process your local needs.
            </p>
          </div>
        </AnimatedSection>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {electionTypes.map((type, i) => (
            <AnimatedSection key={type.name} delay={i * 0.08}>
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-5 hover:border-rose-300 transition-all">
                <div className="font-bold text-gray-900 mb-1">{type.name}</div>
                <div className="text-sm text-gray-600">{type.description}</div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>

      {/* Detail features */}
      <div className="bg-rose-50 border-y border-rose-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <AnimatedSection>
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-gray-900">Built for Trust and Transparency</h2>
            </div>
          </AnimatedSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {detailFeatures.map((item, i) => (
              <AnimatedSection key={item.title} delay={i * 0.08}>
                <div className="bg-white border border-rose-100 rounded-2xl p-6 hover:shadow-lg hover:border-rose-300 transition-all h-full">
                  <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center mb-4">
                    <item.icon className="h-5 w-5 text-rose-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits */}
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
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center flex-shrink-0">
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
            { name: 'Grievance Tracking', href: '/features/grievance-tracking' },
            { name: 'News & Posts', href: '/features/news-posts' },
            { name: 'File Sharing', href: '/features/file-sharing' },
            { name: 'Events & Meetings', href: '/features/events-meetings' },
            { name: 'Dues Management', href: '/features/dues-management' },
          ].map((f) => (
            <Link key={f.href} href={f.href}>
              <Button variant="outline" className="border-gray-200 text-gray-700 hover:border-rose-300 hover:text-rose-600">
                {f.name}
                <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {/* CTA */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700" />
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <AnimatedSection>
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl font-bold text-white">
                Give Your Members a Fair Voice.
              </h2>
              <p className="text-lg text-rose-100">
                Run your next election with a system built for trust and transparency.
              </p>
              <Link href="/sign-up">
                <Button size="lg" className="bg-white text-rose-600 hover:bg-gray-50 h-12 px-8 font-semibold shadow-xl">
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
