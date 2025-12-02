'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Users, Globe, Shield, Zap } from 'lucide-react';

export default function InfoPage() {
  const [unionName, setUnionName] = useState('');
  const [localNumber, setLocalNumber] = useState('');

  const handleGetStarted = () => {
    // Store the union details in session storage for the sign-up flow
    if (unionName || localNumber) {
      sessionStorage.setItem('unionName', unionName);
      sessionStorage.setItem('localNumber', localNumber);
    }
    window.location.href = '/sign-up';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Navbar */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
              <Users className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                UnionTab
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/sign-in">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/sign-up">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Create my website
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Build Your Union's
                <span className="text-blue-600"> Digital Presence</span>
              </h1>
              <p className="text-xl text-gray-600">
                Create a professional website for your union in minutes.
                Engage members, share updates, and strengthen your community.
              </p>
            </div>

            {/* Features */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Quick Setup</h3>
                  <p className="text-sm text-gray-600">
                    Get online in minutes, no technical skills required
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Secure & Private</h3>
                  <p className="text-sm text-gray-600">
                    Member-only content with robust security
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Member Portal</h3>
                  <p className="text-sm text-gray-600">
                    Exclusive content for verified members
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <Globe className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Custom Domain</h3>
                  <p className="text-sm text-gray-600">
                    Professional web address for your union
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Sign Up Form */}
          <div className="lg:pl-8">
            <Card className="shadow-xl border-2">
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Get Started Free
                    </h2>
                    <p className="text-gray-600">
                      Create your union's website today
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="unionName" className="text-gray-700">
                        Union Name *
                      </Label>
                      <Input
                        id="unionName"
                        placeholder="e.g., United Workers"
                        value={unionName}
                        onChange={(e) => setUnionName(e.target.value)}
                        className="h-12 text-base"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="localNumber" className="text-gray-700">
                        Local Number
                      </Label>
                      <Input
                        id="localNumber"
                        placeholder="e.g., Local 123"
                        value={localNumber}
                        onChange={(e) => setLocalNumber(e.target.value)}
                        className="h-12 text-base"
                      />
                      <p className="text-xs text-gray-500">
                        Optional - Add if applicable
                      </p>
                    </div>

                    <Button
                      onClick={handleGetStarted}
                      className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 text-white"
                      size="lg"
                    >
                      Create my website
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>

                    <p className="text-xs text-center text-gray-500">
                      No credit card required. Start your 7-day free trial.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Social Proof */}
            <div className="mt-8 text-center space-y-2">
              <p className="text-sm text-gray-600">
                Trusted by unions across the country
              </p>
              <div className="flex justify-center items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white"
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  Join 100+ unions
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Everything Your Union Needs
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed specifically for labor unions
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Member Management
                </h3>
                <p className="text-gray-600">
                  Manage your membership database, track engagement, and
                  communicate effectively with all members.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Globe className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Custom Pages
                </h3>
                <p className="text-gray-600">
                  Create unlimited custom pages for news, events, resources,
                  and more. Easy content management included.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Members-Only Content
                </h3>
                <p className="text-gray-600">
                  Protect sensitive information with secure, members-only
                  pages accessible only to verified union members.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join unions nationwide in building a stronger digital presence
          </p>
          <Link href="/sign-up">
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 h-14 px-8 text-lg"
            >
              Create your website now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
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
                Empowering unions with modern web solutions
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/pricing" className="hover:text-white">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/sign-up" className="hover:text-white">
                    Get Started
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/about" className="hover:text-white">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/privacy" className="hover:text-white">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2025 UnionTab. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
