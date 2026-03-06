'use client';

import Link from 'next/link';
import { PublicNavbar } from '@/components/public-navbar';
import { PublicFooter } from '@/components/public-footer';
import { Button } from '@/components/ui/button';
import { Check, X, ArrowRight, Award, Users, Shield, HeadphonesIcon, DollarSign } from 'lucide-react';

interface FeatureRow {
  category?: string;
  feature: string;
  uniontab: boolean;
  unionimpact: boolean;
  winmill: boolean;
  unionpowered: boolean;
  un1on: boolean;
}

const features: FeatureRow[] = [
  // Members
  { category: 'Members & Communications', feature: 'Full member directory', uniontab: true, unionimpact: true, winmill: true, unionpowered: true, un1on: false },
  { feature: 'Mass email & SMS to members', uniontab: true, unionimpact: true, winmill: false, unionpowered: false, un1on: false },
  { feature: 'News & announcements feed', uniontab: true, unionimpact: true, winmill: false, unionpowered: false, un1on: false },

  // Elections
  { category: 'Elections & Voting', feature: 'Online ballot creation', uniontab: true, unionimpact: true, winmill: true, unionpowered: false, un1on: true },
  { feature: 'Anonymous voting', uniontab: true, unionimpact: true, winmill: true, unionpowered: false, un1on: true },

  // Grievances
  { category: 'Grievances & Documents', feature: 'Grievance filing & tracking', uniontab: true, unionimpact: true, winmill: false, unionpowered: false, un1on: false },
  { feature: 'Secure document storage', uniontab: true, unionimpact: false, winmill: true, unionpowered: false, un1on: false },

  // Dues & Events
  { category: 'Dues & Events', feature: 'Dues tracking & payment history', uniontab: true, unionimpact: true, winmill: true, unionpowered: true, un1on: false },
  { feature: 'Automated dues reminders', uniontab: true, unionimpact: false, winmill: false, unionpowered: false, un1on: false },
  { feature: 'Event creation & RSVP', uniontab: true, unionimpact: false, winmill: false, unionpowered: true, un1on: false },

  // Platform
  { category: 'Platform', feature: 'Free tier for small locals', uniontab: true, unionimpact: false, winmill: false, unionpowered: false, un1on: false },
];

const competitors = [
  { key: 'uniontab', label: 'UnionTab', highlight: true },
  { key: 'unionimpact', label: 'UnionImpact', highlight: false },
  { key: 'winmill', label: 'Winmill', highlight: false },
  { key: 'unionpowered', label: 'UnionPowered', highlight: false },
  { key: 'un1on', label: 'Un1on', highlight: false },
] as const;

function Cell({ value }: { value: boolean }) {
  if (value) return <Check className="h-5 w-5 text-emerald-500 mx-auto" />;
  return <X className="h-4 w-4 text-gray-300 mx-auto" />;
}

const highlights = [
  { icon: DollarSign, title: 'Free for Small Locals', body: 'Start at no cost — no credit card required. Scale only when you\'re ready.' },
  { icon: Users, title: 'Everything in One Place', body: 'Elections, grievances, dues, comms, events, and documents — one login.' },
  { icon: Shield, title: 'Secure & Anonymous Voting', body: 'End-to-end encrypted ballots with a full audit trail built in.' },
  { icon: HeadphonesIcon, title: 'No Lock-in Contracts', body: 'Month-to-month pricing. Export your data anytime. We earn your business every month.' },
  { icon: Award, title: 'Built for Labour', body: 'Designed from the ground up for union locals — not adapted from generic HR tools.' },
];

export default function WhyChooseUsPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0c1628] to-[#1a2d4f] py-20 lg:py-28">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-violet-500/20 text-violet-300 rounded-full px-4 py-1.5 text-sm font-semibold border border-violet-500/30">
            <Award className="h-4 w-4" />
            Why UnionTab?
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
            The union platform built <span className="text-violet-400">by union people</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            See how UnionTab stacks up against the competition — feature by feature.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link href="/sign-up">
              <Button className="h-12 px-8 bg-violet-500 hover:bg-violet-400 text-white font-bold rounded-full shadow-xl">
                Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/pricing">
              <button className="h-12 px-8 rounded-full border border-white/40 text-white hover:bg-white/10 transition-colors text-sm font-medium">
                View Pricing
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why highlights */}
      <section className="py-20 bg-slate-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">What sets UnionTab apart</h2>
            <p className="mt-3 text-lg text-gray-500">More than software — a partner built for the labour movement.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {highlights.map(({ icon: Icon, title, body }) => (
              <div key={title} className="bg-white rounded-2xl border border-gray-100 p-7 space-y-3 hover:shadow-md transition-shadow">
                <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Icon className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Feature comparison</h2>
            <p className="mt-3 text-gray-500">How UnionTab compares to UnionImpact, Winmill, UnionPowered, and Un1on.</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-6 py-4 font-semibold text-gray-700 bg-gray-50 w-52">Feature</th>
                  {competitors.map((c) => (
                    <th
                      key={c.key}
                      className={`px-4 py-4 text-center font-bold text-sm ${
                        c.highlight ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-600'
                      }`}
                    >
                      {c.highlight && <Award className="h-3.5 w-3.5 text-yellow-300 mx-auto mb-0.5" />}
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {features.map((row, i) => (
                  <>
                    {row.category && (
                      <tr key={`cat-${i}`} className="bg-slate-50 border-t border-b border-gray-200">
                        <td colSpan={6} className="px-6 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-widest">
                          {row.category}
                        </td>
                      </tr>
                    )}
                    <tr key={`row-${i}`} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                      <td className="px-6 py-4 text-gray-700 font-medium">{row.feature}</td>
                      {competitors.map((c) => (
                        <td key={c.key} className={`px-4 py-4 text-center ${c.highlight ? 'bg-blue-50/50' : ''}`}>
                          <Cell value={row[c.key]} />
                        </td>
                      ))}
                    </tr>
                  </>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-center text-gray-400 mt-4">
            Comparison based on publicly available information as of early 2026. Features subject to change.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0c1628] py-20">
        <div className="max-w-3xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Ready to make the switch?</h2>
          <p className="text-lg text-slate-300">
            Join union locals who chose UnionTab for its features, pricing, and people-first support.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/sign-up">
              <Button className="h-12 px-8 bg-violet-500 hover:bg-violet-400 text-white font-bold rounded-full shadow-xl">
                Start Free Today <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <button className="h-12 px-8 rounded-full border border-white/40 text-white hover:bg-white/10 transition-colors text-sm font-medium">
                Talk to the team
              </button>
            </Link>
          </div>
          <p className="text-sm text-slate-500">No credit card required · Free for small locals · Cancel anytime</p>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
