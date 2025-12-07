'use client';

import { useState } from 'react';
import { Copy, Download, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RegistrationShareWidgetProps {
  slug: string;
  unionName: string;
  localNumber?: string | null;
  logoUrl?: string | null;
}

export function RegistrationShareWidget({
  slug,
  unionName,
  localNumber,
  logoUrl,
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

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              padding: 40px 20px;
              line-height: 1.6;
            }
            .container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              border-radius: 20px;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 50px 40px;
              text-align: center;
              color: white;
              position: relative;
            }
            .logo-container {
              margin-bottom: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: ${logoUrl ? '120px' : '0'};
            }
            .logo {
              max-width: 200px;
              max-height: 120px;
              background: white;
              padding: 15px;
              border-radius: 15px;
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            }
            h1 {
              font-size: 2.5em;
              font-weight: 700;
              margin-bottom: 10px;
              text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            }
            .subtitle {
              font-size: 1.3em;
              opacity: 0.95;
              font-weight: 300;
            }
            .content {
              padding: 50px 40px;
            }
            .intro {
              text-align: center;
              margin-bottom: 40px;
              color: #444;
              font-size: 1.1em;
            }
            .steps {
              margin: 30px 0;
            }
            .step {
              display: flex;
              gap: 20px;
              margin-bottom: 30px;
              padding: 25px;
              background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
              border-radius: 15px;
              border-left: 5px solid #667eea;
              box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
            }
            .step-number {
              flex-shrink: 0;
              width: 50px;
              height: 50px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 1.5em;
              font-weight: bold;
              box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
            }
            .step-content h3 {
              color: #333;
              margin-bottom: 10px;
              font-size: 1.3em;
            }
            .step-content p {
              color: #555;
              line-height: 1.6;
            }
            .url-box {
              background: white;
              padding: 20px;
              border-radius: 10px;
              font-family: 'Courier New', monospace;
              font-size: 1.1em;
              color: #667eea;
              word-break: break-all;
              border: 2px dashed #667eea;
              margin-top: 10px;
              font-weight: 600;
            }
            .help-box {
              background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%);
              padding: 30px;
              border-radius: 15px;
              margin-top: 40px;
              text-align: center;
              box-shadow: 0 5px 15px rgba(253, 203, 110, 0.3);
            }
            .help-box h3 {
              color: #2d3436;
              margin-bottom: 15px;
              font-size: 1.5em;
            }
            .help-box p {
              color: #2d3436;
              font-size: 1.1em;
            }
            .help-box strong {
              color: #d63031;
              font-size: 1.2em;
            }
            .footer {
              text-align: center;
              padding: 30px;
              background: #f8f9fa;
              color: #6c757d;
              font-size: 0.9em;
            }
            .icon {
              display: inline-block;
              margin-right: 5px;
            }
            @media print {
              body {
                padding: 0;
                background: white;
              }
              .container {
                box-shadow: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
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
                <p><strong>Welcome!</strong> Follow these simple steps to join our union and become part of our community.</p>
              </div>

              <div class="steps">
                <div class="step">
                  <div class="step-number">1</div>
                  <div class="step-content">
                    <h3>🌐 Visit the Registration Link</h3>
                    <p>Open your web browser and go to:</p>
                    <div class="url-box">${registrationUrl}</div>
                  </div>
                </div>

                <div class="step">
                  <div class="step-number">2</div>
                  <div class="step-content">
                    <h3>📧 Create Your Account</h3>
                    <p>Sign up using your <strong>personal email address</strong>. Choose a strong password you'll remember. Do not use your work email.</p>
                  </div>
                </div>

                <div class="step">
                  <div class="step-number">3</div>
                  <div class="step-content">
                    <h3>✉️ Verify Your Email</h3>
                    <p>Check your email inbox (and spam folder!) for a verification email. Click the verification link to confirm your email address.</p>
                  </div>
                </div>

                <div class="step">
                  <div class="step-number">4</div>
                  <div class="step-content">
                    <h3>⏳ Wait for Approval</h3>
                    <p>Your membership application will be reviewed by our administrators. You'll receive an email notification once your account is approved and you can access all union features.</p>
                  </div>
                </div>
              </div>

              <div class="help-box">
                <h3>💬 Need Help?</h3>
                <p>If you encounter any issues during registration, please contact us at:</p>
                <p><strong>info@uniontab.com</strong></p>
              </div>
            </div>

            <div class="footer">
              <p>Powered by UnionTab • ${new Date().getFullYear()}</p>
            </div>
          </div>

          <script>
            // Auto-print when the page loads
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
