'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Mail, MessageSquare, FileText, AlertTriangle, ArrowRight, Check } from 'lucide-react';
import { motion, useInView } from 'framer-motion';

function AnimatedCard({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

const features = [
  {
    icon: Users,
    title: "Member Profiles",
    description: "Keep member information organized and accessible. Track contact details, membership status, and engagement history.",
    benefits: ["Secure member directory", "Custom profile fields", "Membership tracking"],
    gradient: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    icon: Mail,
    title: "Mass Email & Text",
    description: "Reach your entire membership instantly. Send targeted communications to specific groups or blast messages to everyone.",
    benefits: ["Bulk email campaigns", "SMS notifications", "Delivery tracking"],
    gradient: "from-indigo-500 to-indigo-600",
    bgColor: "bg-indigo-50",
  },
  {
    icon: AlertTriangle,
    title: "Grievance Tracking",
    description: "Manage workplace grievances from filing to resolution. Keep detailed records and never let an issue fall through the cracks.",
    benefits: ["Case management", "Status tracking", "Document attachments"],
    gradient: "from-amber-500 to-amber-600",
    bgColor: "bg-amber-50",
  },
  {
    icon: MessageSquare,
    title: "News & Posts",
    description: "Keep members informed with union news, updates, and announcements. Build engagement with a dedicated news feed.",
    benefits: ["Rich text editor", "Photo attachments", "Member comments"],
    gradient: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    icon: FileText,
    title: "File Sharing",
    description: "Securely store and share contracts, bylaws, and important documents. Control access with role-based permissions.",
    benefits: ["Secure cloud storage", "Version history", "Access controls"],
    gradient: "from-emerald-500 to-emerald-600",
    bgColor: "bg-emerald-50",
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navbar */}
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

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4"
        >
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
            Everything Your Union Needs
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Powerful tools designed for union leaders to organize, communicate, and build solidarity.
          </p>
        </motion.div>
      </div>

      {/* Features List */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="space-y-6">
          {features.map((feature, index) => (
            <AnimatedCard key={feature.title} delay={index * 0.1}>
              <Card className="border-2 border-gray-100 hover:border-blue-200 transition-all hover:shadow-lg">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className={`w-14 h-14 ${feature.bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <feature.icon className={`h-7 w-7 text-${feature.gradient.split('-')[1]}-600`} />
                    </div>
                    <div className="flex-1 space-y-3">
                      <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
                      <p className="text-gray-600">{feature.description}</p>
                      <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2">
                        {feature.benefits.map((benefit) => (
                          <div key={benefit} className="flex items-center gap-2 text-sm text-gray-700">
                            <Check className="h-4 w-4 text-green-600" />
                            {benefit}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnimatedCard>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedCard>
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl font-bold text-white">
                Ready to Get Started?
              </h2>
              <p className="text-lg text-blue-100 max-w-xl mx-auto">
                Join unions across the country using UnionTab to organize and communicate.
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
                    className="bg-transparent border-2 border-white text-white hover:bg-white/10 h-12 px-8 text-base font-semibold"
                  >
                    View Pricing
                  </Button>
                </Link>
              </div>
            </div>
          </AnimatedCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center">
                <Users className="h-6 w-6 text-blue-400" />
                <span className="ml-2 text-lg font-bold text-white">UnionTab</span>
              </div>
              <p className="text-sm">
                Empowering unions with modern digital tools.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/blogs" className="hover:text-white transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
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
