'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronUp, ChevronDown, Loader2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';

interface MemberLoginDropdownProps {
  slug: string;
  contactEmail?: string | null;
}

export function MemberLoginDropdown({ slug, contactEmail }: MemberLoginDropdownProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/union/${slug}/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, rememberMe })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sign in');
      }

      // Redirect to union page after successful signin
      router.push(`/${slug}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Member Login Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-[#003366] hover:bg-[#002855] text-white px-4 py-2 text-sm font-medium transition-colors"
        aria-expanded={isOpen}
        aria-controls="member-login-panel"
      >
        Member Login
        {isOpen ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          id="member-login-panel"
          className="absolute right-0 top-full mt-0 w-80 bg-white shadow-xl border border-gray-200 z-50"
        >
          <form onSubmit={handleSubmit} className="p-5">
            {/* Email Field */}
            <div className="mb-4">
              <Label htmlFor="dropdown-email" className="text-sm font-medium text-gray-700">
                Email or Username
              </Label>
              <Input
                id="dropdown-email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                placeholder=""
              />
            </div>

            {/* Password Field */}
            <div className="mb-4">
              <Label htmlFor="dropdown-password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <Input
                id="dropdown-password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                placeholder=""
              />
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center gap-2 mb-4">
              <Checkbox
                id="remember-me"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
              />
              <Label htmlFor="remember-me" className="text-sm text-gray-600 cursor-pointer">
                Remember Me
              </Label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Log In Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-gray-900 font-semibold py-2"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Log In'
              )}
            </Button>

            {/* Forgot Password Link */}
            <div className="mt-3 text-center">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                Forgot your password?
              </Link>
            </div>

            {/* Contact Help */}
            {contactEmail && (
              <div className="mt-2 text-center text-sm text-gray-600">
                Having trouble? Contact{' '}
                <a
                  href={`mailto:${contactEmail}`}
                  className="text-blue-600 hover:text-blue-700 hover:underline"
                >
                  {contactEmail}
                </a>
              </div>
            )}
          </form>

          {/* Join Union Section */}
          <div className="border-t border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
            <div className="text-center">
              <p className="text-sm text-gray-700 mb-3">
                Not a member yet?
              </p>
              <Link href={`/${slug}/sign-up`}>
                <Button
                  type="button"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Join the Union
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop to close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
