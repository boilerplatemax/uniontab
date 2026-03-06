'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Users,
  Mail,
  MessageSquare,
  FileText,
  AlertTriangle,
  ArrowRight,
  Check,
  Calendar,
  Vote,
  DollarSign,
  Zap,
  Shield,
  BarChart3,
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

const features = [
  {
    slug: 'member-profiles',
    icon: Users,
    title: 'Member Profiles',
    tagline: 'Your entire membership, organized.',
    description:
      'Keep every member record accurate, accessible, and secure. UnionTab gives you a powerful directory that goes far beyond a spreadsheet — track employment history, dues status, certifications, and custom fields unique to your local.',
    benefits: [
      'Secure, searchable member directory',
      'Custom profile fields for your local',
      'Employment & seniority tracking',
      'Membership status & dues history',
      'Role-based access controls',
    ],
    gradient: 'from-blue-500 to-blue-600',
    lightGradient: 'from-blue-50 to-blue-100',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-200',
    stat: '10,000+',
    statLabel: 'members managed',
  },
  {
    slug: 'mass-email-text',
    icon: Mail,
    title: 'Mass Email & Text',
    tagline: 'Reach every member, instantly.',
    description:
      'Communication is the lifeblood of a strong union. Send targeted email campaigns or SMS blasts to your entire membership or specific groups — all from one place. Track open rates, clicks, and delivery to know your message landed.',
    benefits: [
      'Bulk email campaigns with rich formatting',
      'SMS text blasts to all or targeted groups',
      'Delivery & open rate analytics',
      'Scheduled sends & recurring messages',
      'Unsubscribe management built in',
    ],
    gradient: 'from-indigo-500 to-indigo-600',
    lightGradient: 'from-indigo-50 to-indigo-100',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-600',
    borderColor: 'border-indigo-200',
    stat: '500K+',
    statLabel: 'messages sent',
  },
  {
    slug: 'grievance-tracking',
    icon: AlertTriangle,
    title: 'Grievance Tracking',
    tagline: 'Never let a grievance slip through the cracks.',
    description:
      "Manage every workplace grievance from the moment it's filed to final resolution. Attach documents, track deadlines, record outcomes, and maintain a full audit trail. Know the status of every case without digging through email threads.",
    benefits: [
      'Structured grievance filing workflow',
      'Step-by-step status tracking',
      'Document & evidence attachments',
      'Deadline alerts & reminders',
      'Full case history & audit log',
    ],
    gradient: 'from-amber-500 to-amber-600',
    lightGradient: 'from-amber-50 to-amber-100',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-600',
    borderColor: 'border-amber-200',
    stat: '99%',
    statLabel: 'case resolution rate',
  },
  {
    slug: 'news-posts',
    icon: MessageSquare,
    title: 'News & Posts',
    tagline: 'Keep members informed and engaged.',
    description:
      'Your union's home page deserves a real news feed. Post updates, announcements, and stories with photos and rich text. Members can comment and react, building the kind of engagement that makes a local feel alive.',
    benefits: [
      'Rich text editor with photo support',
      'Scheduled & draft posts',
      'Member comments & reactions',
      'Pin important announcements',
      'Share directly to social media',
    ],
    gradient: 'from-purple-500 to-purple-600',
    lightGradient: 'from-purple-50 to-purple-100',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-600',
    borderColor: 'border-purple-200',
    stat: '3x',
    statLabel: 'more member engagement',
  },
  {
    slug: 'file-sharing',
    icon: FileText,
    title: 'File Sharing',
    tagline: 'Contracts, bylaws, and docs — all in one place.',
    description:
      'Stop emailing PDFs back and forth. Store your collective bargaining agreements, bylaws, meeting minutes, and any other documents in a secure cloud library. Set permissions by role so the right people always have access.',
    benefits: [
      'Unlimited secure cloud storage',
      'Role-based document access',
      'Version history & change tracking',
      'One-click sharing with members',
      'Searchable document library',
    ],
    gradient: 'from-emerald-500 to-emerald-600',
    lightGradient: 'from-emerald-50 to-emerald-100',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-600',
    borderColor: 'border-emerald-200',
    stat: '100%',
    statLabel: 'encrypted storage',
  },
  {
    slug: 'events-meetings',
    icon: Calendar,
    title: 'Events & Meetings',
    tagline: 'Run meetings members actually show up to.',
    description:
      'Organize union meetings, training sessions, rallies, and events with a full calendar system. Send automated reminders, track RSVPs, post agendas and minutes, and build a culture of participation.',
    benefits: [
      'Full event calendar with RSVP',
      'Automated email & SMS reminders',
      'Agenda & minutes publishing',
      'Attendance tracking',
      'Recurring meeting support',
    ],
    gradient: 'from-cyan-500 to-cyan-600',
    lightGradient: 'from-cyan-50 to-cyan-100',
    bgColor: 'bg-cyan-50',
    textColor: 'text-cyan-600',
    borderColor: 'border-cyan-200',
    stat: '40%',
    statLabel: 'higher attendance',
  },
  {
    slug: 'elections-voting',
    icon: Vote,
    title: 'Elections & Voting',
    tagline: 'Democratic elections, done right.',
    description:
      'Conduct officer elections, contract ratification votes, and strike authorization ballots with a secure, verifiable online voting system. Every vote is counted, auditable, and completely private.',
    benefits: [
      'Secure online ballots',
      'One member, one vote enforcement',
      'Anonymous voting with audit trail',
      'Real-time results dashboard',
      'Nomination & candidate management',
    ],
    gradient: 'from-rose-500 to-rose-600',
    lightGradient: 'from-rose-50 to-rose-100',
    bgColor: 'bg-rose-50',
    textColor: 'text-rose-600',
    borderColor: 'border-rose-200',
    stat: '100%',
    statLabel: 'ballot integrity',
  },
  {
    slug: 'dues-management',
    icon: DollarSign,
    title: 'Dues Management',
    tagline: 'Know exactly who's paid and who hasn't.',
    description:
      'Take the guesswork out of dues collection. Track every member's payment history, send automatic reminders to members who are behind, and generate financial reports for your treasurer at the click of a button.',
    benefits: [
      'Full dues payment history per member',
      'Automatic overdue reminders',
      'Treasurer reporting & exports',
      'Online payment integration',
      'Dues schedule management',
    ],
    gradient: 'from-teal-500 to-teal-600',
    lightGradient: 'from-teal-50 to-teal-100',
    bgColor: 'bg-teal-50',
    textColor: 'text-teal-600',
    borderColor: 'border-teal-200',
    stat: '95%',
    statLabel: 'dues collection rate',
  },
];

