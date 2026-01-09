'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/ui/file-upload';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { RichTextContent } from '@/components/ui/rich-text-content';
import {
  Edit,
  Save,
  X,
  Loader2,
  ImageIcon,
  LayoutTemplate,
  AlignLeft,
  AlignRight,
  ArrowUp,
} from 'lucide-react';
import type { Union } from '@/lib/db/schema';

type ImagePosition = 'above' | 'left' | 'right';

interface InlineAboutEditorProps {
  union: Union;
  isOwner: boolean;
}

export function InlineAboutEditor({ union, isOwner }: InlineAboutEditorProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [about, setAbout] = useState(union.about || '');
  const [aboutImageUrl, setAboutImageUrl] = useState((union as any).aboutImageUrl || '');
  const [aboutImagePosition, setAboutImagePosition] = useState<ImagePosition>(
    ((union as any).aboutImagePosition as ImagePosition) || 'above'
  );
  const [aboutImages, setAboutImages] = useState<string[]>((union as any).aboutImages || []);

  // Reset form when union changes or when canceling edit
  useEffect(() => {
    if (!isEditing) {
      setAbout(union.about || '');
      setAboutImageUrl((union as any).aboutImageUrl || '');
      setAboutImagePosition(((union as any).aboutImagePosition as ImagePosition) || 'above');
      setAboutImages((union as any).aboutImages || []);
    }
  }, [union, isEditing]);

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/union/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          about,
          aboutImageUrl: aboutImageUrl || null,
          aboutImagePosition,
          aboutImages,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update about section');
      }

      router.refresh();
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError('');
    // Reset form state
    setAbout(union.about || '');
    setAboutImageUrl((union as any).aboutImageUrl || '');
    setAboutImagePosition(((union as any).aboutImagePosition as ImagePosition) || 'above');
    setAboutImages((union as any).aboutImages || []);
  };

  const positionOptions = [
    { value: 'above' as const, label: 'Above', icon: ArrowUp },
    { value: 'left' as const, label: 'Left', icon: AlignLeft },
    { value: 'right' as const, label: 'Right', icon: AlignRight },
  ];

  // Helper to render featured image based on position
  const renderFeaturedImage = (imageUrl: string, position: ImagePosition, isPreview = false) => {
    if (!imageUrl) return null;

    const imgClasses = position === 'above'
      ? 'w-full max-h-[400px] object-cover rounded-lg mb-6'
      : 'w-full h-auto object-cover rounded-lg';

    return (
      <div className={position === 'above' ? 'w-full' : 'flex-shrink-0 w-full sm:w-80 lg:w-96'}>
        <img
          src={imageUrl}
          alt="About"
          className={imgClasses}
        />
      </div>
    );
  };

  // Editing Mode
  if (isEditing) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-6">
          {/* Header with actions */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Edit About Section</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={saving}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          {/* Featured Image Section */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <ImageIcon className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-gray-700">Featured Image</span>
            </div>

            {aboutImageUrl && (
              <div className="mb-4">
                <div className="relative inline-block">
                  <img
                    src={aboutImageUrl}
                    alt="Featured"
                    className="max-w-xs max-h-48 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => setAboutImageUrl('')}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            <FileUpload
              onFileSelect={(file, url) => {
                if (url) {
                  setAboutImageUrl(url);
                }
              }}
              accept="image/*"
              maxSize={5}
              label={aboutImageUrl ? "Replace Image" : "Add Featured Image"}
              hint="Click to browse or drag and drop an image"
              bucket="union-files"
              path="about-images"
              autoResize={true}
            />

            {/* Position Selector */}
            {aboutImageUrl && (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <LayoutTemplate className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Image Position</span>
                </div>
                <div className="flex gap-2">
                  {positionOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setAboutImagePosition(option.value)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                          aboutImagePosition === option.value
                            ? 'bg-blue-50 border-blue-500 text-blue-700'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-sm">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {aboutImagePosition === 'above' && 'Image will display above the text content'}
                  {aboutImagePosition === 'left' && 'Image will display to the left of text on large screens'}
                  {aboutImagePosition === 'right' && 'Image will display to the right of text on large screens'}
                </p>
              </div>
            )}
          </div>

          {/* About Text Editor */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              About Content
            </label>
            <RichTextEditor
              content={about}
              onChange={setAbout}
              placeholder="Tell visitors about your union's history, mission, and values..."
            />
          </div>

          {/* Gallery Images */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <ImageIcon className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-gray-700">Additional Images (Gallery)</span>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Add more images to display below the main content
            </p>

            {aboutImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                {aboutImages.map((imageUrl, index) => (
                  <div key={index} className="relative group aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={imageUrl}
                      alt={`Gallery image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setAboutImages(aboutImages.filter((_, i) => i !== index));
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <FileUpload
              onFileSelect={(file, url) => {
                if (url) {
                  setAboutImages([...aboutImages, url]);
                }
              }}
              accept="image/*"
              maxSize={5}
              label="Add Gallery Image"
              hint="Click to browse or drag and drop an image"
              bucket="union-files"
              path="about-images"
              autoResize={true}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  // View Mode
  const hasContent = union.about || aboutImageUrl || (aboutImages && aboutImages.length > 0);

  if (!hasContent) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Welcome to {union.publicName || union.name}
          </h3>
          <p className="text-gray-500 mb-4">More content coming soon...</p>
          {isOwner && (
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Edit className="h-4 w-4 mr-2" />
              Add About Content
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        {/* Header with edit button */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">About</h2>
          {isOwner && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
        </div>

        {/* Featured Image - Position: Above */}
        {aboutImageUrl && aboutImagePosition === 'above' && (
          <div className="mb-6">
            <img
              src={aboutImageUrl}
              alt="About"
              className="w-full max-h-[400px] object-cover rounded-lg"
            />
          </div>
        )}

        {/* Content with Side Image Layout */}
        {aboutImageUrl && (aboutImagePosition === 'left' || aboutImagePosition === 'right') ? (
          <div className={`flex flex-col sm:flex-row gap-6 mb-6 ${aboutImagePosition === 'right' ? 'sm:flex-row-reverse' : ''}`}>
            <div className="flex-shrink-0 w-full sm:w-80 lg:w-96">
              <img
                src={aboutImageUrl}
                alt="About"
                className="w-full h-auto object-cover rounded-lg"
              />
            </div>
            <div className="flex-1">
              {union.about && (
                <RichTextContent
                  content={union.about}
                  className="text-gray-700 leading-relaxed"
                />
              )}
            </div>
          </div>
        ) : (
          // No side image or position is 'above' - just show content
          union.about && (
            <RichTextContent
              content={union.about}
              className="text-gray-700 leading-relaxed mb-6"
            />
          )
        )}

        {/* Gallery Images */}
        {aboutImages && aboutImages.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {aboutImages.map((imageUrl: string, index: number) => (
                <div key={index} className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={`About image ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                    onClick={() => window.open(imageUrl, '_blank')}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
