'use client';

import Link from 'next/link';
import { useActionState, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    <div className="min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Users className="h-12 w-12 text-blue-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
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

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
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
                  className="appearance-none rounded-full relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
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
                    className="appearance-none rounded-full relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
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
                    className="appearance-none rounded-full relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
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
                    className="appearance-none rounded-full relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
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
                    className="appearance-none rounded-full relative block w-full px-3 py-2 border border-gray-300 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm bg-white"
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
                className="appearance-none rounded-full relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
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
                className="appearance-none rounded-full relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
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
                  className="appearance-none rounded-full relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
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
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={pending}
            >
              {pending ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  Loading...
                </>
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
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">
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
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-full shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {mode === 'signin'
                ? 'Create an account'
                : 'Sign in to existing account'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