const platformHighlights = [
  {
    icon: Zap,
    title: 'Set Up in Minutes',
    description: 'Your union website is live the same day you sign up. No IT department required.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Bank-grade encryption, role-based access, and full audit logs on every action.',
  },
  {
    icon: BarChart3,
    title: 'Built-in Analytics',
    description: 'See who's engaged, what's working, and where to focus your organizing efforts.',
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />

      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-6"
          >
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full">
              <Zap className="h-3.5 w-3.5" />
              All-in-one union management platform
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 leading-tight">
              Everything Your Union Needs,{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                One Platform
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              From member management to grievance tracking to elections — UnionTab gives union leaders
              the tools to organize smarter, communicate faster, and build real solidarity.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link href="/sign-up">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white h-12 px-8 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  Start Free Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:border-blue-300 hover:text-blue-600 h-12 px-8 text-base"
                >
                  View Pricing
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Platform Highlights Bar */}
      <div className="border-y bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {platformHighlights.map((item, i) => (
              <AnimatedSection key={item.title} delay={i * 0.1}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <item.icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-600 mt-0.5">{item.description}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </div>

      {/* Features — alternating layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="space-y-24">
          {features.map((feature, index) => {
            const isEven = index % 2 === 0;
            return (
              <AnimatedSection key={feature.slug} delay={0.1}>
                <div
                  className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 lg:gap-20 items-center`}
                >
                  {/* Visual side */}
                  <div className="w-full lg:w-1/2">
                    <div
                      className={`rounded-2xl bg-gradient-to-br ${feature.lightGradient} border ${feature.borderColor} p-10 aspect-video flex items-center justify-center relative overflow-hidden`}
                    >
                      {/* Background decoration */}
                      <div
                        className={`absolute -top-12 -right-12 w-48 h-48 rounded-full bg-gradient-to-br ${feature.gradient} opacity-10`}
                      />
                      <div
                        className={`absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-gradient-to-br ${feature.gradient} opacity-10`}
                      />
                      {/* Icon */}
                      <div
                        className={`w-24 h-24 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center shadow-2xl`}
                      >
                        <feature.icon className="h-12 w-12 text-white" />
                      </div>
                      {/* Stat badge */}
                      <div className="absolute bottom-6 right-6 bg-white rounded-xl shadow-lg px-4 py-3 text-center">
                        <div className={`text-2xl font-bold ${feature.textColor}`}>{feature.stat}</div>
                        <div className="text-xs text-gray-500">{feature.statLabel}</div>
                      </div>
                    </div>
                  </div>

                  {/* Content side */}
                  <div className="w-full lg:w-1/2 space-y-6">
                    <div>
                      <div className={`text-sm font-semibold ${feature.textColor} uppercase tracking-wider mb-2`}>
                        {feature.tagline}
                      </div>
                      <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">{feature.title}</h2>
                    </div>
                    <p className="text-lg text-gray-600 leading-relaxed">{feature.description}</p>
                    <ul className="space-y-3">
                      {feature.benefits.map((benefit) => (
                        <li key={benefit} className="flex items-center gap-3 text-gray-700">
                          <div
                            className={`w-5 h-5 rounded-full bg-gradient-to-br ${feature.gradient} flex items-center justify-center flex-shrink-0`}
                          >
                            <Check className="h-3 w-3 text-white" />
                          </div>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                    <div className="pt-2">
                      <Link href={`/features/${feature.slug}`}>
                        <Button
                          variant="outline"
                          className={`${feature.borderColor} ${feature.textColor} hover:bg-gray-50 font-medium`}
                        >
                          Learn more about {feature.title}
                          <ChevronRight className="ml-1.5 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            );
          })}
        </div>
      </div>

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 25% 50%, white 1px, transparent 1px), radial-gradient(circle at 75% 50%, white 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection>
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-5xl font-bold text-white">
                Ready to Modernize Your Union?
              </h2>
              <p className="text-lg text-blue-100 max-w-2xl mx-auto">
                Join thousands of union leaders who use UnionTab to stay organized, communicate faster,
                and win for their members.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                <Link href="/sign-up">
                  <Button
                    size="lg"
                    className="bg-white text-blue-600 hover:bg-gray-50 h-12 px-8 text-base font-semibold shadow-xl"
                  >
                    Start Free Today
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-transparent border-2 border-white text-white hover:bg-white/10 hover:text-white hover:border-white h-12 px-8 text-base font-semibold"
                  >
                    View Pricing
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
