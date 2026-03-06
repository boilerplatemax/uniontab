'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Check,
  ArrowRight,
  Lock,
  History,
  FolderOpen,
  Search,
  Share2,
  Shield,
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
    title: 'Role-Based Access',
    description:
      'Not every file is for every member. Set access by role — officers only, stewards, all members, or specific departments. Documents get to the right people.',
  },
  {
    icon: History,
    title: 'Version History',
    description:
      'Upload a new CBA? The old one doesn't disappear. Every file keeps a full version history so you can always retrieve an older draft or compare changes.',
  },
  {
    icon: FolderOpen,
    title: 'Organized Folders',
    description:
      'Create a logical folder structure — Contracts, Meeting Minutes, Bylaws, Forms — so members can find what they need without digging.',
  },
  {
    icon: Search,
    title: 'Full-Text Search',
    description:
      'Search by file name or content inside documents. Find the right contract clause or meeting minutes entry in seconds.',
  },
  {
    icon: Share2,
    title: 'One-Click Sharing',
    description:
      'Generate a secure, time-limited link to share any document with members or external parties — without giving them a login.',
  },
  {
    icon: Shield,
    title: 'Encrypted Storage',
    description:
      'Every file is encrypted at rest and in transit. Your contracts and sensitive documents are protected with bank-grade security.',
  },
];

const benefits = [
  'Unlimited secure cloud document storage',
  'Role-based access for every file',
  'Full version history on all documents',
  'Organized folder and category system',
  'Full-text document search',
  'One-click secure sharing links',
  'Bulk upload from your desktop',
  'File download tracking and audit log',
  'PDF, Word, Excel, image support',
  'Bank-grade encryption at rest and in transit',
];

export default function FileSharingPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />

      {/* Hero */}
      <div className="bg-gradient-to-br from-emerald-50 via-white to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="flex flex-col lg:flex-row items-center gap-14">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex-1 space-y-6"
            >
              <Link href="/features" className="inline-flex items-center text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                ← All Features
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <FileText className="h-7 w-7 text-white" />
                </div>
                <span className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">Document Management</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
                Contracts, Bylaws & Docs —{' '}
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  All in One Place
                </span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Stop emailing PDFs and tracking down the latest version. Store every document your
                union needs in a secure, organized library — with the right people having access
                and everyone else kept out.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link href="/sign-up">
                  <Button size="lg" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white h-12 px-8 font-semibold shadow-lg">
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
              <div className="bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl p-8 border border-emerald-200 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-emerald-400/20" />
                {/* Mock file browser */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="px-5 py-3 border-b flex items-center gap-2 bg-gray-50">
                    <FolderOpen className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium text-gray-700">Contracts & Agreements</span>
                  </div>
                  <div className="divide-y">
                    {[
                      { name: 'CBA 2023-2026.pdf', size: '2.4 MB', access: 'All Members', icon: '📄' },
                      { name: 'CBA 2020-2023.pdf', size: '2.1 MB', access: 'All Members', icon: '📄' },
                      { name: 'MOU — Overtime Aug 2024.pdf', size: '340 KB', access: 'Officers', icon: '🔒' },
                    ].map((file) => (
                      <div key={file.name} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50">
                        <span className="text-xl">{file.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{file.name}</div>
                          <div className="text-xs text-gray-400">{file.size} · {file.access}</div>
                        </div>
                        <Share2 className="h-4 w-4 text-gray-300 hover:text-emerald-600 cursor-pointer" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute bottom-5 right-5 bg-white rounded-xl shadow-lg px-4 py-3 text-center">
                  <div className="text-2xl font-bold text-emerald-600">100%</div>
                  <div className="text-xs text-gray-500">encrypted storage</div>
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
              Secure Document Management, Simplified
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to store, organize, and share your union's most important documents.
            </p>
          </div>
        </AnimatedSection>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {detailFeatures.map((item, i) => (
            <AnimatedSection key={item.title} delay={i * 0.08}>
              <div className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:border-emerald-200 transition-all h-full">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
                  <item.icon className="h-5 w-5 text-emerald-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-emerald-50 border-y border-emerald-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <AnimatedSection>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">What's Included</h2>
            </div>
          </AnimatedSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {benefits.map((benefit, i) => (
              <AnimatedSection key={benefit} delay={i * 0.05}>
                <div className="flex items-center gap-3 bg-white rounded-xl px-5 py-4 border border-emerald-100 shadow-sm">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
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
            { name: 'Events & Meetings', href: '/features/events-meetings' },
            { name: 'Elections & Voting', href: '/features/elections-voting' },
            { name: 'Dues Management', href: '/features/dues-management' },
          ].map((f) => (
            <Link key={f.href} href={f.href}>
              <Button variant="outline" className="border-gray-200 text-gray-700 hover:border-emerald-300 hover:text-emerald-600">
                {f.name}
                <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {/* CTA */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700" />
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <AnimatedSection>
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl font-bold text-white">
                Stop Searching for Files. Start Finding Them.
              </h2>
              <p className="text-lg text-emerald-100">
                Migrate your documents to UnionTab and keep everything organized from day one.
              </p>
              <Link href="/sign-up">
                <Button size="lg" className="bg-white text-emerald-600 hover:bg-gray-50 h-12 px-8 font-semibold shadow-xl">
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
