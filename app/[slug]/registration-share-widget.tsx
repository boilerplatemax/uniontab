'use client';

import { useState } from 'react';
import { Copy, Download, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getContrastColor, DEFAULT_THEME_COLOR } from '@/lib/utils/color';

interface RegistrationShareWidgetProps {
  slug: string;
  unionName: string;
  localNumber?: string | null;
  logoUrl?: string | null;
  themeColor?: string | null;
}

export function RegistrationShareWidget({
  slug,
  unionName,
  localNumber,
  logoUrl,
  themeColor,
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
    const title = `Join ${fullUnionName}`;
    const brandColor = themeColor || DEFAULT_THEME_COLOR;
    const textColor = getContrastColor(brandColor);

    // SVG icons for professional look
    const globeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`;
    const userPlusIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>`;
    const mailCheckIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/><path d="m16 19 2 2 4-4"/></svg>`;
    const clockIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
    const messageCircleIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            @page {
              margin: 0;
              size: letter portrait;
            }
            @media print {
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                height: 100% !important;
              }
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              print-color-adjust: exact !important;
              -webkit-print-color-adjust: exact !important;
              min-height: 100vh;
              display: flex;
              flex-direction: column;
            }
            .poster-content {
              display: flex;
              flex-direction: column;
              min-height: 100vh;
            }
            .header {
              background: ${brandColor};
              color: ${textColor};
              padding: 1.5rem 2rem;
              text-align: center;
            }
            .logo-container {
              margin-bottom: 0.75rem;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .logo {
              max-width: 80px;
              max-height: 60px;
              background: white;
              padding: 8px;
              border-radius: 8px;
            }
            h1 {
              font-size: 1.5em;
              font-weight: 700;
              margin-bottom: 0.25rem;
            }
            .subtitle {
              font-size: 1em;
              opacity: 0.9;
            }
            .content {
              flex: 1;
              padding: 1.25rem 1.5rem;
              display: flex;
              flex-direction: column;
            }
            .intro {
              text-align: center;
              margin-bottom: 1rem;
              color: #374151;
              font-size: 0.9em;
            }
            .steps {
              display: flex;
              flex-direction: column;
              gap: 0.75rem;
            }
            .step {
              display: flex;
              gap: 0.75rem;
              padding: 0.75rem;
              background: #f9fafb;
              border-radius: 8px;
              border-left: 3px solid ${brandColor};
              align-items: flex-start;
            }
            .step-number {
              flex-shrink: 0;
              width: 28px;
              height: 28px;
              background: ${brandColor};
              color: ${textColor};
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 0.875em;
              font-weight: bold;
            }
            .step-content {
              flex: 1;
            }
            .step-content h3 {
              color: #111827;
              margin-bottom: 0.25rem;
              font-size: 0.875em;
              display: flex;
              align-items: center;
              gap: 0.5rem;
            }
            .step-content h3 svg {
              color: ${brandColor};
              flex-shrink: 0;
            }
            .step-content p {
              color: #4b5563;
              font-size: 0.75em;
              line-height: 1.4;
            }
            .bottom-section {
              margin-top: auto;
              padding-top: 1rem;
              border-top: 1px solid #e5e7eb;
            }
            .url-section {
              text-align: center;
              margin-bottom: 1rem;
            }
            .url-label {
              font-size: 0.75rem;
              color: ${brandColor};
              text-transform: uppercase;
              letter-spacing: 0.05em;
              font-weight: 600;
              margin-bottom: 0.5rem;
            }
            .url-box {
              background: ${brandColor}15;
              padding: 0.75rem 1rem;
              border-radius: 8px;
              font-family: monospace;
              font-size: 0.875em;
              color: #374151;
              word-break: break-all;
              border: 2px dashed ${brandColor}40;
              font-weight: 600;
            }
            .help-box {
              background: #f3f4f6;
              padding: 0.75rem 1rem;
              border-radius: 8px;
              text-align: center;
              border: 1px solid #e5e7eb;
            }
            .help-box h3 {
              color: #374151;
              margin-bottom: 0.25rem;
              font-size: 0.875em;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 0.5rem;
            }
            .help-box h3 svg {
              color: ${brandColor};
            }
            .help-box p {
              color: #4b5563;
              font-size: 0.75em;
            }
            .footer {
              text-align: center;
              padding: 0.75rem 1.5rem;
              background: #f3f4f6;
              color: #6b7280;
              font-size: 0.75em;
              border-top: 1px solid #e5e7eb;
            }
          </style>
        </head>
        <body>
          <div class="poster-content">
            <div class="header">
              ${logoUrl ? `
                <div class="logo-container">
                  <img src="${logoUrl}" alt="${fullUnionName} Logo" class="logo" />
                </div>
              ` : ''}
              <h1>${fullUnionName}</h1>
              <div class="subtitle">Member Registration Guide</div>
            </div>

            <div class="content">
              <div class="intro">
                <p><strong>Welcome!</strong> Follow these steps to join our union.</p>
              </div>

              <div class="steps">
                <div class="step">
                  <div class="step-number">1</div>
                  <div class="step-content">
                    <h3>${globeIcon} Visit Registration Link</h3>
                    <p>Open your web browser and go to the link below.</p>
                  </div>
                </div>

                <div class="step">
                  <div class="step-number">2</div>
                  <div class="step-content">
                    <h3>${userPlusIcon} Create Your Account</h3>
                    <p>Sign up using your <strong>personal email</strong> (not work email).</p>
                  </div>
                </div>

                <div class="step">
                  <div class="step-number">3</div>
                  <div class="step-content">
                    <h3>${mailCheckIcon} Verify Your Email</h3>
                    <p>Check your inbox and spam folder for the verification email.</p>
                  </div>
                </div>

                <div class="step">
                  <div class="step-number">4</div>
                  <div class="step-content">
                    <h3>${clockIcon} Wait for Approval</h3>
                    <p>An admin will review and approve your membership.</p>
                  </div>
                </div>
              </div>

              <div class="bottom-section">
                <div class="url-section">
                  <p class="url-label">Registration Link</p>
                  <div class="url-box">${registrationUrl}</div>
                </div>

                <div class="help-box">
                  <h3>${messageCircleIcon} Need Help?</h3>
                  <p>Contact us at: <strong>info@uniontab.com</strong></p>
                </div>
              </div>
            </div>

            <div class="footer">
              <p>Powered by UnionTab · ${new Date().getFullYear()}</p>
            </div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
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
