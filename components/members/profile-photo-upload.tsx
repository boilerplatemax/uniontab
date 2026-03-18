'use client';

import { useState, useRef } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Camera, Trash2, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ProfilePhotoUploadProps {
  memberId: number;
  unionId: number;
  currentPhotoUrl: string | null;
  memberName: string;
  initials: string;
  onPhotoChange: (url: string | null) => void;
  isDemo?: boolean;
  disabled?: boolean;
}

/**
 * Resize and center-crop an image to a square JPEG using Canvas API.
 * Max output: 400x400px, JPEG quality 0.85.
 */
async function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      // Revoke the object URL to free memory
      URL.revokeObjectURL(objectUrl);

      const size = 400;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Center-crop: use the smaller dimension to determine the crop square
      const minDim = Math.min(img.width, img.height);
      const sx = (img.width - minDim) / 2;
      const sy = (img.height - minDim) / 2;

      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        },
        'image/jpeg',
        0.85
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };
    img.src = objectUrl;
  });
}

export function ProfilePhotoUpload({
  memberId,
  unionId,
  currentPhotoUrl,
  memberName,
  initials,
  onPhotoChange,
  isDemo = false,
  disabled = false,
}: ProfilePhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so the same file can be re-selected
    e.target.value = '';

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, or WebP)');
      return;
    }

    // Validate file size (max 2MB raw)
    if (file.size > 2 * 1024 * 1024) {
      setError('Photo must be less than 2MB');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Resize to 400x400 JPEG
      const resizedBlob = await resizeImage(file);

      // Upload to Supabase Storage
      const supabase = createClient();
      const timestamp = Date.now();
      const filePath = `profile-photos/${unionId}/${memberId}-${timestamp}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('union-files')
        .upload(filePath, resizedBlob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('union-files')
        .getPublicUrl(filePath);

      // Save to database via API
      const response = await fetch('/api/members/profile-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId,
          unionId,
          profilePhotoUrl: publicUrl,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save profile photo');
      }

      onPhotoChange(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setError(null);
    setRemoving(true);

    try {
      const response = await fetch('/api/members/profile-photo', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, unionId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove profile photo');
      }

      onPhotoChange(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove photo');
    } finally {
      setRemoving(false);
    }
  };

  const isLoading = uploading || removing;
  const showActions = !isDemo && !disabled;

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Avatar className="h-16 w-16">
          {currentPhotoUrl && (
            <AvatarImage src={currentPhotoUrl} alt={memberName} />
          )}
          <AvatarFallback className="bg-blue-100 text-blue-700 text-xl">
            {initials}
          </AvatarFallback>
        </Avatar>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
            <Loader2 className="h-5 w-5 text-white animate-spin" />
          </div>
        )}
      </div>

      {showActions && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <Camera className="h-3.5 w-3.5 mr-1.5" />
              {currentPhotoUrl ? 'Change Photo' : 'Upload Photo'}
            </Button>
            {currentPhotoUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemove}
                disabled={isLoading}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Remove
              </Button>
            )}
          </div>
          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}
