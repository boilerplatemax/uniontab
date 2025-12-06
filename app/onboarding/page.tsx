'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { FileUpload } from '@/components/ui/file-upload';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import {
  ArrowRight,
  ArrowLeft,
  Upload,
  Mail,
  Phone,
  MapPin,
  Globe,
  Eye,
  Check,
  Users
} from 'lucide-react';
import useSWR from 'swr';
import { UnionDataWithMembers } from '@/lib/db/schema';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type OnboardingStep = 'welcome' | 'logo' | 'cover' | 'contact' | 'about' | 'preview';

const steps: OnboardingStep[] = ['welcome', 'logo', 'cover', 'contact', 'about', 'preview'];

export default function OnboardingPage() {
  const router = useRouter();
  const { data: union, mutate } = useSWR<UnionDataWithMembers>('/api/team', fetcher);
  const { data: user } = useSWR('/api/user', fetcher);

  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
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

  // Protect onboarding page - only owners can access
  useEffect(() => {
    if (user && user.role !== 'owner') {
      // Redirect non-owners away from onboarding
      if (union?.slug) {
        router.push(`/${union.slug}`);
      } else {
        router.push('/sign-in');
      }
    }
  }, [user, union, router]);

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

  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1]);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1]);
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      await mutate();

      // Auto-advance if not on preview
      if (currentStep !== 'preview') {
        handleNext();
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/onboarding/publish', {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to publish');
      }

      // Redirect to the union's public page
      if (union?.slug) {
        router.push(`/${union.slug}`);
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Error publishing:', error);
      alert('Failed to publish site. Please try again.');
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
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Users className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome to UnionTab
          </h1>
          <p className="mt-2 text-gray-600">
            Let's set up your union's website in a few simple steps
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStepIndex + 1} of {steps.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Content Card */}
        <Card className="shadow-xl">
          <CardContent className="p-8">
            {/* Welcome Step */}
            {currentStep === 'welcome' && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Welcome {(union.publicName || union.name).toUpperCase()}{union.localNumber ? ` ${union.localNumber}` : ''}!
                  </h2>
                </div>
                <p className="text-lg text-gray-700 text-center">
                  Let's make your union's website look great! We'll guide you
                  through adding your logo, cover photo, contact information,
                  and more.
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>Note:</strong> You can skip any step and come back to
                    complete it later from your dashboard settings.
                  </p>
                </div>
              </div>
            )}

            {/* Logo Step */}
            {currentStep === 'logo' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Upload Your Logo
                  </h2>
                  <p className="text-gray-600">
                    Add your union's logo to make your site recognizable
                  </p>
                </div>

                <div className="space-y-4">
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
                </div>
              </div>
            )}

            {/* Cover Photo Step */}
            {currentStep === 'cover' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Add a Cover Photo
                  </h2>
                  <p className="text-gray-600">
                    Choose a banner image for the top of your page
                  </p>
                </div>

                <div className="space-y-4">
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
                </div>
              </div>
            )}

            {/* Contact Info Step */}
            {currentStep === 'contact' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Contact Information
                  </h2>
                  <p className="text-gray-600">
                    Help members and visitors get in touch
                  </p>
                </div>

                <div className="space-y-4">
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
                </div>
              </div>
            )}

            {/* About Step */}
            {currentStep === 'about' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Tell Your Story
                  </h2>
                  <p className="text-gray-600">
                    Share what makes your union special
                  </p>
                </div>

                <div className="space-y-4">
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
                    <RichTextEditor
                      content={formData.about}
                      onChange={(value) =>
                        setFormData({ ...formData, about: value })
                      }
                      placeholder="Tell visitors about your union's history, mission, and values..."
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Share your union's story, accomplishments, and goals
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Preview Step */}
            {currentStep === 'preview' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Preview Your Site
                  </h2>
                  <p className="text-gray-600">
                    Here's how your union website will look
                  </p>
                </div>

                {/* Mini Preview */}
                <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                  {/* Cover Photo Preview */}
                  <div className="relative h-32 bg-gradient-to-r from-blue-600 to-blue-700">
                    {formData.coverPhotoUrl && (
                      <img
                        src={formData.coverPhotoUrl}
                        alt="Cover"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  <div className="p-6 space-y-4">
                    {/* Logo & Name */}
                    <div className="flex items-center gap-4">
                      {formData.logoUrl ? (
                        <img
                          src={formData.logoUrl}
                          alt="Logo"
                          className="h-16 w-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-lg bg-blue-600 flex items-center justify-center">
                          <Users className="h-8 w-8 text-white" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-xl font-bold">{formData.publicName || union.name}</h3>
                        {union.localNumber && (
                          <p className="text-gray-600">Local {union.localNumber}</p>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    {formData.description && (
                      <p className="text-gray-700">{formData.description}</p>
                    )}

                    {/* Contact Info Grid */}
                    {(formData.email || formData.phone) && (
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        {formData.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-blue-600" />
                            <span className="text-gray-700 truncate">
                              {formData.email}
                            </span>
                          </div>
                        )}
                        {formData.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-blue-600" />
                            <span className="text-gray-700">{formData.phone}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-900">
                    <strong>Ready to go live?</strong> Click "Publish Site" below
                    to make your union website public!
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between items-center">
          {currentStepIndex > 0 && (
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={loading}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>
          )}

          <div className="flex gap-3 items-center ml-auto">
            {currentStep !== 'welcome' && currentStep !== 'preview' && (
              <button
                onClick={() => {
                  // Skip all remaining steps and go to preview
                  setCurrentStep('preview');
                }}
                disabled={loading}
                className="text-sm text-gray-500 hover:text-gray-700 underline cursor-pointer"
              >
                Skip all
              </button>
            )}

            {currentStep === 'preview' ? (
              <Button
                onClick={handlePublish}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 gap-2"
              >
                {loading ? (
                  'Publishing...'
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Publish Site
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={currentStep === 'welcome' ? handleNext : handleSave}
                disabled={loading}
                className="gap-2"
              >
                {loading ? 'Saving...' : 'Next'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
