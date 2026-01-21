'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Users, Mail, MessageCircle, Clock, Send, CheckCircle2 } from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { PublicNavbar } from '@/components/public-navbar';

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

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    role: 'member' as 'executive' | 'member',
    unionName: '',
    localNumber: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        message: '',
        role: 'member',
        unionName: '',
        localNumber: '',
      });
    } catch (error) {
      console.error('Error submitting contact form:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <PublicNavbar />

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Get in Touch
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Have questions about UnionTab? Our team is ready to help.
          </p>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Contact Info Cards */}
          <div className="lg:col-span-1 space-y-6">
            <AnimatedSection>
              <Card className="border-2 border-blue-100 hover:border-blue-300 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-blue-50/30">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Mail className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Email Us</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Send us an email anytime
                    </p>
                    <a href="mailto:info@uniontab.com" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                      info@uniontab.com
                    </a>
                  </div>
                </CardContent>
              </Card>
            </AnimatedSection>

            <AnimatedSection delay={0.1}>
              <Card className="border-2 border-purple-100 hover:border-purple-300 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-purple-50/30">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Response Time</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      We typically respond within
                    </p>
                    <p className="text-sm text-gray-900 font-medium">
                      24 hours on business days
                    </p>
                  </div>
                </CardContent>
              </Card>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <Card className="border-2 border-indigo-100 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-indigo-50/30">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <MessageCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Schedule a Demo</h3>
                    <p className="text-sm text-gray-600">
                      Mention it in your message and we'll schedule a personalized demo for your union
                    </p>
                  </div>
                </CardContent>
              </Card>
            </AnimatedSection>
          </div>

          {/* Right Column - Contact Form */}
          <div className="lg:col-span-2">
            <AnimatedSection delay={0.2}>
              <Card className="border-2 border-blue-100 shadow-2xl bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8">
                  <div className="mb-6">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                      Send Us a Message
                    </h2>
                    <p className="text-gray-600">
                      Fill out the form below and we'll get back to you within 24 hours.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                      {/* Name */}
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-gray-700 font-semibold">
                          Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="name"
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="h-12 border-2 focus:border-blue-500 transition-colors"
                          placeholder="John Smith"
                        />
                      </div>

                      {/* Email */}
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-gray-700 font-semibold">
                          Email <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="h-12 border-2 focus:border-blue-500 transition-colors"
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                      {/* Role */}
                      <div className="space-y-2">
                        <Label htmlFor="role" className="text-gray-700 font-semibold">
                          Role <span className="text-red-500">*</span>
                        </Label>
                        <select
                          id="role"
                          required
                          value={formData.role}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value as 'executive' | 'member' })}
                          className="w-full h-12 px-3 py-2 border-2 border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                          <option value="member">Member</option>
                          <option value="executive">Executive</option>
                        </select>
                      </div>

                      {/* Union Name */}
                      <div className="space-y-2">
                        <Label htmlFor="unionName" className="text-gray-700 font-semibold">
                          Union Name (Optional)
                        </Label>
                        <Input
                          id="unionName"
                          type="text"
                          value={formData.unionName}
                          onChange={(e) => setFormData({ ...formData, unionName: e.target.value })}
                          className="h-12 border-2 focus:border-blue-500 transition-colors"
                          placeholder="e.g., IBEW"
                        />
                      </div>
                    </div>

                    {/* Local Number */}
                    <div className="space-y-2">
                      <Label htmlFor="localNumber" className="text-gray-700 font-semibold">
                        Local Number (Optional)
                      </Label>
                      <Input
                        id="localNumber"
                        type="text"
                        value={formData.localNumber}
                        onChange={(e) => setFormData({ ...formData, localNumber: e.target.value })}
                        className="h-12 border-2 focus:border-blue-500 transition-colors"
                        placeholder="e.g., 123"
                      />
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-gray-700 font-semibold">
                        Message <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="message"
                        required
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="min-h-[150px] border-2 focus:border-blue-500 transition-colors"
                        rows={6}
                        placeholder="Tell us how we can help you..."
                      />
                    </div>

                    {/* Submit Button */}
                    <div>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <span className="flex items-center gap-2">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                            />
                            Sending...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Send className="h-5 w-5" />
                            Send Message
                          </span>
                        )}
                      </Button>
                    </div>

                    {/* Success/Error Messages */}
                    {submitStatus === 'success' && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-green-50 border-2 border-green-200 rounded-lg flex items-start gap-3"
                      >
                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-green-800 font-semibold">Message sent successfully!</p>
                          <p className="text-green-700 text-sm mt-1">
                            Thank you for reaching out. We'll get back to you within 24 hours.
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {submitStatus === 'error' && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-red-50 border-2 border-red-200 rounded-lg"
                      >
                        <p className="text-red-800 font-semibold">
                          Oops! Something went wrong.
                        </p>
                        <p className="text-red-700 text-sm mt-1">
                          Please try again or email us directly at info@uniontab.com
                        </p>
                      </motion.div>
                    )}
                  </form>
                </CardContent>
              </Card>
            </AnimatedSection>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <AnimatedSection>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Quick Questions?
            </h2>
            <p className="text-xl text-gray-600">
              Here are some answers to common questions
            </p>
          </div>
        </AnimatedSection>

        <div className="grid sm:grid-cols-2 gap-6">
          <AnimatedSection delay={0.1}>
            <Card className="border-2 border-gray-100 hover:border-blue-200 transition-all duration-300 h-full">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  How quickly will I hear back?
                </h3>
                <p className="text-gray-600 text-sm">
                  We typically respond within 24 hours during business days. For urgent matters, please call us directly.
                </p>
              </CardContent>
            </Card>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <Card className="border-2 border-gray-100 hover:border-blue-200 transition-all duration-300 h-full">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Do you offer demos?
                </h3>
                <p className="text-gray-600 text-sm">
                  Yes! We offer personalized demos for union executives. Just mention it in your message and we'll schedule a time.
                </p>
              </CardContent>
            </Card>
          </AnimatedSection>

          <AnimatedSection delay={0.3}>
            <Card className="border-2 border-gray-100 hover:border-blue-200 transition-all duration-300 h-full">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Can you help with migration?
                </h3>
                <p className="text-gray-600 text-sm">
                  Absolutely! Our team can help you migrate from your existing platform. Contact us to discuss your specific needs.
                </p>
              </CardContent>
            </Card>
          </AnimatedSection>

          <AnimatedSection delay={0.4}>
            <Card className="border-2 border-gray-100 hover:border-blue-200 transition-all duration-300 h-full">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  What about technical support?
                </h3>
                <p className="text-gray-600 text-sm">
                  All plans include email support. Paid plans get priority support with faster response times and phone support.
                </p>
              </CardContent>
            </Card>
          </AnimatedSection>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 mt-16">
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
