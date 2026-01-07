'use client';

import Link from 'next/link';
import { useActionState, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { CircleIcon, Loader2, Users } from 'lucide-react';
import { signIn, signUp } from './actions';
import { ActionState } from '@/lib/auth/middleware';

export function Login({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const priceId = searchParams.get('priceId');
  const inviteId = searchParams.get('inviteId');
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    mode === 'signin' ? signIn : signUp,
    { error: '' }
  );

  // Get union details from session storage if coming from homepage
  const [unionName, setUnionName] = useState('');
  const [localNumber, setLocalNumber] = useState('');
  const [publicName, setPublicName] = useState('');
  const [estimatedMemberCount, setEstimatedMemberCount] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    if (mode === 'signup' && typeof window !== 'undefined') {
      const storedUnionName = sessionStorage.getItem('unionName');
      const storedLocalNumber = sessionStorage.getItem('localNumber');
      if (storedUnionName) {
        setUnionName(storedUnionName);
        sessionStorage.removeItem('unionName');
      }
      if (storedLocalNumber) {
        setLocalNumber(storedLocalNumber);
        sessionStorage.removeItem('localNumber');
      }
    }
  }, [mode]);

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link href="/" className="flex justify-center items-center gap-2 group hover:opacity-80 transition-opacity">
          <div className="relative">
            <Users className="h-10 w-10 text-blue-600 group-hover:scale-110 transition-transform" />
            <div className="absolute inset-0 bg-blue-600 opacity-20 blur-xl group-hover:opacity-30 transition-opacity"></div>
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            UnionTab
          </span>
        </Link>
        <h2 className="mt-8 text-center text-3xl font-extrabold text-gray-900">
          {mode === 'signin'
            ? 'Sign in to your account'
            : 'Create your union website'}
        </h2>
        {mode === 'signup' && (
          <p className="mt-2 text-center text-sm text-gray-600">
            Start your free 7-day trial
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <form
          className="space-y-6"
          action={formAction}
          onSubmit={(e) => {
            if (mode === 'signup' && password !== confirmPassword) {
              e.preventDefault();
              setPasswordError('Passwords do not match');
              return;
            }
            if (mode === 'signup' && !acceptedTerms) {
              e.preventDefault();
              setPasswordError('You must accept the Terms of Service to continue');
              return;
            }
          }}
        >
          <input type="hidden" name="redirect" value={redirect || ''} />
          <input type="hidden" name="priceId" value={priceId || ''} />
          <input type="hidden" name="inviteId" value={inviteId || ''} />

          {mode === 'signup' && (
            <div>
              <Label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Your Name *
              </Label>
              <div className="mt-1">
                <Input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  maxLength={100}
                  className="h-12 text-base border-2 focus:border-blue-500 rounded-xl"
                  placeholder="Enter your full name"
                />
              </div>
            </div>
          )}

          {mode === 'signup' && !inviteId && (
            <>
              <div>
                <Label
                  htmlFor="unionName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Union Name *
                </Label>
                <div className="mt-1">
                  <Input
                    id="unionName"
                    name="unionName"
                    type="text"
                    required
                    maxLength={255}
                    value={unionName}
                    onChange={(e) => {
                      // Remove spaces from union name
                      const value = e.target.value.replace(/\s/g, '');
                      setUnionName(value);
                    }}
                    className="h-12 text-base border-2 focus:border-blue-500 rounded-xl"
                    placeholder="e.g., ATU"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  No spaces allowed. Used for URL generation.
                </p>
              </div>

              <div>
                <Label
                  htmlFor="localNumber"
                  className="block text-sm font-medium text-gray-700"
                >
                  Local Number (optional)
                </Label>
                <div className="mt-1">
                  <Input
                    id="localNumber"
                    name="localNumber"
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={50}
                    value={localNumber}
                    onChange={(e) => {
                      // Remove spaces and non-numeric characters
                      const value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
                      setLocalNumber(value);
                    }}
                    onKeyDown={(e) => {
                      // Prevent space key
                      if (e.key === ' ') {
                        e.preventDefault();
                      }
                    }}
                    className="h-12 text-base border-2 focus:border-blue-500 rounded-xl"
                    placeholder="e.g., 123"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Numbers only. Your page URL will be: {unionName.toLowerCase().replace(/[^a-z0-9]+/g, '')}{localNumber ? localNumber.toLowerCase().replace(/[^a-z0-9]+/g, '') : ''}
                </p>
              </div>

              <div>
                <Label
                  htmlFor="publicName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Public Display Name (optional)
                </Label>
                <div className="mt-1">
                  <Input
                    id="publicName"
                    name="publicName"
                    type="text"
                    maxLength={255}
                    value={publicName}
                    onChange={(e) => setPublicName(e.target.value)}
                    className="h-12 text-base border-2 focus:border-blue-500 rounded-xl"
                    placeholder="e.g., Barrie Transit Union"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Friendly name shown on your public page. Does not affect your URL.
                </p>
              </div>

              <div>
                <Label
                  htmlFor="estimatedMemberCount"
                  className="block text-sm font-medium text-gray-700"
                >
                  Estimated Number of Members
                </Label>
                <div className="mt-1">
                  <select
                    id="estimatedMemberCount"
                    name="estimatedMemberCount"
                    value={estimatedMemberCount}
                    onChange={(e) => setEstimatedMemberCount(e.target.value)}
                    className="h-12 w-full text-base border-2 focus:border-blue-500 rounded-xl bg-white px-3"
                  >
                    <option value="">Select a range...</option>
                    <option value="1-50">1-50 members</option>
                    <option value="51-100">51-100 members</option>
                    <option value="101-250">101-250 members</option>
                    <option value="251-500">251-500 members</option>
                    <option value="501-1000">501-1,000 members</option>
                    <option value="1001-5000">1,001-5,000 members</option>
                    <option value="5001+">5,001+ members</option>
                  </select>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Approximate size of your union (helps us understand your needs).
                </p>
              </div>
            </>
          )}

          <div>
            <Label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </Label>
            <div className="mt-1">
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={state.email}
                required
                maxLength={50}
                className="h-12 text-base border-2 focus:border-blue-500 rounded-xl"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </Label>
              {mode === 'signin' && (
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Forgot password?
                </Link>
              )}
            </div>
            <div className="mt-1">
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={
                  mode === 'signin' ? 'current-password' : 'new-password'
                }
                value={mode === 'signup' ? password : undefined}
                defaultValue={mode === 'signin' ? state.password : undefined}
                onChange={mode === 'signup' ? (e) => {
                  setPassword(e.target.value);
                  setPasswordError('');
                } : undefined}
                required
                minLength={8}
                maxLength={100}
                className="h-12 text-base border-2 focus:border-blue-500 rounded-xl"
                placeholder="Enter your password"
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <Label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirm Password
              </Label>
              <div className="mt-1">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPasswordError('');
                  }}
                  required
                  minLength={8}
                  maxLength={100}
                  className="h-12 text-base border-2 focus:border-blue-500 rounded-xl"
                  placeholder="Confirm your password"
                />
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="acceptTerms"
                  name="acceptTerms"
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => {
                    setAcceptedTerms(e.target.checked);
                    setPasswordError('');
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  required
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="acceptTerms" className="text-gray-700">
                  I have read and agree to the{' '}
                  <Link
                    href="/terms"
                    target="_blank"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Terms of Service
                  </Link>
                  {' '}and{' '}
                  <Link
                    href="/privacy"
                    target="_blank"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Privacy Policy
                  </Link>
                </label>
              </div>
            </div>
          )}

          {passwordError && (
            <div className="text-red-500 text-sm">{passwordError}</div>
          )}

          {state?.error && (
            <div className="text-red-500 text-sm">{state.error}</div>
          )}

          <div>
            <Button
              type="submit"
              className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
              disabled={pending}
            >
              {pending ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Loading...
                </span>
              ) : mode === 'signin' ? (
                'Sign in'
              ) : (
                'Create my website'
              )}
            </Button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white/80 text-gray-500">
                {mode === 'signin'
                  ? 'New to our platform?'
                  : 'Already have an account?'}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <Link
              href={`${mode === 'signin' ? '/sign-up' : '/sign-in'}${
                redirect ? `?redirect=${redirect}` : ''
              }${priceId ? `&priceId=${priceId}` : ''}`}
              className="w-full flex justify-center h-12 items-center border-2 border-gray-200 rounded-xl text-base font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-blue-300 transition-all"
            >
              {mode === 'signin'
                ? 'Create an account'
                : 'Sign in to existing account'}
            </Link>
          </div>
        </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
