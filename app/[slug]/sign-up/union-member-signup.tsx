'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { Union } from '@/lib/db/schema';

export function UnionMemberSignUp({
  params,
  union
}: {
  params: Promise<{ slug: string }>;
  union: Union;
}) {
  const { slug } = use(params);
  const unionDisplayName = union.publicName || union.name;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/union/${slug}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sign up');
      }

      // Redirect to union page after successful signup
      router.push(`/${slug}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link
          href={`/${slug}`}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {unionDisplayName}
        </Link>

        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {union.logoUrl ? (
                <img
                  src={union.logoUrl}
                  alt={`${unionDisplayName} logo`}
                  className="h-20 w-20 rounded-full object-cover border-2 border-blue-600"
                />
              ) : (
                <Users className="h-12 w-12 text-blue-600" />
              )}
            </div>
            <CardTitle className="text-2xl">Join {unionDisplayName}</CardTitle>
            <p className="text-gray-600 mt-2">
              Create your member account
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    required
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    required
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="john.doe@example.com"
                />
              </div>

              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Min. 8 characters"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Member Account'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-gray-600">Already a member? </span>
              <Link
                href={`/${slug}/sign-in`}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
