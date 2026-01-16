'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUpload } from '@/components/ui/file-upload';
import {
  Mail,
  Phone,
  MapPin,
  Globe,
  Loader2,
  Save,
  Palette,
  Check,
  Share2,
  ArrowLeft,
} from 'lucide-react';
import useSWR from 'swr';
import { UnionDataWithMembers } from '@/lib/db/schema';
import { themeOptions } from '@/lib/themes/config';

// Social media platform config
const socialPlatforms = [
  { id: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourpage' },
  { id: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourhandle' },
  { id: 'twitter', label: 'X (Twitter)', placeholder: 'https://x.com/yourhandle' },
  { id: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/yourpage' },
  { id: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@yourchannel' },
  { id: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@yourhandle' },
] as const;

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Calculate contrast color (black or white) based on background color for accessibility
function getContrastColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace('#', '');

  // Parse RGB values
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate relative luminance using WCAG formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return black for light backgrounds, white for dark backgrounds
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

export function SettingsContent() {
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
    about: '',
    aboutImages: [] as string[],
    theme: 'default',
    themeColor: '#2563eb',
    socialLinks: {} as Record<string, string>,
    showSocialInHero: false,
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
        about: union.about || '',
        aboutImages: (union as any).aboutImages || [],
        theme: union.theme || 'default',
        themeColor: union.themeColor || '#2563eb',
        socialLinks: (union as any).socialLinks || {},
        showSocialInHero: (union as any).showSocialInHero || false,
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
      // Refresh the router cache to ensure updated data is shown when navigating
      router.refresh();

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
          <h1 className="text-3xl font-bold text-gray-900">
            Edit Union Information
          </h1>
          <p className="mt-2 text-gray-600">
            Update your union's public profile and contact information
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sticky Header */}
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 py-4 mb-6">
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => router.push(`/${union.slug}`)}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                <span>return</span>
              </button>
              <div className="flex items-center gap-4">
                {error && (
                  <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm">
                    Saved!
                  </div>
                )}
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
                      Save
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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

            </CardContent>
          </Card>

          {/* Social Media Links */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Social Media Links
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500">
                Add your social media profiles to display in the footer and contact page
              </p>

              <div className="space-y-4">
                {socialPlatforms.map((platform) => (
                  <div key={platform.id}>
                    <Label htmlFor={`social-${platform.id}`}>{platform.label}</Label>
                    <Input
                      id={`social-${platform.id}`}
                      type="url"
                      placeholder={platform.placeholder}
                      value={formData.socialLinks[platform.id] || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          socialLinks: {
                            ...formData.socialLinks,
                            [platform.id]: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                ))}
              </div>

              {/* Show in Hero Toggle */}
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="showSocialInHero" className="text-base font-medium">
                      Show in Hero Section
                    </Label>
                    <p className="text-sm text-gray-500 mt-1">
                      Display social icons prominently in your homepage hero area
                    </p>
                  </div>
                  <button
                    type="button"
                    id="showSocialInHero"
                    role="switch"
                    aria-checked={formData.showSocialInHero}
                    onClick={() =>
                      setFormData({
                        ...formData,
                        showSocialInHero: !formData.showSocialInHero,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      formData.showSocialInHero ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        formData.showSocialInHero ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Social icons always appear in the footer. This option adds them to the hero section as well.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Theme Selection */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Theme
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="theme">Homepage Theme</Label>
                <p className="text-sm text-gray-500 mb-4">
                  Choose how your union's homepage and tabs are displayed to visitors
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {themeOptions.map((theme) => (
                    <div
                      key={theme.id}
                      onClick={() => setFormData({ ...formData, theme: theme.id })}
                      className={`relative cursor-pointer group rounded-lg overflow-hidden border-2 transition-all ${
                        formData.theme === theme.id
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      {/* Thumbnail Image */}
                      <div className="relative aspect-[4/3] bg-gray-100">
                        <Image
                          src={`/assets/themes/${theme.id}.svg`}
                          alt={`${theme.name} theme preview`}
                          fill
                          className="object-cover"
                        />
                        {/* Selected Badge */}
                        {formData.theme === theme.id && (
                          <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1.5">
                            <Check className="h-4 w-4" />
                          </div>
                        )}
                      </div>

                      {/* Theme Info */}
                      <div className={`p-4 ${
                        formData.theme === theme.id
                          ? 'bg-blue-50 border-t-2 border-blue-500'
                          : 'bg-white border-t-2 border-gray-100'
                      }`}>
                        <h3 className={`font-semibold mb-1 ${
                          formData.theme === theme.id
                            ? 'text-blue-900'
                            : 'text-gray-900'
                        }`}>
                          {theme.name}
                        </h3>
                        <p className={`text-sm ${
                          formData.theme === theme.id
                            ? 'text-blue-700'
                            : 'text-gray-600'
                        }`}>
                          {theme.description}
                        </p>
                      </div>

                      {/* Hidden radio input for form */}
                      <input
                        type="radio"
                        name="theme"
                        value={theme.id}
                        checked={formData.theme === theme.id}
                        onChange={() => {}}
                        className="sr-only"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Theme Color Picker */}
              <div className="border-t pt-6 mt-6">
                <Label htmlFor="themeColor">Brand Color</Label>
                <p className="text-sm text-gray-500 mb-4">
                  Choose a custom brand color for banners, posters, and email headers
                </p>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <input
                      type="color"
                      id="themeColor"
                      value={formData.themeColor}
                      onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })}
                      className="w-16 h-16 rounded-lg cursor-pointer border-2 border-gray-200 hover:border-blue-300 transition-colors"
                      style={{ padding: '2px' }}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Input
                        type="text"
                        value={formData.themeColor}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                            setFormData({ ...formData, themeColor: value });
                          }
                        }}
                        placeholder="#2563eb"
                        className="w-28 font-mono"
                        maxLength={7}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData({ ...formData, themeColor: '#2563eb' })}
                      >
                        Reset to Default
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500">Color preview:</span>
                      <div
                        className="h-8 rounded"
                        style={{
                          backgroundColor: formData.themeColor,
                        }}
                      />
                    </div>
                  </div>
                </div>
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
                  } else if (file === null) {
                    // Handle removal
                    setFormData({ ...formData, logoUrl: '' });
                  }
                }}
                accept="image/*"
                maxSize={5}
                currentUrl={formData.logoUrl}
                label="Logo Image"
                hint="Click to browse or drag and drop your logo"
                bucket="union-files"
                path="logos"
                recommendedDimensions={{ width: 400, height: 400 }}
                autoResize={true}
              />

              <FileUpload
                onFileSelect={(file, url) => {
                  if (url) {
                    setFormData({ ...formData, coverPhotoUrl: url });
                  } else if (file === null) {
                    // Handle removal
                    setFormData({ ...formData, coverPhotoUrl: '' });
                  }
                }}
                accept="image/*"
                maxSize={10}
                currentUrl={formData.coverPhotoUrl}
                label="Cover Photo / Banner"
                hint="Click to browse or drag and drop your cover image"
                bucket="union-files"
                path="covers"
                recommendedDimensions={{ width: 1500, height: 500 }}
                autoResize={true}
              />
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

          {/* Public Name */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>Public Name</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="publicName">Display Name</Label>
                <Input
                  id="publicName"
                  placeholder="e.g. Barrie Transit Union"
                  value={formData.publicName}
                  onChange={(e) =>
                    setFormData({ ...formData, publicName: e.target.value })
                  }
                />
                <p className="text-sm text-gray-500 mt-1">
                  A longer display name if you don't want to go by your union + local number (e.g. "CUPE 123")
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => router.push(`/${union.slug}`)}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span>return</span>
            </button>
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
                  Save
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
