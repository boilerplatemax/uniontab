'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Check,
  ArrowRight,
  Bell,
  ClipboardList,
  Users,
  RefreshCw,
  MapPin,
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
    icon: Calendar,
    title: 'Full Event Calendar',
    description:
      'Manage all your union events — monthly meetings, training sessions, rallies, and social events — in a single shared calendar members can view from their phones.',
  },
  {
    icon: Bell,
    title: 'Automated Reminders',
    description:
      'Set it and forget it. Reminders go out automatically by email and text 48 hours and 2 hours before any event. Attendance goes up. You do nothing extra.',
  },
  {
    icon: Users,
    title: 'RSVP & Attendance Tracking',
    description:
      'Members RSVP in one click. Track attendance in real time and see who showed up versus who RSVP'd — valuable data for understanding engagement.',
  },
  {
    icon: ClipboardList,
    title: 'Agendas & Meeting Minutes',
    description:
      'Post agendas before the meeting and publish minutes immediately after. Members who couldn't attend stay informed. Your records are always current.',
  },
  {
    icon: RefreshCw,
    title: 'Recurring Events',
    description:
      'Set monthly membership meetings or weekly committee calls once and they repeat automatically. Update the details once and all future instances update too.',
  },
  {
    icon: MapPin,
    title: 'Location & Virtual Support',
    description:
      'Add a physical location with a map link, or post a Zoom/Teams link for virtual meetings. Members always know where and how to join.',
  },
];

const benefits = [
  'Full event calendar with monthly/weekly views',
  'RSVP and attendance tracking',
  'Automated email and SMS reminders',
  'Agenda publishing before events',
  'Meeting minutes publishing after events',
  'Recurring event scheduling',
  'Physical location with map integration',
  'Virtual meeting link support',
  'Guest speaker and presenter management',
  'Attendance history per member',
];

export default function EventsMeetingsPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />

      {/* Hero */}
      <div className="bg-gradient-to-br from-cyan-50 via-white to-cyan-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="flex flex-col lg:flex-row items-center gap-14">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex-1 space-y-6"
            >
              <Link href="/features" className="inline-flex items-center text-sm text-cyan-600 hover:text-cyan-700 font-medium">
                ← All Features
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Calendar className="h-7 w-7 text-white" />
                </div>
                <span className="text-sm font-semibold text-cyan-600 uppercase tracking-wider">Events & Organizing</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
                Run Meetings Members{' '}
                <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                  Actually Show Up To
                </span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Organize every union event with a calendar that members can actually use. Automated
                reminders, RSVP tracking, and published agendas mean higher participation and a
                more engaged local.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link href="/sign-up">
                  <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white h-12 px-8 font-semibold shadow-lg">
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
              <div className="bg-gradient-to-br from-cyan-100 to-blue-100 rounded-2xl p-8 border border-cyan-200 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-cyan-400/20" />
                {/* Mock event card */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-4 flex items-center gap-3">
                    <div className="bg-white/20 rounded-lg p-2">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-bold">Monthly Membership Meeting</div>
                      <div className="text-cyan-100 text-xs">Tuesday, March 12 · 6:00 PM</div>
                    </div>
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 text-cyan-600 flex-shrink-0" />
                      Union Hall, 1420 Labor Way, Room B
                    </div>
                    <div className="border rounded-lg p-3 bg-gray-50">
                      <div className="text-xs font-semibold text-gray-500 mb-1.5">RSVP Status</div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full w-3/4 bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-full" />
                        </div>
                        <span className="text-sm font-bold text-gray-900">147 / 200</span>
                      </div>
                    </div>
                    <div className="text-xs text-amber-600 font-medium flex items-center gap-1.5">
                      <Bell className="h-3.5 w-3.5" />
                      Reminders sent to 147 RSVPs
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-5 right-5 bg-white rounded-xl shadow-lg px-4 py-3 text-center">
                  <div className="text-2xl font-bold text-cyan-600">40%</div>
                  <div className="text-xs text-gray-500">higher attendance</div>
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
              Everything You Need to Run a Great Meeting
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              From planning to follow-up — your events managed in one place.
            </p>
          </div>
        </AnimatedSection>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {detailFeatures.map((item, i) => (
            <AnimatedSection key={item.title} delay={i * 0.08}>
              <div className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:border-cyan-200 transition-all h-full">
                <div className="w-10 h-10 bg-cyan-50 rounded-xl flex items-center justify-center mb-4">
                  <item.icon className="h-5 w-5 text-cyan-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-cyan-50 border-y border-cyan-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <AnimatedSection>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">What's Included</h2>
            </div>
          </AnimatedSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {benefits.map((benefit, i) => (
              <AnimatedSection key={benefit} delay={i * 0.05}>
                <div className="flex items-center gap-3 bg-white rounded-xl px-5 py-4 border border-cyan-100 shadow-sm">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
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
            { name: 'Elections & Voting', href: '/features/elections-voting' },
            { name: 'Dues Management', href: '/features/dues-management' },
          ].map((f) => (
            <Link key={f.href} href={f.href}>
              <Button variant="outline" className="border-gray-200 text-gray-700 hover:border-cyan-300 hover:text-cyan-600">
                {f.name}
                <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {/* CTA */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-700" />
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <AnimatedSection>
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl font-bold text-white">
                Better Meetings Start Here.
              </h2>
              <p className="text-lg text-cyan-100">
                Set up your union calendar and start sending reminders before your next meeting.
              </p>
              <Link href="/sign-up">
                <Button size="lg" className="bg-white text-cyan-600 hover:bg-gray-50 h-12 px-8 font-semibold shadow-xl">
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
