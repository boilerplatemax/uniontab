'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Check, XCircle, Mail } from 'lucide-react';

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Invalid verification link');
      setLoading(false);
      return;
    }

    // Verify email automatically on page load
    const verifyEmail = async () => {
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to verify email');
        }

        setSuccess(true);

        // Redirect to sign-in after 3 seconds
        setTimeout(() => {
          router.push('/sign-in');
        }, 3000);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [token, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
            </div>
            <CardTitle className="text-2xl">Verifying Your Email...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600">
              Please wait while we verify your email address.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Email Verified Successfully!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-gray-600">
              Your email has been verified. You can now access all features of UnionTab.
            </p>
            <p className="text-center text-sm text-gray-500">
              Redirecting to login page...
            </p>
            <div className="pt-4">
              <Link href="/sign-in">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Go to Login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Verification Failed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm text-center">
            {error}
          </div>
          <p className="text-center text-gray-600">
            The verification link may have expired or is invalid.
          </p>
          <div className="pt-4 space-y-3">
            <Link href="/auth/resend-verification">
              <Button variant="outline" className="w-full">
                <Mail className="mr-2 h-4 w-4" />
                Resend Verification Email
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Back to Login
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
}
