'use client';

import { useState } from 'react';
import { FileUpload } from '@/components/ui/file-upload';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { SocialMediaIcons } from '@/components/social-media-icons';
import {
  Loader2,
  Trash2,
  ChevronUp,
  ChevronDown,
  Upload,
  Images,
  X,
  Pencil,
  Check,
  Maximize2,
  Users,
  Mail,
  Phone,
  MapPin,
  Globe,
  ChevronLeft,
  ChevronRight,
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

interface UnionInfo {
  name: string;
  publicName: string | null;
  localNumber: string | null;
  description: string | null;
  coverPhotoUrl: string | null;
  themeColor: string | null;
  logoUrl: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  showSocialInHero: boolean;
  socialLinks: Record<string, string> | null;
}

interface GalleryContentProps {
  slug: string;
  isAdminOrOwner: boolean;
  initialImages: GalleryImage[];
  initialShowTitles: boolean;
  union: UnionInfo;
}

export function GalleryContent({
  slug,
  isAdminOrOwner,
  initialImages,
  initialShowTitles,
  union,
}: GalleryContentProps) {
  const [images, setImages] = useState<GalleryImage[]>(initialImages);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [reordering, setReordering] = useState(false);
  const [showTitles, setShowTitles] = useState(initialShowTitles);
  const [savingTitles, setSavingTitles] = useState(false);
  const [customName, setCustomName] = useState('');
  const [uploadKey, setUploadKey] = useState(0);
  const [editingImageId, setEditingImageId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [savingRename, setSavingRename] = useState(false);

  const hasCoverPhoto = !!union.coverPhotoUrl;
  const displayName =
    ((union.publicName || union.name)).toUpperCase() +
    (!union.publicName && union.localNumber ? ` ${union.localNumber}` : '');

  // ── Data helpers ──────────────────────────────────────────────────────────

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

  // ── Titles toggle (persisted to DB) ───────────────────────────────────────

  const handleToggleTitles = async (value: boolean) => {
    setShowTitles(value);
    setSavingTitles(true);
    try {
      await fetch('/api/gallery/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ galleryShowTitles: value }),
      });
    } catch {
      // best-effort
    } finally {
      setSavingTitles(false);
    }
  };

  // ── Upload ────────────────────────────────────────────────────────────────

  const handleUpload = async (file: File | null, url?: string) => {
    if (url && file) {
      setLoading(true);
      setError('');
      const name = customName.trim() || file.name;
      try {
        const res = await fetch('/api/gallery/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, name, type: file.type, size: file.size }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Upload failed');
        }
        setCustomName('');
        setUploadKey((k) => k + 1);
        await refreshImages();
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this image from the gallery?')) return;
    setError('');
    try {
      const res = await fetch('/api/gallery/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Failed to delete');
      setImages((prev) => prev.filter((img) => img.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ── Reorder ───────────────────────────────────────────────────────────────

  const moveImage = async (index: number, direction: 'up' | 'down') => {
    const newImages = [...images];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newImages.length) return;
    [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
    setImages(newImages);
    setReordering(true);
    try {
      await fetch('/api/gallery/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: newImages.map((img) => img.id) }),
      });
    } catch {
      // silently fail
    } finally {
      setReordering(false);
    }
  };

  // ── Rename ────────────────────────────────────────────────────────────────

  const startRename = (image: GalleryImage) => {
    setEditingImageId(image.id);
    setEditingName(image.name);
  };

  const cancelRename = () => {
    setEditingImageId(null);
    setEditingName('');
  };

  const saveRename = async (id: number) => {
    if (!editingName.trim()) return;
    setSavingRename(true);
    try {
      const res = await fetch('/api/gallery/rename', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: editingName.trim() }),
      });
      if (!res.ok) throw new Error('Failed to rename');
      setImages((prev) =>
        prev.map((img) => (img.id === id ? { ...img, name: editingName.trim() } : img))
      );
      setEditingImageId(null);
      setEditingName('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingRename(false);
    }
  };

  // ── Lightbox ──────────────────────────────────────────────────────────────

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const lightboxPrev = () =>
    setLightboxIndex((i) => (i !== null ? (i - 1 + images.length) % images.length : null));
  const lightboxNext = () =>
    setLightboxIndex((i) => (i !== null ? (i + 1) % images.length : null));

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Union Banner ───────────────────────────────────────────────────── */}
      <div className="relative bg-white">
        <div
          className={`relative overflow-hidden ${hasCoverPhoto ? 'h-[300px] sm:h-[400px]' : 'h-[120px] sm:h-[150px]'}`}
          style={{
            background: hasCoverPhoto
              ? undefined
              : `linear-gradient(135deg, ${union.themeColor || '#2563eb'} 0%, ${union.themeColor || '#2563eb'}dd 50%, ${union.themeColor || '#2563eb'}bb 100%)`,
          }}
        >
          {hasCoverPhoto && (
            <img
              src={union.coverPhotoUrl!}
              alt={`${union.name} cover`}
              className="w-full h-full object-cover"
            />
          )}
        </div>
      </div>

      <div
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 ${hasCoverPhoto ? '-mt-20' : '-mt-10 sm:-mt-12'}`}
      >
        <div className="bg-white rounded-lg shadow-sm pb-4">
          {/* Logo and Name */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 px-6 pt-6">
            <div className={`flex-shrink-0 relative z-20 ${hasCoverPhoto ? '-mt-8 sm:-mt-16' : '-mt-4 sm:-mt-8'}`}>
              {union.logoUrl ? (
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 bg-white rounded-xl border-4 border-white shadow-xl overflow-hidden flex items-center justify-center">
                  <img
                    src={union.logoUrl}
                    alt={`${union.name} logo`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-xl bg-blue-600 flex items-center justify-center border-4 border-white shadow-xl">
                  <Users className="h-16 w-16 sm:h-20 sm:w-20 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left pb-4">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                {displayName}
              </h1>
              {union.description && (
                <p className="text-gray-600 mt-2 text-sm sm:text-base">{union.description}</p>
              )}
            </div>
          </div>

          {/* Contact bar */}
          {(union.email || union.phone || union.address || union.website) && (
            <div className="px-6 pb-4 border-t pt-4">
              <div className="flex flex-wrap gap-4 text-sm">
                {union.email && (
                  <a href={`mailto:${union.email}`} className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors">
                    <Mail className="h-4 w-4" />
                    <span>{union.email}</span>
                  </a>
                )}
                {union.phone && (
                  <a href={`tel:${union.phone}`} className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors">
                    <Phone className="h-4 w-4" />
                    <span>{union.phone}</span>
                  </a>
                )}
                {union.address && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="h-4 w-4" />
                    <span>{union.address}</span>
                  </div>
                )}
                {union.website && (
                  <a href={union.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors">
                    <Globe className="h-4 w-4" />
                    <span className="hover:underline">{union.website.replace(/^https?:\/\//, '')}</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Social icons */}
          {union.showSocialInHero && union.socialLinks && Object.values(union.socialLinks).some((v) => v) && (
            <div className="px-6 pb-4 border-t pt-4 flex justify-center sm:justify-start">
              <SocialMediaIcons socialLinks={union.socialLinks} size="md" />
            </div>
          )}
        </div>
      </div>

      {/* ── Gallery Body ───────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Admin toolbar */}
        {isAdminOrOwner && (
          <div className="mb-8 space-y-6">
            {/* Upload card */}
            <Card className="p-6 shadow-sm border-dashed border-2 border-gray-200 bg-gray-50/50">
              <div className="flex items-center gap-2 mb-4">
                <Upload className="h-5 w-5 text-gray-500" />
                <h2 className="text-base font-semibold text-gray-800">Upload Images</h2>
              </div>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}
              <div className="mb-4">
                <Label htmlFor="custom-name" className="text-sm font-medium text-gray-700 mb-1 block">
                  Image name <span className="font-normal text-gray-400">(optional — defaults to filename)</span>
                </Label>
                <input
                  id="custom-name"
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Enter a name for this image"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <FileUpload
                key={uploadKey}
                onFileSelect={handleUpload}
                accept="image/*,.jpg,.jpeg,.png,.gif,.webp,.svg,.bmp,.tiff,.avif"
                maxSize={20}
                label="Upload to Gallery"
                hint="Drag and drop or click to browse — JPG, PNG, GIF, WebP, SVG and more"
                bucket="union-files"
                path={`gallery/${slug}`}
              />
              {loading && (
                <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading…
                </div>
              )}
            </Card>

            {/* Titles toggle — only shown when there are images */}
            {images.length > 0 && (
              <div className="flex items-center gap-3 px-1">
                <Switch
                  id="show-titles"
                  checked={showTitles}
                  onCheckedChange={handleToggleTitles}
                  disabled={savingTitles}
                />
                <Label htmlFor="show-titles" className="text-sm text-gray-600 cursor-pointer">
                  Show image titles
                </Label>
                {savingTitles && <Loader2 className="h-3 w-3 animate-spin text-gray-400" />}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {images.length === 0 ? (
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-5">
              <Images className="h-10 w-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-500 mb-2">No photos yet</h3>
            {isAdminOrOwner && (
              <p className="text-sm text-gray-400">Upload images above to start your gallery.</p>
            )}
          </div>
        ) : (
          /* ── Masonry grid ─────────────────────────────────────────────── */
          <div
            className="columns-2 sm:columns-2 md:columns-3 xl:columns-4"
            style={{ columnGap: '16px' }}
          >
            {images.map((image, index) => (
              <div
                key={image.id}
                className="break-inside-avoid mb-4 group relative overflow-hidden rounded-2xl bg-gray-100 shadow-sm hover:shadow-xl transition-shadow duration-300"
              >
                {/* Image — natural proportions */}
                <div
                  className="cursor-zoom-in relative"
                  onClick={() => editingImageId !== image.id && openLightbox(index)}
                >
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-auto block"
                    loading="lazy"
                  />

                  {/* Expand overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-300">
                      <div className="p-3.5 rounded-full bg-white/20 backdrop-blur-md border border-white/40 shadow-lg">
                        <Maximize2 className="h-5 w-5 text-white drop-shadow" />
                      </div>
                    </div>
                  </div>

                  {/* Title overlay at bottom (always visible when showTitles) */}
                  {showTitles && editingImageId !== image.id && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent px-3 pt-8 pb-3">
                      <p className="text-white text-sm font-medium truncate leading-snug drop-shadow">
                        {image.name}
                      </p>
                    </div>
                  )}
                </div>

                {/* Inline rename input (below image) */}
                {editingImageId === image.id && (
                  <div className="px-3 py-2.5 bg-white border-t border-gray-100">
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveRename(image.id);
                          if (e.key === 'Escape') cancelRename();
                        }}
                        autoFocus
                        className="flex-1 min-w-0 text-xs border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Image name"
                      />
                      <button
                        onClick={() => saveRename(image.id)}
                        disabled={savingRename}
                        className="p-1.5 text-green-600 hover:text-green-700 transition-colors flex-shrink-0"
                        title="Save"
                      >
                        {savingRename ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button
                        onClick={cancelRename}
                        className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                        title="Cancel"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Admin controls — appear on hover */}
                {isAdminOrOwner && (
                  <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                    {index > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); moveImage(index, 'up'); }}
                        disabled={reordering}
                        className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow border border-white/60 hover:bg-white transition-colors"
                        title="Move up"
                      >
                        <ChevronUp className="h-3.5 w-3.5 text-gray-700" />
                      </button>
                    )}
                    {index < images.length - 1 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); moveImage(index, 'down'); }}
                        disabled={reordering}
                        className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow border border-white/60 hover:bg-white transition-colors"
                        title="Move down"
                      >
                        <ChevronDown className="h-3.5 w-3.5 text-gray-700" />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); startRename(image); }}
                      className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow border border-white/60 hover:bg-white transition-colors"
                      title="Rename"
                    >
                      <Pencil className="h-3.5 w-3.5 text-gray-700" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(image.id); }}
                      className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow border border-white/60 hover:bg-red-50 transition-colors"
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

      {/* ── Lightbox ───────────────────────────────────────────────────────── */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white z-10"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Prev */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); lightboxPrev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white z-10"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); lightboxNext(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white z-10"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Image */}
          <img
            src={images[lightboxIndex].url}
            alt={images[lightboxIndex].name}
            className="max-w-[90vw] max-h-[88vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Caption + counter */}
          <div className="absolute bottom-5 left-0 right-0 flex flex-col items-center gap-1 pointer-events-none">
            {showTitles && (
              <p className="text-white/90 text-sm font-medium drop-shadow">
                {images[lightboxIndex].name}
              </p>
            )}
            <p className="text-white/50 text-xs tabular-nums">
              {lightboxIndex + 1} / {images.length}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
