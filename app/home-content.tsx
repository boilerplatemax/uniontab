'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Shield, Zap, ArrowRight, FileText, Calendar, Bell, Vote, Lock, BarChart, MessageSquare, Mail } from 'lucide-react';

// Custom hook for scroll animations
function useScrollAnimation() {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const currentElement = elementRef.current;
    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, []);

  return { elementRef, isVisible };
}

export default function HomePage() {
  const [unionName, setUnionName] = useState('');
  const [localNumber, setLocalNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const featuresAnimation = useScrollAnimation();
  const statsAnimation = useScrollAnimation();
  const ctaAnimation = useScrollAnimation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unionName.trim()) {
      setError('Please enter your union name');
      return;
    }

    setIsLoading(true);
    setError('');

    // Create slug from union name and local number
    const slugParts = [unionName.toLowerCase().trim().replace(/\s+/g, '-')];
    if (localNumber.trim()) {
      slugParts.push(localNumber.toLowerCase().trim().replace(/\s+/g, ''));
    }
    const slug = slugParts.join('').replace(/[^a-z0-9-]/g, '');

    try {
      // Check if union exists before redirecting
      const response = await fetch(`/api/check-union?slug=${encodeURIComponent(slug)}`);
      const data = await response.json();

      if (!response.ok || !data.exists) {
        setError('Union page not found. Please check your union name and local number.');
        setIsLoading(false);
        return;
      }

      // Redirect to the union's page
      window.location.href = `/${slug}`;
    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-on-scroll {
          opacity: 0;
        }

        .animate-on-scroll.visible {
          animation: fadeInUp 0.8s ease-out forwards;
        }

        .stagger-1 { animation-delay: 0.1s; }
        .stagger-2 { animation-delay: 0.2s; }
        .stagger-3 { animation-delay: 0.3s; }
        .stagger-4 { animation-delay: 0.4s; }
        .stagger-5 { animation-delay: 0.5s; }
        .stagger-6 { animation-delay: 0.6s; }
        .stagger-7 { animation-delay: 0.7s; }
        .stagger-8 { animation-delay: 0.8s; }

        .gradient-text {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }
      `}</style>

      {/* Navbar */}
      <nav className="border-b bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center hover:opacity-80 transition-opacity group">
              <div className="relative">
                <Users className="h-8 w-8 text-blue-600 group-hover:scale-110 transition-transform" />
                <div className="absolute inset-0 bg-blue-600 opacity-20 blur-xl group-hover:opacity-30 transition-opacity"></div>
              </div>
              <span className="ml-3 text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                UnionTab
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/info">
                <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 hover:scale-105 transition-all">
                  For Union Executives
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Modern & Engaging */}
      <section className="relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          <div className="text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-sm font-medium text-blue-700">
              <Zap className="h-4 w-4" />
              The Modern Union Platform
            </div>

            {/* Main Heading */}
            <div className="space-y-6">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-tight tracking-tight">
                Your Union,
                <br />
                <span className="gradient-text">Digitally Unified</span>
              </h1>
              <p className="text-xl sm:text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Empower your members with a centralized platform for communication,
                events, documents, and democratic participation.
              </p>
            </div>

            {/* Union Finder Form */}
            <Card className="shadow-2xl border-0 max-w-lg mx-auto bg-white/80 backdrop-blur-sm hover:shadow-3xl transition-shadow duration-300">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Find Your Union</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-shake">
                      <p className="text-sm text-red-800 text-center font-medium">
                        {error}
                      </p>
                    </div>
                  )}
                  <div className="space-y-4">
                    <Input
                      type="text"
                      placeholder="Union Name"
                      value={unionName}
                      onChange={(e) => setUnionName(e.target.value)}
                      className="h-14 text-lg border-2 focus:border-blue-500 rounded-xl"
                      required
                    />

                    <Input
                      type="text"
                      placeholder="Local Number (Optional)"
                      value={localNumber}
                      onChange={(e) => setLocalNumber(e.target.value)}
                      className="h-14 text-lg border-2 focus:border-blue-500 rounded-xl"
                    />

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
                      size="lg"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Loading...
                        </span>
                      ) : (
                        <>
                          Access My Union
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section - Real UnionTab Features with Animations */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-20">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900">
              Everything Your Union Needs
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A complete digital platform built specifically for labor unions and their members
            </p>
          </div>

          <div
            ref={featuresAnimation.elementRef}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {/* Feature 1: Member Portal */}
            <Card className={`feature-card border-0 shadow-lg transition-all duration-300 bg-white animate-on-scroll stagger-1 ${featuresAnimation.isVisible ? 'visible' : ''}`}>
              <CardContent className="p-8 space-y-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Member Portal
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Secure member-only access with approval workflows, role-based permissions, and profile management
                </p>
              </CardContent>
            </Card>

            {/* Feature 2: News & Updates */}
            <Card className={`feature-card border-0 shadow-lg transition-all duration-300 bg-white animate-on-scroll stagger-2 ${featuresAnimation.isVisible ? 'visible' : ''}`}>
              <CardContent className="p-8 space-y-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Bell className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  News & Announcements
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Share updates with popup or banner announcements, post updates with images, and keep members informed
                </p>
              </CardContent>
            </Card>

            {/* Feature 3: Document Management */}
            <Card className={`feature-card border-0 shadow-lg transition-all duration-300 bg-white animate-on-scroll stagger-3 ${featuresAnimation.isVisible ? 'visible' : ''}`}>
              <CardContent className="p-8 space-y-4">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <FileText className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Document Library
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Centralized document storage with categories, search functionality, and privacy controls for sensitive files
                </p>
              </CardContent>
            </Card>

            {/* Feature 4: Event Calendar */}
            <Card className={`feature-card border-0 shadow-lg transition-all duration-300 bg-white animate-on-scroll stagger-4 ${featuresAnimation.isVisible ? 'visible' : ''}`}>
              <CardContent className="p-8 space-y-4">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Calendar className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Event Management
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Organize meetings, rallies, and events with calendar views, location details, and automatic notifications
                </p>
              </CardContent>
            </Card>

            {/* Feature 5: Elections */}
            <Card className={`feature-card border-0 shadow-lg transition-all duration-300 bg-white animate-on-scroll stagger-5 ${featuresAnimation.isVisible ? 'visible' : ''}`}>
              <CardContent className="p-8 space-y-4">
                <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Vote className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Democratic Elections
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Run secure union elections with candidate profiles, voting periods, and real-time results tracking
                </p>
              </CardContent>
            </Card>

            {/* Feature 6: Mass Email */}
            <Card className={`feature-card border-0 shadow-lg transition-all duration-300 bg-white animate-on-scroll stagger-6 ${featuresAnimation.isVisible ? 'visible' : ''}`}>
              <CardContent className="p-8 space-y-4">
                <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Mail className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Mass Communication
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Send bulk emails to all members or specific groups with rich formatting and attachment support
                </p>
              </CardContent>
            </Card>

            {/* Feature 7: Analytics */}
            <Card className={`feature-card border-0 shadow-lg transition-all duration-300 bg-white animate-on-scroll stagger-7 ${featuresAnimation.isVisible ? 'visible' : ''}`}>
              <CardContent className="p-8 space-y-4">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <BarChart className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Dues Tracking
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Track member dues payments, generate reports, and manage financial records with CSV import/export
                </p>
              </CardContent>
            </Card>

            {/* Feature 8: Customization */}
            <Card className={`feature-card border-0 shadow-lg transition-all duration-300 bg-white animate-on-scroll stagger-8 ${featuresAnimation.isVisible ? 'visible' : ''}`}>
              <CardContent className="p-8 space-y-4">
                <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Shield className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Custom Branding
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Upload your union logo, choose from multiple themes, and customize colors to match your brand
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section with Animation */}
      <section className="py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-700 text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full filter blur-3xl"></div>
        </div>

        <div
          ref={statsAnimation.elementRef}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
        >
          <div className="text-center space-y-12">
            <div className={`space-y-4 animate-on-scroll ${statsAnimation.isVisible ? 'visible' : ''}`}>
              <h2 className="text-3xl sm:text-4xl font-extrabold">
                Empowering Union Democracy
              </h2>
              <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                Join the growing movement of unions modernizing their member engagement
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-12">
              <div className={`text-center animate-on-scroll stagger-1 ${statsAnimation.isVisible ? 'visible' : ''}`}>
                <div className="text-5xl font-extrabold mb-2">100%</div>
                <div className="text-blue-100 text-lg">Member Owned</div>
              </div>
              <div className={`text-center animate-on-scroll stagger-2 ${statsAnimation.isVisible ? 'visible' : ''}`}>
                <div className="text-5xl font-extrabold mb-2">24/7</div>
                <div className="text-blue-100 text-lg">Platform Access</div>
              </div>
              <div className={`text-center animate-on-scroll stagger-3 ${statsAnimation.isVisible ? 'visible' : ''}`}>
                <div className="text-5xl font-extrabold mb-2">Unlimited</div>
                <div className="text-blue-100 text-lg">Members & Storage</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section with Animation */}
      <section className="py-20 bg-white">
        <div
          ref={ctaAnimation.elementRef}
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          <div className={`space-y-8 animate-on-scroll ${ctaAnimation.isVisible ? 'visible' : ''}`}>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900">
              Ready to Modernize Your Union?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get started today and bring your union into the digital age with a platform
              built specifically for labor organizations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sign-up">
                <Button size="lg" className="h-14 px-8 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all hover:scale-105">
                  Create Your Union Site
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/info">
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-2 border-blue-600 text-blue-600 hover:bg-blue-50 hover:scale-105 transition-all">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-300 py-16 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="space-y-4 md:col-span-2">
              <div className="flex items-center group">
                <div className="relative">
                  <Users className="h-8 w-8 text-blue-400 group-hover:scale-110 transition-transform" />
                  <div className="absolute inset-0 bg-blue-400 opacity-20 blur-lg group-hover:opacity-30 transition-opacity"></div>
                </div>
                <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  UnionTab
                </span>
              </div>
              <p className="text-gray-400 max-w-md leading-relaxed">
                The modern digital platform built specifically for labor unions.
                Empowering democracy, engagement, and solidarity in the digital age.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4 text-lg">Platform</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/info" className="hover:text-blue-400 transition-colors flex items-center gap-2">
                    <ArrowRight className="h-3 w-3" />
                    Learn More
                  </Link>
                </li>
                <li>
                  <Link href="/sign-up" className="hover:text-blue-400 transition-colors flex items-center gap-2">
                    <ArrowRight className="h-3 w-3" />
                    Create Union Site
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4 text-lg">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/privacy" className="hover:text-blue-400 transition-colors flex items-center gap-2">
                    <ArrowRight className="h-3 w-3" />
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-blue-400 transition-colors flex items-center gap-2">
                    <ArrowRight className="h-3 w-3" />
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/disclaimer" className="hover:text-blue-400 transition-colors flex items-center gap-2">
                    <ArrowRight className="h-3 w-3" />
                    Disclaimer
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-400">
                &copy; {new Date().getFullYear()} UnionTab. All rights reserved.
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Lock className="h-4 w-4" />
                <span>Secure & Encrypted</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
