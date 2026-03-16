'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Mail,
  Loader2,
  Save,
  Palette,
  Share2,
  ArrowLeft,
  Lock,
  Sparkles,
  Settings,
} from 'lucide-react';
import useSWR from 'swr';
import { UnionDataWithMembers } from '@/lib/db/schema';
import { themeOptions, canAccessTheme } from '@/lib/themes/config';
import { GeneralTab } from './tabs/general-tab';
import { AppearanceTab } from './tabs/appearance-tab';
import { ContactTab } from './tabs/contact-tab';
import { SocialTab } from './tabs/social-tab';
import { PermissionsTab } from './tabs/permissions-tab';
import { AdvancedTab } from './tabs/advanced-tab';

export interface SettingsFormData {
  publicName: string;
  logoUrl: string;
  coverPhotoUrl: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  description: string;
  about: string;
  aboutImages: string[];
  theme: string;
  themeColor: string;
  socialLinks: Record<string, string>;
  showSocialInHero: boolean;
  hidePoweredBy: boolean;
  defaultLanguage: string;
  homePage: string;
  grievanceFilingPermission: 'all' | 'admins_only';
}

const socialPlatforms = [
  { id: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourpage' },
  { id: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourhandle' },
  { id: 'twitter', label: 'X (Twitter)', placeholder: 'https://x.com/yourhandle' },
  { id: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/yourpage' },
  { id: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@yourchannel' },
] as const;

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function SettingsContent() {
  const router = useRouter();
  const { data: union, mutate } = useSWR<UnionDataWithMembers>('/api/team', fetcher);

  const [formData, setFormData] = useState<SettingsFormData>({
    publicName: '',
    logoUrl: '',
    coverPhotoUrl: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    description: '',
    about: '',
    aboutImages: [],
    theme: 'default',
    themeColor: '#2563eb',
    socialLinks: {},
    showSocialInHero: true,
    hidePoweredBy: false,
    defaultLanguage: 'en',
    homePage: 'news',
    grievanceFilingPermission: 'all',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Union pages for home page selector
  const { data: unionPages } = useSWR<{ id: number; title: string; slug: string; isPublished: boolean }[]>(
    union ? `/api/pages/list` : null,
    fetcher
  );

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
        showSocialInHero: (union as any).showSocialInHero ?? true,
        hidePoweredBy: (union as any).hidePoweredBy || false,
        defaultLanguage: (union as any).defaultLanguage || 'en',
        homePage: (union as any).homePage || 'news',
        grievanceFilingPermission: (union as any).grievanceFilingPermission || 'all',
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
        body: JSON.stringify(formData),
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

  const handleChange = (updates: Partial<SettingsFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'contact', label: 'Contact', icon: Mail },
    { id: 'social', label: 'Social', icon: Share2 },
    { id: 'permissions', label: 'Permissions', icon: Lock },
    { id: 'advanced', label: 'Advanced', icon: Sparkles },
  ];

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
            Update your union&apos;s public profile and contact information
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

          {/* Tabs */}
          <Tabs defaultValue="general" className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border">
              <TabsList className="w-full justify-start p-1 h-auto flex-wrap gap-1 bg-transparent">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
                  >
                    <tab.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="bg-white rounded-lg shadow-sm border">
              <TabsContent value="general" className="m-0 p-6">
                <GeneralTab
                  formData={formData}
                  onChange={handleChange}
                  unionPages={unionPages}
                />
              </TabsContent>

              <TabsContent value="appearance" className="m-0 p-6">
                <AppearanceTab
                  formData={formData}
                  onChange={handleChange}
                  themeOptions={themeOptions}
                  canAccessTheme={canAccessTheme}
                  planName={(union as any)?.planName}
                />
              </TabsContent>

              <TabsContent value="contact" className="m-0 p-6">
                <ContactTab
                  formData={formData}
                  onChange={handleChange}
                />
              </TabsContent>

              <TabsContent value="social" className="m-0 p-6">
                <SocialTab
                  formData={formData}
                  onChange={handleChange}
                  socialPlatforms={socialPlatforms}
                />
              </TabsContent>

              <TabsContent value="permissions" className="m-0 p-6">
                <PermissionsTab
                  formData={formData}
                  onChange={handleChange}
                />
              </TabsContent>

              <TabsContent value="advanced" className="m-0 p-6">
                <AdvancedTab
                  formData={formData}
                  onChange={handleChange}
                  onNavigate={(path) => router.push(path)}
                  slug={union.slug}
                />
              </TabsContent>
            </div>
          </Tabs>

          {/* Bottom Actions */}
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
