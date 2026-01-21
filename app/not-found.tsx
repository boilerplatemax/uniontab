import Link from 'next/link';
import { Users, Home, FileQuestion, ArrowRight, Mail, DollarSign, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
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
              <Link href="/sign-in">
                <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center px-4 py-20 sm:py-32">
        {/* 404 Illustration */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-full blur-3xl scale-150" />
          <div className="relative bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full p-8">
            <FileQuestion className="h-24 w-24 sm:h-32 sm:w-32 text-blue-600" />
          </div>
        </div>

        {/* 404 Text */}
        <h1 className="text-7xl sm:text-9xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
          404
        </h1>

        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-4">
          Page Not Found
        </h2>

        <p className="text-lg text-gray-600 text-center max-w-md mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          <Link href="/">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all h-14 px-8"
            >
              <Home className="h-5 w-5 mr-2" />
              Back to Home
            </Button>
          </Link>
          <Link href="/contact">
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 h-14 px-8"
            >
              <Mail className="h-5 w-5 mr-2" />
              Contact Support
            </Button>
          </Link>
        </div>

        {/* Quick Links */}
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-4">Or explore these pages:</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/features"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              <ArrowRight className="h-4 w-4" />
              Features
            </Link>
            <Link
              href="/pricing"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              <DollarSign className="h-4 w-4" />
              Pricing
            </Link>
            <Link
              href="/blogs"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              <BookOpen className="h-4 w-4" />
              Blog
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Users className="h-6 w-6 text-blue-400" />
            <span className="ml-2 text-lg font-bold text-white">UnionTab</span>
          </div>
          <p className="text-sm">
            Empowering unions with modern digital tools.
          </p>
          <p className="text-xs text-gray-500 mt-4">
            &copy; {new Date().getFullYear()} UnionTab. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
