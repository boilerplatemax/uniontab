'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Shield, Zap, Globe, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const [unionName, setUnionName] = useState('');
  const [localNumber, setLocalNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
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
              <Link href="/info">
                <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                  For Union Executives
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Centered */}
      <section className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight">
              Find Your
              <span className="text-blue-600"> Union</span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 max-w-xl mx-auto">
              Access your union's member portal
            </p>
          </div>

          {/* Union Finder Form */}
          <Card className="shadow-xl border-2 max-w-md mx-auto">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-800 text-center font-medium">
                      {error}
                    </p>
                  </div>
                )}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      type="text"
                      placeholder="Union Name"
                      value={unionName}
                      onChange={(e) => setUnionName(e.target.value)}
                      className="h-14 text-lg"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Input
                      type="text"
                      placeholder="Local Number (Optional)"
                      value={localNumber}
                      onChange={(e) => setLocalNumber(e.target.value)}
                      className="h-14 text-lg"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700 text-white"
                    size="lg"
                  >
                    {isLoading ? 'Loading...' : 'Go to My Union'}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <p className="text-sm text-gray-500">
            Enter your union name and local number to access your member portal
          </p>
        </div>
      </section>

      {/* Features Section - Scroll Down */}
      <section className="bg-white py-20 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Why UnionTab?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The modern platform for union member engagement
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <Card className="border hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Secure Access
                </h3>
                <p className="text-gray-600 text-sm">
                  Member-only content protected with secure authentication
                </p>
              </CardContent>
            </Card>

            <Card className="border hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Stay Connected
                </h3>
                <p className="text-gray-600 text-sm">
                  Get updates, announcements, and news from your union
                </p>
              </CardContent>
            </Card>

            <Card className="border hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Globe className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Events & Resources
                </h3>
                <p className="text-gray-600 text-sm">
                  Access union events, documents, and important resources
                </p>
              </CardContent>
            </Card>

            <Card className="border hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Easy to Use
                </h3>
                <p className="text-gray-600 text-sm">
                  Simple, intuitive interface designed for members
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Trusted by Unions Nationwide
            </h2>
            <div className="flex justify-center items-center gap-4">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white flex items-center justify-center text-white font-bold text-sm"
                  >
                    {i}
                  </div>
                ))}
              </div>
              <span className="text-lg font-medium text-gray-700">
                100+ unions and growing
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
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
              <h4 className="font-semibold text-white mb-4">For Executives</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/info" className="hover:text-white">
                    Learn More
                  </Link>
                </li>
                <li>
                  <Link href="/sign-up" className="hover:text-white">
                    Create Union Website
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
