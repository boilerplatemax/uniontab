'use client';

import { useState } from 'react';
import { Copy, Download, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RegistrationShareWidgetProps {
  slug: string;
  unionName: string;
  localNumber?: string | null;
}

export function RegistrationShareWidget({
  slug,
  unionName,
  localNumber,
}: RegistrationShareWidgetProps) {
  const [copied, setCopied] = useState(false);
  const registrationUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/${slug}/sign-up`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(registrationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleGeneratePDF = () => {
    // Create the PDF content as an HTML page
    const pdfWindow = window.open('', '_blank');
    if (!pdfWindow) return;

    const fullUnionName = localNumber
      ? `${unionName.toUpperCase()} LOCAL ${localNumber}`
      : unionName.toUpperCase();
    const title = `${fullUnionName} Registration Instructions`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              max-width: 800px;
              margin: 40px auto;
              padding: 20px;
              line-height: 1.6;
            }
            h1 {
              color: #1e40af;
              border-bottom: 3px solid #1e40af;
              padding-bottom: 10px;
              margin-bottom: 30px;
            }
            .step {
              margin: 20px 0;
              padding: 15px;
              background-color: #f3f4f6;
              border-radius: 8px;
            }
            .step-number {
              font-weight: bold;
              color: #1e40af;
              font-size: 1.2em;
              margin-bottom: 5px;
            }
            .url {
              background-color: #fff;
              padding: 10px;
              border-radius: 4px;
              font-family: monospace;
              margin: 10px 0;
              border: 1px solid #d1d5db;
            }
            .contact {
              margin-top: 30px;
              padding: 15px;
              background-color: #fef3c7;
              border-radius: 8px;
            }
            @media print {
              body {
                margin: 0;
                padding: 40px;
              }
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>

          <div class="step">
            <div class="step-number">Step 1: Go to the registration link</div>
            <div class="url">${registrationUrl}</div>
          </div>

          <div class="step">
            <div class="step-number">Step 2: Sign up using personal email</div>
            <p>Please use your personal email address, not your work email.</p>
          </div>

          <div class="step">
            <div class="step-number">Step 3: Confirm your email</div>
            <p>Check your email inbox (and spam folder) for a confirmation email and click the verification link.</p>
          </div>

          <div class="step">
            <div class="step-number">Step 4: Wait for admin approval</div>
            <p>Your account will need to be approved by an administrator. You will be notified by email once your account is approved.</p>
          </div>

          <div class="contact">
            <strong>Need Help?</strong><br>
            If you have any issues, please email: <strong>info@uniontab.com</strong>
          </div>

          <script>
            // Auto-print when the page loads
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    pdfWindow.document.write(htmlContent);
    pdfWindow.document.close();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Share Registration Link</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm font-mono overflow-x-auto">
            {registrationUrl}
          </div>
          <Button
            onClick={handleCopyLink}
            variant="outline"
            size="sm"
            className="flex-shrink-0"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </>
            )}
          </Button>
        </div>
        <Button
          onClick={handleGeneratePDF}
          variant="default"
          size="sm"
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
        >
          <Download className="h-4 w-4 mr-2" />
          Generate PDF Instructions
        </Button>
      </CardContent>
    </Card>
  );
}
