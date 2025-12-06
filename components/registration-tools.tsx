'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Download, Share2 } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface RegistrationToolsProps {
  slug: string;
  unionName: string;
  localNumber?: string | null;
  logoUrl?: string | null;
}

export function RegistrationTools({ slug, unionName, localNumber, logoUrl }: RegistrationToolsProps) {
  const [copied, setCopied] = useState(false);

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
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (2 * margin);

    // Colors
    const orangeColor = '#ea580c';
    const darkGray = '#1f2937';
    const mediumGray = '#374151';
    const lightGray = '#6b7280';
    const yellowBg = '#fef3c7';

    // Helper function to capitalize union name properly
    const formatUnionName = (name: string, localNum?: string | null) => {
      if (!localNum) return name.toUpperCase();
      // Extract acronym from union name if it exists (e.g., "ATU" from "Amalgamated Transit Union")
      const words = name.split(' ');
      const acronym = words.map(w => w[0]).join('').toUpperCase();
      return `${acronym} ${localNum}`;
    };

    // Title
    const formattedTitle = formatUnionName(unionName, localNumber);

    // Header background
    pdf.setFillColor(yellowBg);
    pdf.roundedRect(margin, margin, contentWidth, 35, 3, 3, 'F');

    // Title text
    pdf.setTextColor(orangeColor);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    let yPos = margin + 15;
    pdf.text(formattedTitle, margin + 5, yPos);

    pdf.setTextColor(darkGray);
    pdf.setFontSize(24);
    yPos += 12;
    pdf.text('Registration Instructions', margin + 5, yPos);

    // Instructions header
    yPos += 20;
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(mediumGray);
    pdf.text('Follow these steps to join:', margin, yPos);

    // Step 1
    yPos += 15;
    pdf.setFillColor(orangeColor);
    pdf.circle(margin + 5, yPos - 2, 5, 'F');
    pdf.setTextColor('#ffffff');
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('1', margin + 5, yPos, { align: 'center' });

    pdf.setTextColor(mediumGray);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Go to the registration link:', margin + 15, yPos);

    yPos += 8;
    pdf.setTextColor(orangeColor);
    pdf.setFont('courier', 'bold');
    pdf.setFontSize(11);
    // Make the URL clickable
    pdf.textWithLink(registrationUrl, margin + 15, yPos, { url: registrationUrl });

    // Step 2
    yPos += 20;
    pdf.setFillColor(orangeColor);
    pdf.circle(margin + 5, yPos - 2, 5, 'F');
    pdf.setTextColor('#ffffff');
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('2', margin + 5, yPos, { align: 'center' });

    pdf.setTextColor(mediumGray);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Sign up using your personal email address', margin + 15, yPos);

    yPos += 6;
    pdf.setTextColor(lightGray);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'italic');
    pdf.text('(DO NOT use your work email)', margin + 15, yPos);

    // Step 3
    yPos += 18;
    pdf.setFillColor(orangeColor);
    pdf.circle(margin + 5, yPos - 2, 5, 'F');
    pdf.setTextColor('#ffffff');
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('3', margin + 5, yPos, { align: 'center' });

    pdf.setTextColor(mediumGray);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Confirm your email address', margin + 15, yPos);

    yPos += 6;
    pdf.setTextColor(lightGray);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'italic');
    pdf.text('(Check your spam folder if you don\'t see it)', margin + 15, yPos);

    // Step 4
    yPos += 18;
    pdf.setFillColor(orangeColor);
    pdf.circle(margin + 5, yPos - 2, 5, 'F');
    pdf.setTextColor('#ffffff');
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('4', margin + 5, yPos, { align: 'center' });

    pdf.setTextColor(mediumGray);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Wait for an admin to approve your account', margin + 15, yPos);

    yPos += 6;
    pdf.setTextColor(lightGray);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'italic');
    pdf.text('(You\'ll be notified by email when approved)', margin + 15, yPos);

    // Need Help section
    yPos += 25;
    pdf.setFillColor(yellowBg);
    pdf.roundedRect(margin, yPos - 5, contentWidth, 40, 3, 3, 'F');

    yPos += 5;
    pdf.setTextColor(mediumGray);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Need Help?', margin + 5, yPos);

    yPos += 8;
    pdf.setTextColor(lightGray);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Contact your union administrator if you have any questions', margin + 5, yPos);

    yPos += 6;
    pdf.text('or issues with registration.', margin + 5, yPos);

    yPos += 10;
    pdf.setTextColor(orangeColor);
    pdf.setFont('helvetica', 'normal');
    // Make support email clickable
    pdf.textWithLink('Support: info@uniontab.com', margin + 5, yPos, { url: 'mailto:info@uniontab.com' });

    // Footer
    yPos = pageHeight - 20;
    pdf.setTextColor(lightGray);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'italic');
    pdf.text('Powered by UnionTab', margin, yPos);
    yPos += 5;
    pdf.text('Your Digital Union Platform', margin, yPos);

    // Save the PDF
    pdf.save(`${slug}-registration-instructions.pdf`);
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
              Registration Instructions PDF
            </p>
            <p className="text-sm text-gray-600 mb-3">
              Generate a downloadable PDF instruction sheet with your union's branding to share with potential members.
            </p>
            <Button
              onClick={handleDownload}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
