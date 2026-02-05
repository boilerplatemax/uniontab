import Link from 'next/link';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PublicNavbar } from '@/components/public-navbar';
import { PublicFooter } from '@/components/public-footer';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col">
      <PublicNavbar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <p className="text-5xl font-bold text-gray-300 mb-4">404</p>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-3">
          We can&apos;t find that page
        </h1>

        <p className="text-gray-600 text-center max-w-md mb-8">
          The page you&apos;re looking for may have been moved or no longer exists.
          Let&apos;s get you back on track.
        </p>

        <Link href="/">
          <Button
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all h-12 px-8"
          >
            <Home className="h-5 w-5 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>

      <PublicFooter />
    </div>
  );
}
