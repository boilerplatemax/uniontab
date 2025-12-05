'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Download, Eye, Share2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface RegistrationToolsProps {
  slug: string;
  unionName: string;
  logoUrl?: string | null;
}

export function RegistrationTools({ slug, unionName, logoUrl }: RegistrationToolsProps) {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const instructionsRef = useRef<HTMLDivElement>(null);

  // Construct the full registration URL
  const registrationUrl = `${window.location.origin}/${slug}/sign-up`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(registrationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    const svgContent = generateInstructionsSVG();
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${slug}-registration-instructions.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateInstructionsSVG = () => {
    const width = 800;
    const height = 1000;

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <style>
      .title { font-family: Arial, sans-serif; font-size: 32px; font-weight: bold; fill: #1f2937; }
      .union-name { font-family: Arial, sans-serif; font-size: 24px; font-weight: 600; fill: #ea580c; }
      .step-number { font-family: Arial, sans-serif; font-size: 20px; font-weight: bold; fill: #ffffff; }
      .step-text { font-family: Arial, sans-serif; font-size: 18px; fill: #374151; }
      .url-text { font-family: Monaco, monospace; font-size: 16px; fill: #ea580c; font-weight: 600; }
      .note { font-family: Arial, sans-serif; font-size: 14px; fill: #6b7280; font-style: italic; }
    </style>
  </defs>

  <!-- Background -->
  <rect width="${width}" height="${height}" fill="#ffffff"/>

  <!-- Border -->
  <rect x="20" y="20" width="${width - 40}" height="${height - 40}" fill="none" stroke="#ea580c" stroke-width="3" rx="12"/>

  <!-- Header -->
  <rect x="40" y="40" width="${width - 80}" height="120" fill="#fef3c7" rx="8"/>
  ${logoUrl ? `<image x="60" y="60" width="80" height="80" href="${logoUrl}" preserveAspectRatio="xMidYMid meet"/>` : ''}
  <text x="${logoUrl ? '160' : '60'}" y="85" class="union-name">${escapeXml(unionName)}</text>
  <text x="${logoUrl ? '160' : '60'}" y="130" class="title">Registration Instructions</text>

  <!-- Instructions -->
  <text x="60" y="220" class="step-text" font-weight="600">Follow these steps to join:</text>

  <!-- Step 1 -->
  <circle cx="85" cy="265" r="25" fill="#ea580c"/>
  <text x="85" y="273" text-anchor="middle" class="step-number">1</text>
  <text x="130" y="265" class="step-text">Go to the registration link:</text>
  <text x="130" y="295" class="url-text">${escapeXml(registrationUrl)}</text>

  <!-- Step 2 -->
  <circle cx="85" cy="385" r="25" fill="#ea580c"/>
  <text x="85" y="393" text-anchor="middle" class="step-number">2</text>
  <text x="130" y="385" class="step-text">Sign up using your personal email address</text>
  <text x="130" y="410" class="note">(Use your work or personal email)</text>

  <!-- Step 3 -->
  <circle cx="85" cy="500" r="25" fill="#ea580c"/>
  <text x="85" y="508" text-anchor="middle" class="step-number">3</text>
  <text x="130" y="500" class="step-text">Confirm your email address</text>
  <text x="130" y="525" class="note">(Check your spam folder if you don't see it)</text>

  <!-- Step 4 -->
  <circle cx="85" cy="615" r="25" fill="#ea580c"/>
  <text x="85" y="623" text-anchor="middle" class="step-number">4</text>
  <text x="130" y="615" class="step-text">Wait for an admin to approve your account</text>
  <text x="130" y="640" class="note">(You'll be notified by email when approved)</text>

  <!-- Footer -->
  <rect x="60" y="720" width="${width - 120}" height="220" fill="#fef3c7" rx="8"/>
  <text x="80" y="760" class="step-text" font-weight="600">Need Help?</text>
  <text x="80" y="795" class="note">Contact your union administrator if you have</text>
  <text x="80" y="820" class="note">any questions or issues with registration.</text>

  <text x="80" y="870" class="note">Powered by UnionTab</text>
  <text x="80" y="895" class="note">Your Digital Union Platform</text>
</svg>`;
  };

  const escapeXml = (text: string) => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Registration Tools
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-3">
              Share this link with potential members to join your union:
            </p>
            <div className="flex gap-2">
              <Input
                value={registrationUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                onClick={handleCopy}
                variant="outline"
                className="shrink-0"
              >
                {copied ? (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Registration Instructions
            </p>
            <p className="text-sm text-gray-600 mb-3">
              Generate a downloadable instruction sheet with your union's branding to share with potential members.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowPreview(true)}
                variant="outline"
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button
                onClick={handleDownload}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registration Instructions Preview</DialogTitle>
          </DialogHeader>
          <div
            className="border rounded-lg p-4 bg-gray-50"
            dangerouslySetInnerHTML={{ __html: generateInstructionsSVG() }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
