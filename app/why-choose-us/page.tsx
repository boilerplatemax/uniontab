'use client';

import Link from 'next/link';
import { PublicNavbar } from '@/components/public-navbar';
import { PublicFooter } from '@/components/public-footer';
import { Button } from '@/components/ui/button';
import { Check, X, Minus, ArrowRight, Award, Users, Shield, Zap, HeadphonesIcon, DollarSign } from 'lucide-react';

type CellValue = true | false | null | string;

interface FeatureRow {
  category?: string;
  feature: string;
  uniontab: CellValue;
  unionimpact: CellValue;
  winmill: CellValue;
  unionpowered: CellValue;
  un1on: CellValue;
}

const features: FeatureRow[] = [
  // Member Management
  { category: 'Member Management', feature: 'Full member directory', uniontab: true, unionimpact: true, winmill: true, unionpowered: true, un1on: true },
  { feature: 'Custom member fields', uniontab: true, unionimpact: true, winmill: false, unionpowered: true, un1on: false },
  { feature: 'Bulk CSV import / export', uniontab: true, unionimpact: true, winmill: true, unionpowered: false, un1on: false },
  { feature: 'Role-based access control', uniontab: true, unionimpact: false, winmill: true, unionpowered: false, un1on: false },
  { feature: 'Member self-service portal', uniontab: true, unionimpact: false, winmill: false, unionpowered: true, un1on: false },

  // Communications
  { category: 'Communications', feature: 'Mass email campaigns', uniontab: true, unionimpact: true, winmill: true, unionpowered: true, un1on: true },
  { feature: 'SMS / text messaging', uniontab: true, unionimpact: true, winmill: false, unionpowered: false, un1on: false },
  { feature: 'Scheduled messaging', uniontab: true, unionimpact: false, winmill: false, unionpowered: false, un1on: false },
  { feature: 'News & announcements feed', uniontab: true, unionimpact: true, winmill: true, unionpowered: true, un1on: false },
  { feature: 'Member comments & reactions', uniontab: true, unionimpact: false, winmill: false, unionpowered: false, un1on: false },

  // Elections & Voting
  { category: 'Elections & Voting', feature: 'Online ballot creation', uniontab: true, unionimpact: true, winmill: true, unionpowered: false, un1on: true },
  { feature: 'Anonymous voting', uniontab: true, unionimpact: true, winmill: true, unionpowered: false, un1on: true },
  { feature: 'Real-time results dashboard', uniontab: true, unionimpact: false, winmill: true, unionpowered: false, un1on: false },
  { feature: 'Audit trail & compliance reports', uniontab: true, unionimpact: false, winmill: false, unionpowered: false, un1on: false },
  { feature: 'Multiple election types', uniontab: true, unionimpact: true, winmill: false, unionpowered: false, un1on: false },

  // Grievance Tracking
  { category: 'Grievance Tracking', feature: 'Grievance filing & tracking', uniontab: true, unionimpact: true, winmill: false, unionpowered: false, un1on: false },
  { feature: 'Step-by-step workflow', uniontab: true, unionimpact: false, winmill: false, unionpowered: false, un1on: false },
  { feature: 'Document attachments', uniontab: true, unionimpact: true, winmill: false, unionpowered: false, un1on: false },
  { feature: 'Status notifications', uniontab: true, unionimpact: false, winmill: false, unionpowered: false, un1on: false },

  // Dues Management
  { category: 'Dues Management', feature: 'Dues tracking & payment history', uniontab: true, unionimpact: true, winmill: true, unionpowered: true, un1on: false },
  { feature: 'Automated reminders', uniontab: true, unionimpact: false, winmill: false, unionpowered: false, un1on: false },
  { feature: 'Financial reports (PDF/CSV)', uniontab: true, unionimpact: true, winmill: true, unionpowered: false, un1on: false },
  { feature: 'International reporting integration', uniontab: true, unionimpact: false, winmill: false, unionpowered: false, un1on: false },

  // Events & Meetings
  { category: 'Events & Meetings', feature: 'Event creation & RSVP', uniontab: true, unionimpact: true, winmill: false, unionpowered: true, un1on: false },
  { feature: 'Agendas & meeting minutes', uniontab: true, unionimpact: false, winmill: false, unionpowered: false, un1on: false },
  { feature: 'Attendance tracking', uniontab: true, unionimpact: true, winmill: false, unionpowered: false, un1on: false },
  { feature: 'Calendar sync', uniontab: true, unionimpact: false, winmill: false, unionpowered: false, un1on: false },

  // File Sharing & Docs
  { category: 'File Sharing & Documents', feature: 'Secure document storage', uniontab: true, unionimpact: true, winmill: true, unionpowered: false, un1on: false },
  { feature: 'Folder organisation', uniontab: true, unionimpact: false, winmill: true, unionpowered: false, un1on: false },
  { feature: 'Version history', uniontab: true, unionimpact: false, winmill: false, unionpowered: false, un1on: false },

  // Platform & Pricing
  { category: 'Platform & Pricing', feature: 'Free tier for small locals', uniontab: true, unionimpact: false, winmill: false, unionpowered: false, un1on: false },
  { feature: 'Custom union website / branding', uniontab: true, unionimpact: true, winmill: false, unionpowered: true, un1on: false },
  { feature: 'Mobile-friendly interface', uniontab: true, unionimpact: true, winmill: true, unionpowered: false, un1on: true },
  { feature: 'Multi-language support', uniontab: true, unionimpact: false, winmill: false, unionpowered: false, un1on: false },
  { feature: '99.9% uptime SLA', uniontab: true, unionimpact: false, winmill: false, unionpowered: false, un1on: false },
  { feature: '24-hour support response', uniontab: true, unionimpact: false, winmill: true, unionpowered: false, un1on: false },
  { feature: 'No long-term contracts', uniontab: true, unionimpact: false, winmill: false, unionpowered: true, un1on: true },
];

