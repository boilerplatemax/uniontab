'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUpload } from '@/components/ui/file-upload';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Globe,
  Loader2,
  Save,
} from 'lucide-react';
import useSWR from 'swr';
import { UnionDataWithMembers } from '@/lib/db/schema';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function UnionSettingsPage() {
  const router = useRouter();
  const { data: union, mutate } = useSWR<UnionDataWithMembers>('/api/team', fetcher);

  const [formData, setFormData] = useState({
    publicName: '',
    logoUrl: '',
    coverPhotoUrl: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    description: '',
    about: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (union) {
      setFormData({
        publicName: union.publicName || '',
        logoUrl: union.logoUrl || '',
        coverPhotoUrl: union.coverPhotoUrl || '',
        email: union.email || '',
        phone: union.phone || '',
        address: union.address || '',
        website: union.website || '',
        description: union.description || '',
        about: union.about || ''
      });
    }
  }, [union]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/union/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update union info');
      }

      await mutate();
      setSuccess(true);
      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
      // Scroll to top to show error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  if (!union) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push(`/${union.slug}`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Union Page
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">
            Edit Union Information
          </h1>
          <p className="mt-2 text-gray-600">
            Update your union's public profile and contact information
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sticky Save Button */}
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 py-4 mb-6">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                {error && (
                  <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm">
                    Successfully updated union information!
                  </div>
                )}
              </div>
              <div className="flex gap-3 ml-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/${union.slug}`)}
                  disabled={loading}
                  size="sm"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-700 p-4 rounded-lg">
              Successfully updated union information!
            </div>
          )}

          {/* Basic Information */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="publicName">
                  Public Display Name
                </Label>
                <Input
                  id="publicName"
                  placeholder="e.g., Barrie Transit Union"
                  value={formData.publicName}
                  onChange={(e) =>
                    setFormData({ ...formData, publicName: e.target.value })
                  }
                  maxLength={255}
                />
                <p className="text-sm text-gray-500 mt-1">
                  This is the friendly name shown on your public page. Leave blank to use "{union.name}" instead.
                </p>
              </div>

              <div>
                <Label htmlFor="description">
                  Short Description (One-liner)
                </Label>
                <Input
                  id="description"
                  placeholder="A brief description of your union..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  maxLength={200}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.description.length}/200 characters
                </p>
              </div>

              <div>
                <Label htmlFor="about">About Your Union</Label>
                <Textarea
                  id="about"
                  placeholder="Tell visitors about your union's history, mission, and values..."
                  value={formData.about}
                  onChange={(e) =>
                    setFormData({ ...formData, about: e.target.value })
                  }
                  rows={8}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Share your union's story, accomplishments, and goals
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Branding */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>Branding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FileUpload
                onFileSelect={(file, url) => {
                  if (url) {
                    setFormData({ ...formData, logoUrl: url });
                  }
                }}
                accept="image/*"
                maxSize={5}
                currentUrl={formData.logoUrl}
                label="Logo Image"
                hint="Click to browse or drag and drop your logo"
                bucket="union-files"
                path="logos"
              />
              <p className="text-sm text-gray-500">
                Recommended: Square image (e.g., 400x400 pixels)
              </p>

              <FileUpload
                onFileSelect={(file, url) => {
                  if (url) {
                    setFormData({ ...formData, coverPhotoUrl: url });
                  }
                }}
                accept="image/*"
                maxSize={10}
                currentUrl={formData.coverPhotoUrl}
                label="Cover Photo"
                hint="Click to browse or drag and drop your cover image"
                bucket="union-files"
                path="covers"
              />
              <p className="text-sm text-gray-500">
                Recommended size: 1200x400 pixels or wider
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="contact@union.org"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address
                </Label>
                <Textarea
                  id="address"
                  placeholder="123 Union St, City, State 12345"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="website" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Website
                </Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://www.union.org"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/${union.slug}`)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
