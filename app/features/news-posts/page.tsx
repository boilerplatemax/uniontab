'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  MessageSquare,
  Check,
  ArrowRight,
  Image,
  Pin,
  ThumbsUp,
  Edit3,
  Share2,
  BookOpen,
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
    icon: Edit3,
    title: 'Rich Text Editor',
    description:
      'Write posts with full formatting — bold, lists, headings, links, and more. Add images and embed videos. Looks great on every device.',
  },
  {
    icon: Image,
    title: 'Photo Attachments',
    description:
      'Bring your posts to life with photos from rallies, meetings, or job sites. Upload multiple images and let members see their union in action.',
  },
  {
    icon: ThumbsUp,
    title: 'Member Reactions & Comments',
    description:
      'Members can react to posts and leave comments, building the community engagement that strengthens solidarity between meetings.',
  },
  {
    icon: Pin,
    title: 'Pinned Announcements',
    description:
      'Pin critical announcements to the top of your feed so every member sees the most important news the moment they log in.',
  },
  {
    icon: BookOpen,
    title: 'Draft & Schedule Posts',
    description:
      'Write posts in advance, save drafts, and schedule publication for exactly the right moment. No more copy-pasting from email.',
  },
  {
    icon: Share2,
    title: 'Social Media Sharing',
    description:
      'Share posts directly to Facebook, Twitter, and other platforms. Amplify your message beyond your own membership when it matters.',
  },
];

const benefits = [
  'Rich text editor with full formatting',
  'Photo and image attachments',
  'Member comments and reactions',
  'Pinned announcements',
  'Draft and scheduled publishing',
  'Social media sharing integration',
  'News category and tag organization',
  'Email notification on new posts',
  'Post engagement analytics',
  'Archive of all published posts',
];

export default function NewsPostsPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />

      {/* Hero */}
      <div className="bg-gradient-to-br from-purple-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="flex flex-col lg:flex-row items-center gap-14">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex-1 space-y-6"
            >
              <Link href="/features" className="inline-flex items-center text-sm text-purple-600 hover:text-purple-700 font-medium">
                ← All Features
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <MessageSquare className="h-7 w-7 text-white" />
                </div>
                <span className="text-sm font-semibold text-purple-600 uppercase tracking-wider">Member Engagement</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
                Keep Members Informed{' '}
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  & Engaged
                </span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Your union deserves a real news feed — not an email chain or a Facebook group you
                don't control. Post updates, share wins, and build the engagement that keeps
                members connected between meetings.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link href="/sign-up">
                  <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white h-12 px-8 font-semibold shadow-lg">
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
              <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-8 border border-purple-200 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-purple-400/20" />
                {/* Mock post card */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="h-28 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                    <span className="text-white text-4xl">✊</span>
                  </div>
                  <div className="p-5 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">📌 Pinned</span>
                      <span className="text-xs text-gray-400">March 5, 2024</span>
                    </div>
                    <div className="font-bold text-gray-900">Contract Talks Update — We Need Your Voice</div>
                    <p className="text-sm text-gray-600">Management came back with a counter-proposal. Here's what they're offering and why we're holding the line...</p>
                    <div className="flex items-center gap-4 pt-2 border-t text-xs text-gray-500">
                      <span className="flex items-center gap-1">👍 84 reactions</span>
                      <span className="flex items-center gap-1">💬 37 comments</span>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-5 right-5 bg-white rounded-xl shadow-lg px-4 py-3 text-center">
                  <div className="text-2xl font-bold text-purple-600">3x</div>
                  <div className="text-xs text-gray-500">more engagement</div>
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
              A News Feed Your Members Will Actually Use
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Built for union communication — not watered-down social media.
            </p>
          </div>
        </AnimatedSection>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {detailFeatures.map((item, i) => (
            <AnimatedSection key={item.title} delay={i * 0.08}>
              <div className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:border-purple-200 transition-all h-full">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
                  <item.icon className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-purple-50 border-y border-purple-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <AnimatedSection>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">What's Included</h2>
            </div>
          </AnimatedSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {benefits.map((benefit, i) => (
              <AnimatedSection key={benefit} delay={i * 0.05}>
                <div className="flex items-center gap-3 bg-white rounded-xl px-5 py-4 border border-purple-100 shadow-sm">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0">
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
            { name: 'File Sharing', href: '/features/file-sharing' },
            { name: 'Events & Meetings', href: '/features/events-meetings' },
            { name: 'Elections & Voting', href: '/features/elections-voting' },
            { name: 'Dues Management', href: '/features/dues-management' },
          ].map((f) => (
            <Link key={f.href} href={f.href}>
              <Button variant="outline" className="border-gray-200 text-gray-700 hover:border-purple-300 hover:text-purple-600">
                {f.name}
                <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {/* CTA */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700" />
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <AnimatedSection>
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl font-bold text-white">
                Give Your Members a Voice — and a Feed Worth Reading.
              </h2>
              <p className="text-lg text-purple-100">
                Start publishing on your union's own platform today.
              </p>
              <Link href="/sign-up">
                <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-50 h-12 px-8 font-semibold shadow-xl">
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