const competitors = [
  { key: 'uniontab', label: 'UnionTab', highlight: true },
  { key: 'unionimpact', label: 'UnionImpact', highlight: false },
  { key: 'winmill', label: 'Winmill', highlight: false },
  { key: 'unionpowered', label: 'UnionPowered', highlight: false },
  { key: 'un1on', label: 'Un1on', highlight: false },
] as const;

function Cell({ value }: { value: CellValue }) {
  if (value === true) return <Check className="h-5 w-5 text-emerald-500 mx-auto" />;
  if (value === false) return <X className="h-4 w-4 text-gray-300 mx-auto" />;
  if (value === null) return <Minus className="h-4 w-4 text-gray-300 mx-auto" />;
  return <span className="text-xs text-gray-600 text-center block">{value}</span>;
}

const highlights = [
  { icon: DollarSign, title: 'Free for Small Locals', body: 'Start at no cost. No credit card required. Scale when you\'re ready.' },
  { icon: Zap, title: 'All-in-One Platform', body: 'Every tool your union needs — elections, grievances, dues, comms — in a single login.' },
  { icon: Shield, title: 'Built-in Security', body: 'End-to-end encryption, anonymous voting, full audit trails, and 99.9% uptime.' },
  { icon: HeadphonesIcon, title: '24-Hour Support', body: 'Real people who understand unions. Responses within 24 hours, guaranteed.' },
  { icon: Users, title: 'Member Self-Service', body: 'Members can update their own info, RSVP to events, and vote — without admin help.' },
  { icon: Award, title: 'No Lock-in Contracts', body: 'Month-to-month pricing. Export your data anytime. We earn your business every month.' },
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
            See how UnionTab stacks up against the competition — feature by feature, dollar by dollar.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link href="/sign-up">
              <Button className="h-12 px-8 bg-violet-500 hover:bg-violet-400 text-white font-bold rounded-full shadow-xl">
                Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" className="h-12 px-8 border-white/30 text-white hover:bg-white/10 rounded-full">
                View Pricing
              </Button>
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
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Feature-by-feature comparison</h2>
            <p className="mt-3 text-gray-500">How UnionTab compares to UnionImpact, Winmill, UnionPowered, and Un1on.</p>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-6 py-4 font-semibold text-gray-700 w-56 bg-gray-50">Feature</th>
                  {competitors.map((c) => (
                    <th
                      key={c.key}
                      className={`px-4 py-4 text-center font-bold text-sm ${
                        c.highlight
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-50 text-gray-600'
                      }`}
                    >
                      {c.highlight && (
                        <div className="flex items-center justify-center gap-1 mb-0.5">
                          <Award className="h-3.5 w-3.5 text-yellow-300" />
                        </div>
                      )}
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
                        <td
                          colSpan={6}
                          className="px-6 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-widest"
                        >
                          {row.category}
                        </td>
                      </tr>
                    )}
                    <tr
                      key={`row-${i}`}
                      className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                    >
                      <td className="px-6 py-3.5 text-gray-700 font-medium">{row.feature}</td>
                      {competitors.map((c) => (
                        <td
                          key={c.key}
                          className={`px-4 py-3.5 text-center ${
                            c.highlight ? 'bg-blue-50/50' : ''
                          }`}
                        >
                          <Cell value={row[c.key]} />
                        </td>
                      ))}
                    </tr>
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: UnionTab-only summary */}
          <div className="md:hidden space-y-3">
            <p className="text-sm text-gray-500 text-center mb-6">Scroll right or view on a larger screen to see the full comparison.</p>
            <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left px-4 py-4 font-semibold text-gray-700 w-48 bg-gray-50">Feature</th>
                    {competitors.map((c) => (
                      <th
                        key={c.key}
                        className={`px-3 py-4 text-center font-bold text-xs ${
                          c.highlight ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-600'
                        }`}
                      >
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
                          <td colSpan={6} className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
                            {row.category}
                          </td>
                        </tr>
                      )}
                      <tr key={`row-${i}`} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                        <td className="px-4 py-3 text-gray-700 font-medium text-xs">{row.feature}</td>
                        {competitors.map((c) => (
                          <td key={c.key} className={`px-3 py-3 text-center ${c.highlight ? 'bg-blue-50/50' : ''}`}>
                            <Cell value={row[c.key]} />
                          </td>
                        ))}
                      </tr>
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 mt-6 justify-center text-sm text-gray-500">
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-500" /> Included</span>
            <span className="flex items-center gap-1.5"><X className="h-4 w-4 text-gray-300" /> Not available</span>
            <span className="flex items-center gap-1.5"><Minus className="h-4 w-4 text-gray-300" /> Partial / add-on</span>
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
            Join hundreds of union locals who chose UnionTab for its features, pricing, and people-first support.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/sign-up">
              <Button className="h-12 px-8 bg-violet-500 hover:bg-violet-400 text-white font-bold rounded-full shadow-xl">
                Start Free Today <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" className="h-12 px-8 border-white/30 text-white hover:bg-white/10 rounded-full">
                Talk to the team
              </Button>
            </Link>
          </div>
          <p className="text-sm text-slate-500">No credit card required · Free for small locals · Cancel anytime</p>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
