'use client';

import { useState } from 'react';
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
import jsPDF from 'jspdf';

interface RegistrationToolsProps {
  slug: string;
  unionName: string;
  localNumber?: string | null;
  logoUrl?: string | null;
}

export function RegistrationTools({ slug, unionName, localNumber, logoUrl }: RegistrationToolsProps) {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

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

  const handleDownload = async () => {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = 25;

    // Add border
    pdf.setDrawColor(234, 88, 12); // Orange color
    pdf.setLineWidth(1);
    pdf.roundedRect(10, 10, pageWidth - 20, 257, 3, 3);

    // Add header background
    pdf.setFillColor(254, 243, 199); // Light yellow
    pdf.roundedRect(margin, margin, pageWidth - 2 * margin, 35, 2, 2, 'F');

    // Add logo if available
    if (logoUrl) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = logoUrl;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        pdf.addImage(img, 'PNG', margin + 5, yPosition, 20, 20);
        yPosition += 5;
      } catch (err) {
        console.error('Failed to load logo:', err);
        yPosition += 5;
      }
    } else {
      yPosition += 5;
    }

    // Union name and local number
    pdf.setFontSize(18);
    pdf.setTextColor(234, 88, 12); // Orange
    pdf.setFont('helvetica', 'bold');
    const unionHeaderX = logoUrl ? margin + 30 : margin + 5;

    // Display union name with local number if available
    const unionHeader = localNumber
      ? `${unionName} Local ${localNumber}`
      : unionName;
    pdf.text(unionHeader, unionHeaderX, yPosition);

    yPosition += 10;

    // Title
    pdf.setFontSize(24);
    pdf.setTextColor(31, 41, 55); // Dark gray
    pdf.text('ATU Registration Instructions', unionHeaderX, yPosition);

    yPosition += 20;

    // Instructions header
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(55, 65, 81);
    pdf.text('Follow these steps to join:', margin + 5, yPosition);

    yPosition += 15;

    // Step 1
    pdf.setFillColor(234, 88, 12);
    pdf.circle(margin + 7, yPosition - 3, 5, 'F');
    pdf.setFontSize(14);
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.text('1', margin + 5.5, yPosition);

    pdf.setTextColor(55, 65, 81);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Go to the registration link:', margin + 20, yPosition);

    yPosition += 7;
    pdf.setFontSize(12);
    pdf.setTextColor(234, 88, 12);
    pdf.setFont('courier', 'bold');
    // Make URL clickable
    pdf.textWithLink(registrationUrl, margin + 20, yPosition, { url: registrationUrl });

    yPosition += 20;

    // Step 2
    pdf.setFillColor(234, 88, 12);
    pdf.circle(margin + 7, yPosition - 3, 5, 'F');
    pdf.setFontSize(14);
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.text('2', margin + 5.5, yPosition);

    pdf.setTextColor(55, 65, 81);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Sign up using your personal email address', margin + 20, yPosition);

    yPosition += 7;
    pdf.setFontSize(11);
    pdf.setTextColor(107, 114, 128);
    pdf.setFont('helvetica', 'italic');
    pdf.text('(DO NOT use your work email)', margin + 20, yPosition);

    yPosition += 18;

    // Step 3
    pdf.setFillColor(234, 88, 12);
    pdf.circle(margin + 7, yPosition - 3, 5, 'F');
    pdf.setFontSize(14);
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.text('3', margin + 5.5, yPosition);

    pdf.setTextColor(55, 65, 81);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Confirm your email address', margin + 20, yPosition);

    yPosition += 7;
    pdf.setFontSize(11);
    pdf.setTextColor(107, 114, 128);
    pdf.setFont('helvetica', 'italic');
    pdf.text("(Check your spam folder if you don't see it)", margin + 20, yPosition);

    yPosition += 18;

    // Step 4
    pdf.setFillColor(234, 88, 12);
    pdf.circle(margin + 7, yPosition - 3, 5, 'F');
    pdf.setFontSize(14);
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.text('4', margin + 5.5, yPosition);

    pdf.setTextColor(55, 65, 81);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Wait for an admin to approve your account', margin + 20, yPosition);

    yPosition += 7;
    pdf.setFontSize(11);
    pdf.setTextColor(107, 114, 128);
    pdf.setFont('helvetica', 'italic');
    pdf.text("(You'll be notified by email when approved)", margin + 20, yPosition);

    yPosition += 18;

    // Footer
    pdf.setFillColor(254, 243, 199);
    pdf.roundedRect(margin, yPosition - 5, pageWidth - 2 * margin, 50, 2, 2, 'F');

    yPosition += 5;
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(55, 65, 81);
    pdf.text('Need Help?', margin + 5, yPosition);

    yPosition += 8;
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(107, 114, 128);
    pdf.text('Contact your Union administrator if you have any questions', margin + 5, yPosition);

    yPosition += 5;
    pdf.text('or issues with registration.', margin + 5, yPosition);

    yPosition += 8;
    pdf.setTextColor(234, 88, 12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Support: ', margin + 5, yPosition);
    pdf.setFont('helvetica', 'normal');
    // Make email clickable
    pdf.textWithLink('info@uniontab.com', margin + 23, yPosition, { url: 'mailto:info@uniontab.com' });

    yPosition += 10;
    pdf.setFontSize(10);
    pdf.setTextColor(107, 114, 128);
    pdf.setFont('helvetica', 'italic');
    pdf.text('Powered by UnionTab', margin + 5, yPosition);
    yPosition += 4;
    pdf.text('Your Digital Union Platform', margin + 5, yPosition);

    // Save PDF
    const fileName = localNumber
      ? `${slug}-local-${localNumber}-registration-instructions.pdf`
      : `${slug}-registration-instructions.pdf`;
    pdf.save(fileName);
  };

  const generatePreviewHTML = () => {
    const unionHeader = localNumber
      ? `${unionName} Local ${localNumber}`
      : unionName;

    return `
      <div style="max-width: 800px; margin: 0 auto; padding: 40px; background: white; border: 3px solid #ea580c; border-radius: 12px;">
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          ${logoUrl ? `<img src="${logoUrl}" alt="Logo" style="width: 80px; height: 80px; margin-bottom: 10px;" />` : ''}
          <h2 style="color: #ea580c; font-size: 18px; font-weight: 600; margin: 0 0 10px 0;">${unionHeader}</h2>
          <h1 style="color: #1f2937; font-size: 24px; font-weight: bold; margin: 0;">ATU Registration Instructions</h1>
        </div>

        <p style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 20px;">Follow these steps to join:</p>

        <div style="margin-bottom: 25px;">
          <div style="display: flex; align-items: flex-start;">
            <div style="background: #ea580c; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">1</div>
            <div style="margin-left: 15px; flex: 1;">
              <p style="font-size: 16px; color: #374151; margin: 5px 0;">Go to the registration link:</p>
              <a href="${registrationUrl}" style="color: #ea580c; font-weight: 600; font-family: monospace; font-size: 14px; display: block; margin-top: 5px;">${registrationUrl}</a>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 25px;">
          <div style="display: flex; align-items: flex-start;">
            <div style="background: #ea580c; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">2</div>
            <div style="margin-left: 15px; flex: 1;">
              <p style="font-size: 16px; color: #374151; margin: 5px 0;">Sign up using your personal email address</p>
              <p style="font-size: 13px; color: #6b7280; font-style: italic; margin: 5px 0;">(DO NOT use your work email)</p>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 25px;">
          <div style="display: flex; align-items: flex-start;">
            <div style="background: #ea580c; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">3</div>
            <div style="margin-left: 15px; flex: 1;">
              <p style="font-size: 16px; color: #374151; margin: 5px 0;">Confirm your email address</p>
              <p style="font-size: 13px; color: #6b7280; font-style: italic; margin: 5px 0;">(Check your spam folder if you don't see it)</p>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 25px;">
          <div style="display: flex; align-items: flex-start;">
            <div style="background: #ea580c; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">4</div>
            <div style="margin-left: 15px; flex: 1;">
              <p style="font-size: 16px; color: #374151; margin: 5px 0;">Wait for an admin to approve your account</p>
              <p style="font-size: 13px; color: #6b7280; font-style: italic; margin: 5px 0;">(You'll be notified by email when approved)</p>
            </div>
          </div>
        </div>

        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin-top: 30px;">
          <h3 style="font-size: 14px; font-weight: 600; color: #374151; margin: 0 0 10px 0;">Need Help?</h3>
          <p style="font-size: 12px; color: #6b7280; margin: 5px 0;">Contact your Union administrator if you have any questions or issues with registration.</p>
          <p style="font-size: 12px; color: #6b7280; margin: 10px 0 0 0;"><strong style="color: #ea580c;">Support:</strong> <a href="mailto:info@uniontab.com" style="color: #ea580c;">info@uniontab.com</a></p>
          <p style="font-size: 11px; color: #6b7280; font-style: italic; margin: 15px 0 0 0;">Powered by UnionTab</p>
          <p style="font-size: 11px; color: #6b7280; font-style: italic; margin: 3px 0 0 0;">Your Digital Union Platform</p>
        </div>
      </div>
    `;
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
              Generate a downloadable PDF instruction sheet with your union's branding to share with potential members.
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
                Download PDF
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
            dangerouslySetInnerHTML={{ __html: generatePreviewHTML() }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
