'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Users, Globe, Shield, Zap, Mail, Vote, Database, BarChart3, Calendar, Lock, CheckCircle2, Clock, FileCheck, UserCheck, Video } from 'lucide-react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';

// Animation component for scroll-triggered animations
function AnimatedSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export default function HomePage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  // Keep minimum opacity of 1 on mobile to prevent faded/transparent appearance
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 1]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.98]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Enhanced Navbar */}
      <nav className="border-b bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center hover:opacity-80 transition-opacity group">
              <div className="relative">
                <Users className="h-8 w-8 text-blue-600 group-hover:scale-110 transition-transform" />
                <div className="absolute -inset-1 bg-blue-600/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="ml-2 text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                UnionTab
              </span>
            </Link>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/features" className="hidden sm:block">
                <Button variant="ghost" className="text-gray-700 hover:text-blue-600">
                  Features
                </Button>
              </Link>
              <Link href="/pricing" className="hidden sm:block">
                <Button variant="ghost" className="text-gray-700 hover:text-blue-600">
                  Pricing
                </Button>
              </Link>
              <Link href="/blogs" className="hidden sm:block">
                <Button variant="ghost" className="text-gray-700 hover:text-blue-600">
                  Blog
                </Button>
              </Link>
              <Link href="/contact" className="hidden sm:block">
                <Button variant="ghost" className="text-gray-700 hover:text-blue-600">
                  Contact
                </Button>
              </Link>
              <Link href="/member-login">
                <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                  Member Login
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Parallax */}
      <section ref={heroRef} className="relative overflow-hidden">
        <motion.div
          style={{ opacity, scale }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-16 sm:pb-24"
        >
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="space-y-6"
              >
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Empower Your Union
                  </span>{' '}
                  with Modern Tools
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Create a professional website for your union in minutes. Engage members, share updates, and strengthen your community.
                </p>
              </motion.div>

              {/* Key Stats - Honest early-stage metrics */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="flex flex-wrap gap-6 sm:gap-8 pt-4"
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Built by union people</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-indigo-600" />
                  <span className="text-sm font-medium text-gray-700">99.9% uptime</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">Free for small locals</span>
                </div>
              </motion.div>

              {/* Desktop CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="hidden lg:flex gap-4 pt-4"
              >
                <Link href="/sign-up">
                  <Button
                    className="h-14 px-8 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all"
                    size="lg"
                  >
                    Start Free Today
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/features">
                  <Button
                    variant="outline"
                    className="h-14 px-8 text-lg border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                    size="lg"
                  >
                    See All Features
                  </Button>
                </Link>
              </motion.div>
            </div>

            {/* Right Column - Hero Image */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="lg:pl-8"
            >
              <div className="relative">
                {/* Main Hero Image */}
                <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                  <Image
                    src="/assets/landing/hero-workers.jpg"
                    alt="Union workers gathered around a laptop reviewing engagement dashboard"
                    width={600}
                    height={400}
                    className="w-full h-auto object-cover"
                    priority
                  />
                </div>
                {/* Floating CTA Card */}
                <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-xl p-4 border border-gray-100 hidden sm:block">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Ready to launch</p>
                      <p className="text-xs text-gray-500">Setup takes minutes</p>
                    </div>
                  </div>
                </div>
                {/* Decorative element */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-full blur-xl -z-10" />
              </div>

              {/* CTA Buttons below image on mobile, beside on desktop */}
              <div className="mt-8 space-y-4 lg:hidden">
                <Link href="/sign-up" className="block">
                  <Button
                    className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all"
                    size="lg"
                  >
                    Start Free Today
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/features" className="block">
                  <Button
                    variant="outline"
                    className="w-full h-14 text-lg border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                    size="lg"
                  >
                    See All Features
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl -z-10" />
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                Get Started in 3 Simple Steps
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Launch your union website in minutes, not months
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8">
            <AnimatedSection delay={0.1}>
              <div className="text-center space-y-4 h-full flex flex-col">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg flex-shrink-0">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Create Your Profile</h3>
                <p className="text-gray-600 flex-grow">
                  Sign up and customize your union's branding, colors, and information in our guided setup wizard.
                </p>
                {/* Screenshot */}
                <div className="relative h-40 mt-4 rounded-xl overflow-hidden shadow-lg border border-gray-200">
                  <Image
                    src="/assets/landing/step-1-profile.png"
                    alt="Profile setup wizard screenshot"
                    fill
                    className="object-cover object-top"
                  />
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <div className="text-center space-y-4 h-full flex flex-col">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg flex-shrink-0">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Add Your Members</h3>
                <p className="text-gray-600 flex-grow">
                  Import your member list or invite members to join. They'll get secure access to your portal.
                </p>
                {/* Screenshot */}
                <div className="relative h-40 mt-4 rounded-xl overflow-hidden shadow-lg border border-gray-200">
                  <Image
                    src="/assets/landing/step-2-import.png"
                    alt="Member import screen screenshot"
                    fill
                    className="object-cover object-top"
                  />
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.3}>
              <div className="text-center space-y-4 h-full flex flex-col">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg flex-shrink-0">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Start Engaging</h3>
                <p className="text-gray-600 flex-grow">
                  Send communications, run elections, share documents, and build your community.
                </p>
                {/* Screenshot */}
                <div className="relative h-40 mt-4 rounded-xl overflow-hidden shadow-lg border border-gray-200">
                  <Image
                    src="/assets/landing/step-3-dashboard.png"
                    alt="Dashboard with features screenshot"
                    fill
                    className="object-cover object-top"
                  />
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Features Showcase Section */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900">
                Everything You Need to Run Your Union
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Powerful tools designed specifically for labor organizations
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 - Secure Elections (Lead with this - key differentiator) */}
            <AnimatedSection delay={0.1}>
              <Card className="border-2 hover:border-blue-300 hover:shadow-2xl transition-all duration-300 h-full group cursor-pointer bg-gradient-to-br from-white to-blue-50/30 overflow-hidden">
                <CardContent className="p-0 h-full flex flex-col">
                  {/* Feature Screenshot */}
                  <div className="relative h-36 w-full overflow-hidden">
                    <Image
                      src="/assets/features/elections.png"
                      alt="Voting interface screenshot"
                      fill
                      className="object-cover object-top"
                    />
                  </div>
                  <div className="p-6 space-y-4 flex-grow">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg -mt-10 relative z-10 border-4 border-white">
                      <Vote className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      Secure Elections & Voting
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Run democratic elections with our secure, anonymous voting system. Built for union governance.
                    </p>
                    <ul className="space-y-2 pt-2">
                      <li className="flex items-center gap-2 text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                        Anonymous ballot casting
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                        Real-time results tracking
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                        Audit trail for compliance
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </AnimatedSection>

            {/* Feature 2 - Mass Communications */}
            <AnimatedSection delay={0.2}>
              <Card className="border-2 hover:border-indigo-300 hover:shadow-2xl transition-all duration-300 h-full group cursor-pointer bg-gradient-to-br from-white to-indigo-50/30 overflow-hidden">
                <CardContent className="p-0 h-full flex flex-col">
                  {/* Feature Screenshot */}
                  <div className="relative h-36 w-full overflow-hidden">
                    <Image
                      src="/assets/features/communications.png"
                      alt="Email composer screenshot"
                      fill
                      className="object-cover object-top"
                    />
                  </div>
                  <div className="p-6 space-y-4 flex-grow">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg -mt-10 relative z-10 border-4 border-white">
                      <Mail className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      Mass Communications
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Reach every member instantly with email and SMS broadcasting. Keep everyone informed.
                    </p>
                    <ul className="space-y-2 pt-2">
                      <li className="flex items-center gap-2 text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                        Email campaigns with templates
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                        SMS text messaging
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                        Delivery tracking & analytics
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </AnimatedSection>

            {/* Feature 3 - Member Portal */}
            <AnimatedSection delay={0.3}>
              <Card className="border-2 hover:border-purple-300 hover:shadow-2xl transition-all duration-300 h-full group cursor-pointer bg-gradient-to-br from-white to-purple-50/30 overflow-hidden">
                <CardContent className="p-0 h-full flex flex-col">
                  {/* Feature Screenshot */}
                  <div className="relative h-36 w-full overflow-hidden">
                    <Image
                      src="/assets/features/member-portal.png"
                      alt="Member dashboard screenshot"
                      fill
                      className="object-cover object-top"
                    />
                  </div>
                  <div className="p-6 space-y-4 flex-grow">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg -mt-10 relative z-10 border-4 border-white">
                      <Users className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      Member Portal
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      A beautiful, branded website for your union. Members can access news, documents, and more.
                    </p>
                    <ul className="space-y-2 pt-2">
                      <li className="flex items-center gap-2 text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                        Custom branding & themes
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                        News feed & announcements
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                        Mobile-friendly design
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </AnimatedSection>

            {/* Feature 4 - Analytics */}
            <AnimatedSection delay={0.4}>
              <Card className="border-2 hover:border-cyan-300 hover:shadow-2xl transition-all duration-300 h-full group cursor-pointer bg-gradient-to-br from-white to-cyan-50/30 overflow-hidden">
                <CardContent className="p-0 h-full flex flex-col">
                  {/* Feature Screenshot */}
                  <div className="relative h-36 w-full overflow-hidden">
                    <Image
                      src="/assets/features/analytics.png"
                      alt="Analytics charts screenshot"
                      fill
                      className="object-cover object-top"
                    />
                  </div>
                  <div className="p-6 space-y-4 flex-grow">
                    <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg -mt-10 relative z-10 border-4 border-white">
                      <BarChart3 className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      Analytics & Reports
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Track engagement, membership trends, and communication effectiveness with detailed analytics.
                    </p>
                    <ul className="space-y-2 pt-2">
                      <li className="flex items-center gap-2 text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 bg-cyan-600 rounded-full" />
                        Member engagement metrics
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 bg-cyan-600 rounded-full" />
                        Communication analytics
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 bg-cyan-600 rounded-full" />
                        Exportable reports
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </AnimatedSection>

            {/* Feature 5 - Secure Storage */}
            <AnimatedSection delay={0.5}>
              <Card className="border-2 hover:border-emerald-300 hover:shadow-2xl transition-all duration-300 h-full group cursor-pointer bg-gradient-to-br from-white to-emerald-50/30 overflow-hidden">
                <CardContent className="p-0 h-full flex flex-col">
                  {/* Feature Screenshot */}
                  <div className="relative h-36 w-full overflow-hidden">
                    <Image
                      src="/assets/features/documents.png"
                      alt="Document library screenshot"
                      fill
                      className="object-cover object-top"
                    />
                  </div>
                  <div className="p-6 space-y-4 flex-grow">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg -mt-10 relative z-10 border-4 border-white">
                      <Database className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      Secure Document Storage
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Store and share contracts, bylaws, meeting minutes, and other important documents securely.
                    </p>
                    <ul className="space-y-2 pt-2">
                      <li className="flex items-center gap-2 text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                        Organized file library
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                        Access controls
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                        Version history
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </AnimatedSection>

            {/* Feature 6 - Event Management */}
            <AnimatedSection delay={0.6}>
              <Card className="border-2 hover:border-pink-300 hover:shadow-2xl transition-all duration-300 h-full group cursor-pointer bg-gradient-to-br from-white to-pink-50/30 overflow-hidden">
                <CardContent className="p-0 h-full flex flex-col">
                  {/* Feature Screenshot */}
                  <div className="relative h-36 w-full overflow-hidden">
                    <Image
                      src="/assets/features/events.png"
                      alt="Event calendar screenshot"
                      fill
                      className="object-cover object-top"
                    />
                  </div>
                  <div className="p-6 space-y-4 flex-grow">
                    <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg -mt-10 relative z-10 border-4 border-white">
                      <Calendar className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      Event Management
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Schedule meetings, rallies, and social events. Send reminders and track attendance.
                    </p>
                    <ul className="space-y-2 pt-2">
                      <li className="flex items-center gap-2 text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 bg-pink-600 rounded-full" />
                        Event calendar
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 bg-pink-600 rounded-full" />
                        Automatic reminders
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 bg-pink-600 rounded-full" />
                        RSVP tracking
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Why Unions Choose Us Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900">
                Why Unions Choose Us
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Built by union members, for union members
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8">
            <AnimatedSection delay={0.1}>
              <Card className="border-2 h-full bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow overflow-hidden">
                {/* Image: Union steward with tablet */}
                <div className="relative h-52 overflow-hidden">
                  <Image
                    src="/assets/landing/built-by-union-people.jpg"
                    alt="Union steward with tablet talking to workers on site"
                    fill
                    className="object-cover"
                  />
                </div>
                <CardContent className="p-6 pt-0 space-y-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg -mt-7 relative z-10 border-4 border-white">
                    <UserCheck className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Built by Union People</h3>
                  <p className="text-gray-600 leading-relaxed">
                    We understand the unique challenges unions face because we've lived them. Our platform is designed with your needs in mind.
                  </p>
                </CardContent>
              </Card>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <Card className="border-2 h-full bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow overflow-hidden">
                {/* Image: Workers gathered around laptop */}
                <div className="relative h-52 overflow-hidden">
                  <Image
                    src="/assets/landing/free-for-small-locals.jpg"
                    alt="Small group of workers gathered around a laptop reviewing union dashboard"
                    fill
                    className="object-cover"
                  />
                </div>
                <CardContent className="p-6 pt-0 space-y-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg -mt-7 relative z-10 border-4 border-white">
                    <Zap className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Free for Small Locals</h3>
                  <p className="text-gray-600 leading-relaxed">
                    We believe every union deserves modern tools. Our free tier gives small locals everything they need to get started.
                  </p>
                </CardContent>
              </Card>
            </AnimatedSection>

            <AnimatedSection delay={0.3}>
              <Card className="border-2 h-full bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow overflow-hidden">
                {/* Image: Before/after comparison */}
                <div className="relative h-52 overflow-hidden">
                  <Image
                    src="/assets/landing/save-hours.png"
                    alt="Before and after: messy desk with papers versus clean desk with laptop showing dashboard"
                    fill
                    className="object-cover"
                  />
                </div>
                <CardContent className="p-6 pt-0 space-y-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg -mt-7 relative z-10 border-4 border-white">
                    <Clock className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Save Hours Every Week</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Automate repetitive tasks like sending reminders, collecting votes, and tracking member engagement.
                  </p>
                </CardContent>
              </Card>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Security & Compliance Section */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                Security & Compliance
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Enterprise-grade security to protect your members' data
              </p>
            </div>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnimatedSection delay={0.1}>
              <div className="text-center p-6 rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors">
                <Shield className="h-10 w-10 text-blue-600 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">End-to-End Encryption</h4>
                <p className="text-sm text-gray-600">All data is encrypted in transit and at rest using industry-standard protocols.</p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <div className="text-center p-6 rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors">
                <FileCheck className="h-10 w-10 text-indigo-600 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">Audit Trails</h4>
                <p className="text-sm text-gray-600">Complete logging of all actions for compliance and accountability.</p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.3}>
              <div className="text-center p-6 rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors">
                <Lock className="h-10 w-10 text-purple-600 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">Anonymous Voting</h4>
                <p className="text-sm text-gray-600">Cryptographically secure voting that protects member privacy.</p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.4}>
              <div className="text-center p-6 rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors">
                <Globe className="h-10 w-10 text-cyan-600 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">99.9% Uptime</h4>
                <p className="text-sm text-gray-600">Reliable infrastructure so your union is always accessible.</p>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Union Logos Banner */}
      <section className="py-10 bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-8">
                Trusted by unions across North America
              </p>
              <div className="flex items-center justify-center gap-6 sm:gap-10 md:gap-12">
                {/* Union logos with consistent sizing */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 relative flex items-center justify-center">
                  <Image
                    src="/assets/logos/union-1.png"
                    alt="Union partner logo"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="w-16 h-16 sm:w-20 sm:h-20 relative flex items-center justify-center">
                  <Image
                    src="/assets/logos/union-2.png"
                    alt="Union partner logo"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="w-16 h-16 sm:w-20 sm:h-20 relative flex items-center justify-center">
                  <Image
                    src="/assets/logos/union-3.png"
                    alt="Union partner logo"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="w-16 h-16 sm:w-20 sm:h-20 relative hidden sm:flex items-center justify-center">
                  <Image
                    src="/assets/logos/union-4.png"
                    alt="Union partner logo"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="w-16 h-16 sm:w-20 sm:h-20 relative hidden md:flex items-center justify-center">
                  <Image
                    src="/assets/logos/union-5.png"
                    alt="Union partner logo"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxIDAgNiAyLjY5IDYgNnMtMi42OSA2LTYgNi02LTIuNjktNi02IDIuNjktNiA2LTZ6TTI0IDQyYzMuMzEgMCA2IDIuNjkgNiA2cy0yLjY5IDYtNiA2LTYtMi42OS02LTYgMi42OS02IDYtNnoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ii8+PC9nPjwvc3ZnPg==')] opacity-20" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection>
            <div className="space-y-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-6">
                <Users className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold text-white">
                Ready to Modernize Your Union?
              </h2>
              <p className="text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
                Join unions across North America who are using UnionTab to engage members and streamline operations.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link href="/sign-up">
                  <Button
                    size="lg"
                    className="bg-white text-blue-600 hover:bg-gray-50 h-16 px-10 text-lg font-semibold shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105"
                  >
                    Start Free Today
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-transparent border-2 border-white text-white hover:bg-white/10 h-16 px-10 text-lg font-semibold"
                  >
                    View Pricing
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-blue-100 pt-4">
                No credit card required. Free for unions with up to 50 members.
              </p>
              <div className="pt-6 border-t border-white/20 mt-6">
                <p className="text-sm text-blue-100 mb-3">
                  Want a personalized demo?
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 text-white hover:text-blue-200 transition-colors text-sm font-medium"
                >
                  <Video className="h-4 w-4" />
                  Book a Demo
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center">
                <Users className="h-6 w-6 text-blue-400" />
                <span className="ml-2 text-lg font-bold text-white">
                  UnionTab
                </span>
              </div>
              <p className="text-sm">
                Modern tools for labor organizations to engage members and strengthen communities.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/features" className="hover:text-white transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-white transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/blogs" className="hover:text-white transition-colors">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/about" className="hover:text-white transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/privacy" className="hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} UnionTab. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
