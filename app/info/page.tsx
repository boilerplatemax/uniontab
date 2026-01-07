'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Users, Globe, Shield, Zap, Mail, MessageSquare, Vote, Database, BarChart3, Bell, Calendar, Lock } from 'lucide-react';
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

export default function InfoPage() {
  const [unionName, setUnionName] = useState('');
  const [localNumber, setLocalNumber] = useState('');
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  const handleGetStarted = () => {
    // Store the union details in session storage for the sign-up flow
    if (unionName || localNumber) {
      sessionStorage.setItem('unionName', unionName);
      sessionStorage.setItem('localNumber', localNumber);
    }
    window.location.href = '/sign-up';
  };

  // Floating animation for hero elements
  const [floatOffset, setFloatOffset] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setFloatOffset((prev) => (prev + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

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
              <Link href="/blogs">
                <Button variant="ghost" className="text-gray-700 hover:text-blue-600">
                  Blog
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="ghost" className="text-gray-700 hover:text-blue-600">
                  Pricing
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button variant="ghost" className="text-gray-700 hover:text-blue-600">
                  Sign In
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
                <div className="inline-block">
                  <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold inline-flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Built for Union Executives
                  </div>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Empower Your Union with
                  <span className="block mt-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Modern Digital Tools
                  </span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  The all-in-one platform that helps union leaders communicate with members, manage elections, and strengthen solidarity—all in one beautiful, secure place.
                </p>
              </motion.div>

              {/* Key Stats */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="grid grid-cols-3 gap-6 pt-4"
              >
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">100+</div>
                  <div className="text-sm text-gray-600 mt-1">Active Unions</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-600">50K+</div>
                  <div className="text-sm text-gray-600 mt-1">Members</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">99.9%</div>
                  <div className="text-sm text-gray-600 mt-1">Uptime</div>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Enhanced CTA Card */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="lg:pl-8"
            >
              <Card className="shadow-2xl border-2 border-blue-100 bg-white/80 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />
                <CardContent className="p-8 relative">
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-lg">
                        <Users className="h-8 w-8 text-white" />
                      </div>
                      <h2 className="text-3xl font-bold text-gray-900">
                        Start Free Today
                      </h2>
                      <p className="text-gray-600">
                        Join union executives who trust UnionTab
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="unionName" className="text-gray-700 font-semibold">
                          Union Name *
                        </Label>
                        <Input
                          id="unionName"
                          placeholder="e.g., United Workers of America"
                          value={unionName}
                          onChange={(e) => setUnionName(e.target.value)}
                          className="h-12 text-base border-2 focus:border-blue-500 transition-colors"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="localNumber" className="text-gray-700 font-semibold">
                          Local Number
                        </Label>
                        <Input
                          id="localNumber"
                          placeholder="e.g., Local 123"
                          value={localNumber}
                          onChange={(e) => setLocalNumber(e.target.value)}
                          className="h-12 text-base border-2 focus:border-blue-500 transition-colors"
                        />
                        <p className="text-xs text-gray-500">
                          Optional - Add if applicable
                        </p>
                      </div>

                      <Button
                        onClick={handleGetStarted}
                        className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
                        size="lg"
                      >
                        Start Building Your Site
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>

                      <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                        <Shield className="h-4 w-4 text-green-600" />
                        <span>Free forever · No credit card required</span>
                      </div>
                    </div>

                    {/* Trust indicators */}
                    <div className="pt-6 border-t space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Zap className="h-4 w-4 text-blue-600" />
                        <span>Setup in under 5 minutes</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Lock className="h-4 w-4 text-blue-600" />
                        <span>Bank-level security & encryption</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span>Dedicated support for executives</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>

        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl -z-10" />
      </section>

      {/* Features Showcase Section */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900">
                Everything You Need to Lead
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Powerful tools designed specifically for union executives to engage members, run elections, and build stronger communities.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 - Member Communications */}
            <AnimatedSection delay={0.1}>
              <Card className="border-2 hover:border-blue-300 hover:shadow-2xl transition-all duration-300 h-full group cursor-pointer bg-gradient-to-br from-white to-blue-50/30">
                <CardContent className="p-8 space-y-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <Mail className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Mass Communications
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Send email and SMS updates to your entire membership or specific groups. Keep everyone informed with professional newsletters and urgent alerts.
                  </p>
                  <ul className="space-y-2 pt-2">
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                      Bulk email & SMS messaging
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                      Customizable templates
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                      Delivery tracking & analytics
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </AnimatedSection>

            {/* Feature 2 - Elections & Voting */}
            <AnimatedSection delay={0.2}>
              <Card className="border-2 hover:border-indigo-300 hover:shadow-2xl transition-all duration-300 h-full group cursor-pointer bg-gradient-to-br from-white to-indigo-50/30">
                <CardContent className="p-8 space-y-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <Vote className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Secure Elections
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Run democratic elections with confidence. Our secure voting platform ensures transparency and integrity for all union decisions.
                  </p>
                  <ul className="space-y-2 pt-2">
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                      Anonymous & verifiable voting
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                      Real-time results tracking
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                      Audit trails & compliance
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </AnimatedSection>

            {/* Feature 3 - Member Portal */}
            <AnimatedSection delay={0.3}>
              <Card className="border-2 hover:border-purple-300 hover:shadow-2xl transition-all duration-300 h-full group cursor-pointer bg-gradient-to-br from-white to-purple-50/30">
                <CardContent className="p-8 space-y-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <Users className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Member Portal
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Give your members a secure space to access union resources, view their benefits, and stay connected with leadership.
                  </p>
                  <ul className="space-y-2 pt-2">
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                      Secure member authentication
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                      Document library & resources
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                      Personal member dashboard
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </AnimatedSection>

            {/* Feature 4 - Event Management */}
            <AnimatedSection delay={0.4}>
              <Card className="border-2 hover:border-pink-300 hover:shadow-2xl transition-all duration-300 h-full group cursor-pointer bg-gradient-to-br from-white to-pink-50/30">
                <CardContent className="p-8 space-y-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <Calendar className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Event Management
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Plan meetings, rallies, and events with built-in RSVP tracking and automated reminders for all your union activities.
                  </p>
                  <ul className="space-y-2 pt-2">
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 bg-pink-600 rounded-full" />
                      Event calendar & RSVP
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 bg-pink-600 rounded-full" />
                      Automated reminders
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 bg-pink-600 rounded-full" />
                      Attendance tracking
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </AnimatedSection>

            {/* Feature 5 - Analytics */}
            <AnimatedSection delay={0.5}>
              <Card className="border-2 hover:border-cyan-300 hover:shadow-2xl transition-all duration-300 h-full group cursor-pointer bg-gradient-to-br from-white to-cyan-50/30">
                <CardContent className="p-8 space-y-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <BarChart3 className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Analytics & Insights
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Make data-driven decisions with comprehensive analytics on member engagement, event attendance, and communication effectiveness.
                  </p>
                  <ul className="space-y-2 pt-2">
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 bg-cyan-600 rounded-full" />
                      Engagement metrics
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 bg-cyan-600 rounded-full" />
                      Custom reports & exports
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 bg-cyan-600 rounded-full" />
                      Trend analysis
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </AnimatedSection>

            {/* Feature 6 - Secure Storage */}
            <AnimatedSection delay={0.6}>
              <Card className="border-2 hover:border-emerald-300 hover:shadow-2xl transition-all duration-300 h-full group cursor-pointer bg-gradient-to-br from-white to-emerald-50/30">
                <CardContent className="p-8 space-y-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <Database className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Secure Document Storage
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Store contracts, bylaws, and important documents in a secure, organized system. Control who can access what with granular permissions.
                  </p>
                  <ul className="space-y-2 pt-2">
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                      Encrypted cloud storage
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                      Version control & history
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                      Permission management
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Social Proof / Testimonials Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900">
                Trusted by Union Leaders
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                See what executives are saying about UnionTab
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8">
            <AnimatedSection delay={0.1}>
              <Card className="border-2 h-full bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
                <CardContent className="p-8 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full" />
                    <div>
                      <div className="font-semibold text-gray-900">Sarah Mitchell</div>
                      <div className="text-sm text-gray-600">President, Local 247</div>
                    </div>
                  </div>
                  <p className="text-gray-700 italic leading-relaxed">
                    "UnionTab transformed how we communicate with our 2,000+ members. The SMS alerts during our strike were invaluable."
                  </p>
                </CardContent>
              </Card>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <Card className="border-2 h-full bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
                <CardContent className="p-8 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full" />
                    <div>
                      <div className="font-semibold text-gray-900">Marcus Chen</div>
                      <div className="text-sm text-gray-600">Secretary-Treasurer, Local 89</div>
                    </div>
                  </div>
                  <p className="text-gray-700 italic leading-relaxed">
                    "Running elections used to be a nightmare. Now it takes minutes to set up and members love the transparency."
                  </p>
                </CardContent>
              </Card>
            </AnimatedSection>

            <AnimatedSection delay={0.3}>
              <Card className="border-2 h-full bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
                <CardContent className="p-8 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full" />
                    <div>
                      <div className="font-semibold text-gray-900">Diana Rodriguez</div>
                      <div className="text-sm text-gray-600">Vice President, Local 156</div>
                    </div>
                  </div>
                  <p className="text-gray-700 italic leading-relaxed">
                    "The member portal has increased engagement by 300%. Our members finally have easy access to their benefits and documents."
                  </p>
                </CardContent>
              </Card>
            </AnimatedSection>
          </div>
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
                Ready to Empower Your Union?
              </h2>
              <p className="text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
                Join hundreds of union executives who are building stronger, more connected communities with UnionTab.
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
                ✓ Free forever plan available &nbsp;·&nbsp; ✓ No credit card required &nbsp;·&nbsp; ✓ Setup in 5 minutes
              </p>
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
                Empowering unions with modern digital tools to build stronger, more connected communities.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
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
                <li>
                  <Link href="/sign-up" className="hover:text-white transition-colors">
                    Get Started
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
            <p>&copy; 2026 UnionTab. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
