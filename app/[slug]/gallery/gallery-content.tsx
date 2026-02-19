'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/ui/file-upload';
import { Card } from '@/components/ui/card';
import {
  Loader2,
  Trash2,
  ChevronUp,
  ChevronDown,
  Upload,
  Images,
  X,
} from 'lucide-react';

interface GalleryImage {
  id: number;
  url: string;
  name: string;
  type: string;
  size: number;
  sortOrder: number;
  createdAt: string;
}

interface GalleryContentProps {
  slug: string;
  isAdminOrOwner: boolean;
  initialImages: GalleryImage[];
}

export function GalleryContent({ slug, isAdminOrOwner, initialImages }: GalleryContentProps) {
  const [images, setImages] = useState<GalleryImage[]>(initialImages);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);
  const [reordering, setReordering] = useState(false);

  const refreshImages = async () => {
    try {
      const res = await fetch(`/api/gallery/list?slug=${slug}`);
      if (res.ok) {
        const data = await res.json();
        setImages(data.files || []);
      }
    } catch {
      // silently fail
    }
  };

  const handleUpload = async (file: File | null, url?: string) => {
    if (url && file) {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/gallery/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, name: file.name, type: file.type, size: file.size }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Upload failed');
        }
        await refreshImages();
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this image from the gallery?')) return;
    setError('');
    try {
      const res = await fetch('/api/gallery/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete');
      }
      setImages((prev) => prev.filter((img) => img.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const moveImage = async (index: number, direction: 'up' | 'down') => {
    const newImages = [...images];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newImages.length) return;

    // Swap
    [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
    setImages(newImages);

    // Persist reorder
    setReordering(true);
    try {
      await fetch('/api/gallery/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: newImages.map((img) => img.id) }),
      });
    } catch {
      // Silently fail — UI already shows new order
    } finally {
      setReordering(false);
    }
  };

  const openLightbox = (url: string, index: number) => {
    setLightboxUrl(url);
    setLightboxIndex(index);
  };

  const closeLightbox = () => setLightboxUrl(null);

  const lightboxPrev = () => {
    const prev = (lightboxIndex - 1 + images.length) % images.length;
    setLightboxIndex(prev);
    setLightboxUrl(images[prev].url);
  };

  const lightboxNext = () => {
    const next = (lightboxIndex + 1) % images.length;
    setLightboxIndex(next);
    setLightboxUrl(images[next].url);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Images className="h-7 w-7 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Gallery</h1>
          </div>
          <p className="text-gray-500">
            {isAdminOrOwner
              ? 'Upload and manage images for your union gallery.'
              : 'Browse photos from our union.'}
          </p>
        </div>

        {/* Upload section (admins/owners only) */}
        {isAdminOrOwner && (
          <Card className="p-6 mb-8 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Images
            </h2>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}
            <FileUpload
              onFileSelect={handleUpload}
              accept="image/*,.jpg,.jpeg,.png,.gif,.webp,.svg,.bmp,.tiff,.avif"
              maxSize={20}
              label="Upload to Gallery"
              hint="Click to browse or drag and drop images (JPG, PNG, GIF, WebP, SVG, and more)"
              bucket="union-files"
              path={`gallery/${slug}`}
            />
            {loading && (
              <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </div>
            )}
          </Card>
        )}

        {/* Gallery grid */}
        {images.length === 0 ? (
          <div className="text-center py-20">
            <Images className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-500 mb-1">No images yet</h3>
            {isAdminOrOwner && (
              <p className="text-sm text-gray-400">Upload images above to start your gallery.</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div
                key={image.id}
                className="group relative rounded-xl overflow-hidden bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                {/* Image */}
                <div
                  className="aspect-square cursor-pointer overflow-hidden bg-gray-100"
                  onClick={() => openLightbox(image.url, index)}
                >
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                {/* Image name */}
                <div className="px-3 py-2">
                  <p className="text-xs text-gray-500 truncate" title={image.name}>
                    {image.name}
                  </p>
                </div>

                {/* Admin controls overlay */}
                {isAdminOrOwner && (
                  <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Move up */}
                    {index > 0 && (
                      <button
                        onClick={() => moveImage(index, 'up')}
                        disabled={reordering}
                        className="p-1.5 bg-white rounded-lg shadow border border-gray-200 hover:bg-gray-50 transition-colors"
                        title="Move up"
                      >
                        <ChevronUp className="h-3.5 w-3.5 text-gray-600" />
                      </button>
                    )}
                    {/* Move down */}
                    {index < images.length - 1 && (
                      <button
                        onClick={() => moveImage(index, 'down')}
                        disabled={reordering}
                        className="p-1.5 bg-white rounded-lg shadow border border-gray-200 hover:bg-gray-50 transition-colors"
                        title="Move down"
                      >
                        <ChevronDown className="h-3.5 w-3.5 text-gray-600" />
                      </button>
                    )}
                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(image.id)}
                      className="p-1.5 bg-white rounded-lg shadow border border-gray-200 hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
          >
            <X className="h-6 w-6" />
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); lightboxPrev(); }}
                className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
              >
                <ChevronUp className="h-6 w-6 -rotate-90" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); lightboxNext(); }}
                className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
              >
                <ChevronDown className="h-6 w-6 -rotate-90" />
              </button>
            </>
          )}

          <img
            src={lightboxUrl}
            alt="Gallery image"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            {lightboxIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
}
