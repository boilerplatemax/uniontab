'use client';

import { Facebook, Instagram, Twitter, Linkedin, Youtube } from 'lucide-react';

// TikTok icon (not in lucide-react)
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

interface SocialLink {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
}

interface SocialMediaIconsProps {
  socialLinks: SocialLink | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const socialConfig = {
  facebook: { icon: Facebook, label: 'Facebook', color: 'hover:text-blue-600' },
  instagram: { icon: Instagram, label: 'Instagram', color: 'hover:text-pink-600' },
  twitter: { icon: Twitter, label: 'X (Twitter)', color: 'hover:text-gray-800' },
  linkedin: { icon: Linkedin, label: 'LinkedIn', color: 'hover:text-blue-700' },
  youtube: { icon: Youtube, label: 'YouTube', color: 'hover:text-red-600' },
  tiktok: { icon: TikTokIcon, label: 'TikTok', color: 'hover:text-black' },
};

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export function SocialMediaIcons({ socialLinks, size = 'md', className = '' }: SocialMediaIconsProps) {
  if (!socialLinks) return null;

  const hasAnyLinks = Object.values(socialLinks).some(link => link && link.trim());
  if (!hasAnyLinks) return null;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {Object.entries(socialLinks).map(([platform, url]) => {
        if (!url || !url.trim()) return null;

        const config = socialConfig[platform as keyof typeof socialConfig];
        if (!config) return null;

        const Icon = config.icon;

        return (
          <a
            key={platform}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-gray-500 transition-colors ${config.color}`}
            title={config.label}
          >
            <Icon className={sizeClasses[size]} />
          </a>
        );
      })}
    </div>
  );
}
