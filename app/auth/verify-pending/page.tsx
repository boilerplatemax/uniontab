'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, RefreshCw, CheckCircle } from 'lucide-react';

export default function VerifyPendingPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    // Get user's email from session
    const fetchUserEmail = async () => {
      try {
        const response = await fetch('/api/user');
        if (response.ok) {
          const data = await response.json();
          setEmail(data.email);

          // If already verified, redirect to onboarding
          if (data.emailVerified) {
            router.push('/onboarding');
          }
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };

    fetchUserEmail();
  }, [router]);

  const handleResend = async () => {
    if (!email) return;

    setResending(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setResent(true);
        setTimeout(() => setResent(false), 5000);
      }
    } catch (error) {
      console.error('Failed to resend email:', error);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Verify Your Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Almost there!</strong> We've sent a verification email to:
            </p>
            <p className="text-sm text-blue-900 font-semibold mt-2 break-all">
              {email || 'your email address'}
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-gray-600 text-sm">
              Please check your email and click the verification link to activate your account.
            </p>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Check your spam/junk folder if you don't see it</li>
              <li>The link will expire in 24 hours</li>
              <li>You must verify your email to access your union website</li>
            </ul>
          </div>

          {resent && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <p className="text-sm text-green-900">
                Verification email resent successfully!
              </p>
            </div>
          )}

          <div className="pt-4 space-y-3">
            <Button
              onClick={handleResend}
              variant="outline"
              className="w-full"
              disabled={resending || !email}
            >
              {resending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Resending...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Resend Verification Email
                </>
              )}
            </Button>

            <Link href="/sign-in">
              <Button variant="ghost" className="w-full">
                Back to Login
              </Button>
            </Link>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-center text-gray-500">
              Having trouble? Contact us at support@uniontab.com
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
