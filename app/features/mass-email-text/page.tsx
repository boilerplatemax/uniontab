'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Mail,
  Check,
  ArrowRight,
  MessageSquare,
  BarChart3,
  Target,
  Clock,
  RefreshCw,
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
    icon: Mail,
    title: 'Rich Email Campaigns',
    description:
      'Build beautiful emails with our drag-and-drop editor. Add images, columns, buttons, and formatting. Your emails look professional on every device.',
  },
  {
    icon: MessageSquare,
    title: 'SMS Text Blasts',
    description:
      'When it matters most — a strike vote, an emergency meeting, a contract update — reach every member's phone in seconds with a text message.',
  },
  {
    icon: Target,
    title: 'Targeted Segmentation',
    description:
      'Send to everyone or filter by department, shift, classification, dues status, or any custom field. The right message reaches the right people.',
  },
  {
    icon: BarChart3,
    title: 'Delivery Analytics',
    description:
      'See open rates, click-through rates, and SMS delivery confirmations in real time. Know that your message actually got through.',
  },
  {
    icon: Clock,
    title: 'Scheduled Sends',
    description:
      'Write your message now, schedule it for the right moment. Perfect for meeting reminders, contract deadlines, or recurring newsletters.',
  },
  {
    icon: RefreshCw,
    title: 'Automatic Unsubscribe',
    description:
      'Unsubscribe requests are handled automatically, keeping you compliant with CAN-SPAM and TCPA regulations without lifting a finger.',
  },
];

const benefits = [
  'Bulk email to all members or targeted groups',
  'SMS text blasts with near-instant delivery',
  'Rich HTML email editor with templates',
  'Audience segmentation by any member field',
  'Scheduled and recurring message sends',
  'Open rate, click-through, and delivery tracking',
  'Automatic unsubscribe & opt-out management',
  'Personalization tokens (member name, local, etc.)',
  'Email preview & test send before publishing',
  'Full send history and message archive',
];

export default function MassEmailTextPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />

      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="flex flex-col lg:flex-row items-center gap-14">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex-1 space-y-6"
            >
              <Link href="/features" className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                ← All Features
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Mail className="h-7 w-7 text-white" />
                </div>
                <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">Communication</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
                Reach Every Member,{' '}
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Instantly
                </span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Send targeted emails and text messages to your entire membership or specific groups —
                all from one platform. Track delivery, opens, and clicks to know your message landed.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link href="/sign-up">
                  <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-12 px-8 font-semibold shadow-lg">
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
              <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl p-8 border border-indigo-200 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-indigo-400/20" />
                {/* Mock email UI */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-4">
                    <div className="text-white font-bold text-sm">Contract Update — Important Notice</div>
                    <div className="text-indigo-200 text-xs mt-0.5">To: All Members (1,247 recipients)</div>
                  </div>
                  <div className="p-5 space-y-3">
                    <p className="text-sm text-gray-700">Brothers and Sisters,</p>
                    <p className="text-sm text-gray-600">
                      We're pleased to announce that negotiations have concluded. Please join us for a
                      ratification vote on Tuesday, March 12 at 6PM in the Union Hall.
                    </p>
                    <div className="bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-lg inline-block">
                      RSVP Now →
                    </div>
                  </div>
                  <div className="border-t px-5 py-3 bg-gray-50 flex gap-4 text-xs text-gray-500">
                    <span>Opens: <strong className="text-gray-900">84%</strong></span>
                    <span>Clicks: <strong className="text-gray-900">61%</strong></span>
                    <span>Delivered: <strong className="text-gray-900">1,244/1,247</strong></span>
                  </div>
                </div>
                <div className="absolute bottom-5 right-5 bg-white rounded-xl shadow-lg px-4 py-3 text-center">
                  <div className="text-2xl font-bold text-indigo-600">500K+</div>
                  <div className="text-xs text-gray-500">messages sent</div>
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
              Communication Tools Built for Union Work
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Email and SMS designed for the moment-by-moment demands of organizing.
            </p>
          </div>
        </AnimatedSection>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {detailFeatures.map((item, i) => (
            <AnimatedSection key={item.title} delay={i * 0.08}>
              <div className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:border-indigo-200 transition-all h-full">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">
                  <item.icon className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>

      {/* Benefits list */}
      <div className="bg-indigo-50 border-y border-indigo-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <AnimatedSection>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">What's Included</h2>
            </div>
          </AnimatedSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {benefits.map((benefit, i) => (
              <AnimatedSection key={benefit} delay={i * 0.05}>
                <div className="flex items-center gap-3 bg-white rounded-xl px-5 py-4 border border-indigo-100 shadow-sm">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
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
            { name: 'Grievance Tracking', href: '/features/grievance-tracking' },
            { name: 'News & Posts', href: '/features/news-posts' },
            { name: 'File Sharing', href: '/features/file-sharing' },
            { name: 'Events & Meetings', href: '/features/events-meetings' },
            { name: 'Elections & Voting', href: '/features/elections-voting' },
            { name: 'Dues Management', href: '/features/dues-management' },
          ].map((f) => (
            <Link key={f.href} href={f.href}>
              <Button variant="outline" className="border-gray-200 text-gray-700 hover:border-indigo-300 hover:text-indigo-600">
                {f.name}
                <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {/* CTA */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600" />
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <AnimatedSection>
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl font-bold text-white">
                Stop Chasing Members Down. Start Reaching Them.
              </h2>
              <p className="text-lg text-indigo-100">
                Set up your first email blast in minutes — no tech background required.
              </p>
              <Link href="/sign-up">
                <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-50 h-12 px-8 font-semibold shadow-xl">
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
