'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Share2, Link2, Mail, Facebook, Twitter, Linkedin, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ShareButtonProps {
  itemType: 'post' | 'file' | 'event';
  itemId: number;
  itemTitle: string;
  itemUrl: string; // Relative or absolute URL to the item
  slug: string; // Union slug
  isOwnerOrAdmin: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  // Optional - for populating mass email with full content
  itemContent?: string;
  itemImageUrl?: string; // Optional - for post images
  itemAttachments?: Array<{
    id: number;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    fileType?: string;
  }>;
}

export function ShareButton({
  itemType,
  itemId,
  itemTitle,
  itemUrl,
  slug,
  isOwnerOrAdmin,
  variant = 'outline',
  size = 'sm',
  className = '',
  itemContent,
  itemImageUrl,
  itemAttachments,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  // Construct full URL if not already absolute
  const fullUrl = itemUrl.startsWith('http')
    ? itemUrl
    : `${typeof window !== 'undefined' ? window.location.origin : ''}${itemUrl}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleSocialShare = (platform: 'facebook' | 'twitter' | 'linkedin') => {
    const encodedUrl = encodeURIComponent(fullUrl);
    const encodedTitle = encodeURIComponent(itemTitle);

    let shareUrl = '';
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  const handleMassEmail = () => {
    // Create subject and content for mass email
    const itemTypeDisplay = itemType.charAt(0).toUpperCase() + itemType.slice(1);
    const subject = `New ${itemTypeDisplay}: ${itemTitle}`;

    // Create HTML content - use full post content if provided, otherwise just a link
    let content = '';
    if (itemContent) {
      // Limit content to first 1000 characters to avoid URL encoding issues
      // Strip HTML tags for character counting
      const textContent = itemContent.replace(/<[^>]*>/g, '');
      const truncatedContent = textContent.length > 1000
        ? itemContent.substring(0, 1000) + '...'
        : itemContent;

      // Use the truncated post content with a link to view the full post
      content = `<h2>${itemTitle}</h2>${truncatedContent}<hr /><p style="margin-top: 20px; padding: 12px; background-color: #f3f4f6; border-radius: 8px; text-align: center;"><a href="${fullUrl}" style="color: #2563eb; text-decoration: none; font-weight: 600;">📖 View Full ${itemTypeDisplay}</a></p>`;
    } else {
      // Fallback to simple link
      content = `<p>Check out this new ${itemType}:</p><h2>${itemTitle}</h2><p><a href="${fullUrl}">View ${itemTypeDisplay}</a></p>`;
    }

    // Build the URL with query parameters
    const params = new URLSearchParams({
      subject,
      content,
    });

    // Combine all attachments (post attachments + image if exists)
    const allAttachments = [...(itemAttachments || [])];

    // Add post image as attachment if it exists
    if (itemImageUrl) {
      // Infer MIME type from file extension
      const getImageMimeType = (url: string): string => {
        const ext = url.split('.').pop()?.toLowerCase();
        const mimeTypes: Record<string, string> = {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'gif': 'image/gif',
          'webp': 'image/webp',
          'svg': 'image/svg+xml',
        };
        return mimeTypes[ext || ''] || 'image/jpeg';
      };

      const imageFileName = itemImageUrl.split('/').pop() || 'post-image.jpg';
      allAttachments.unshift({
        id: -1, // Special ID for post image
        fileName: imageFileName,
        fileUrl: itemImageUrl,
        fileSize: 0, // Size unknown for post images
        fileType: getImageMimeType(itemImageUrl),
      });
    }

    // Add attachments if any exist
    if (allAttachments.length > 0) {
      params.set('attachments', JSON.stringify(allAttachments));
    }

    // Navigate to mass email page with pre-filled data
    const massEmailUrl = `/${slug}/mass-email?${params.toString()}`;
    router.push(massEmailUrl);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Share this {itemType}</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleCopyLink}>
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Link copied!
            </>
          ) : (
            <>
              <Link2 className="h-4 w-4 mr-2" />
              Copy link
            </>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => handleSocialShare('facebook')}>
          <Facebook className="h-4 w-4 mr-2" />
          Share on Facebook
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleSocialShare('twitter')}>
          <Twitter className="h-4 w-4 mr-2" />
          Share on X (Twitter)
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleSocialShare('linkedin')}>
          <Linkedin className="h-4 w-4 mr-2" />
          Share on LinkedIn
        </DropdownMenuItem>

        {isOwnerOrAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleMassEmail}>
              <Mail className="h-4 w-4 mr-2" />
              Email to members
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
