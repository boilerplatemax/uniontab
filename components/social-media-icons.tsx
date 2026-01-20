'use client';

import { Facebook, Instagram, Twitter, Linkedin, Youtube } from 'lucide-react';

export interface SocialLink {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  youtube?: string;
}

interface SocialMediaIconsProps {
  socialLinks: SocialLink | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'subtle' | 'vibrant';
  className?: string;
  /** Custom text color for subtle variant (use with hero sections) */
  subtleColor?: string;
}

// Vibrant brand colors with circular backgrounds
const socialConfig = {
  facebook: {
    icon: Facebook,
    label: 'Facebook',
    subtleColor: 'hover:text-blue-600',
    bgColor: 'bg-[#1877F2]',
    hoverBg: 'hover:bg-[#166FE5]',
  },
  instagram: {
    icon: Instagram,
    label: 'Instagram',
    subtleColor: 'hover:text-pink-600',
    bgColor: 'bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF]',
    hoverBg: 'hover:opacity-90',
  },
  twitter: {
    icon: Twitter,
    label: 'X (Twitter)',
    subtleColor: 'hover:text-gray-800',
    bgColor: 'bg-black',
    hoverBg: 'hover:bg-gray-800',
  },
  linkedin: {
    icon: Linkedin,
    label: 'LinkedIn',
    subtleColor: 'hover:text-blue-700',
    bgColor: 'bg-[#0A66C2]',
    hoverBg: 'hover:bg-[#004182]',
  },
  youtube: {
    icon: Youtube,
    label: 'YouTube',
    subtleColor: 'hover:text-red-600',
    bgColor: 'bg-[#FF0000]',
    hoverBg: 'hover:bg-[#CC0000]',
  },
};

const sizeClasses = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

const containerSizeClasses = {
  sm: 'h-7 w-7',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
};

export function SocialMediaIcons({ socialLinks, size = 'md', variant = 'vibrant', className = '', subtleColor }: SocialMediaIconsProps) {
  if (!socialLinks) return null;

  const hasAnyLinks = Object.values(socialLinks).some(link => link && link.trim());
  if (!hasAnyLinks) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {Object.entries(socialLinks).map(([platform, url]) => {
        if (!url || !url.trim()) return null;

        const config = socialConfig[platform as keyof typeof socialConfig];
        if (!config) return null;

        const Icon = config.icon;

        if (variant === 'vibrant') {
          return (
            <a
              key={platform}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${containerSizeClasses[size]} ${config.bgColor} ${config.hoverBg} rounded-full flex items-center justify-center text-white transition-all shadow-sm hover:shadow-md hover:scale-105`}
              title={config.label}
            >
              <Icon className={sizeClasses[size]} />
            </a>
          );
        }

        // Subtle variant (original style or custom color for hero sections)
        return (
          <a
            key={platform}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`transition-colors opacity-80 hover:opacity-100 ${!subtleColor ? `text-gray-500 ${config.subtleColor}` : ''}`}
            style={subtleColor ? { color: subtleColor } : undefined}
            title={config.label}
          >
            <Icon className={sizeClasses[size]} />
          </a>
        );
      })}
    </div>
  );
}
