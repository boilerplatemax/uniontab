interface UnionBranding {
  name: string;
  logoUrl: string | null;
  coverPhotoUrl: string | null;
}

interface EmailTemplateOptions {
  union: UnionBranding;
  recipientName: string | null;
  subject: string;
  htmlContent: string;
}

export function generateUnionBrandedEmail({
  union,
  recipientName,
  subject,
  htmlContent
}: EmailTemplateOptions): { text: string; html: string } {
  const greeting = recipientName ? `Hi ${recipientName},` : 'Hello,';

  // Convert HTML content to plain text (basic conversion)
  const textContent = htmlContent
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();

  const text = `
${greeting}

${textContent}

---
${union.name}
Powered by UnionTab
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f3f4f6;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .email-header {
      background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
      padding: 0;
      position: relative;
      height: 120px;
      overflow: hidden;
    }
    .email-header-cover {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .email-header-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(37, 99, 235, 0.8) 0%, rgba(30, 64, 175, 0.8) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .email-logo-container {
      text-align: center;
    }
    .email-logo {
      max-height: 80px;
      max-width: 200px;
      height: auto;
      width: auto;
      object-fit: contain;
    }
    .email-union-name {
      color: white;
      font-size: 24px;
      font-weight: bold;
      margin: 0;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    .email-content {
      padding: 40px 30px;
    }
    .email-greeting {
      font-size: 16px;
      color: #374151;
      margin-bottom: 20px;
    }
    .email-body {
      font-size: 15px;
      color: #4b5563;
      line-height: 1.7;
    }
    .email-body p {
      margin: 0 0 16px 0;
    }
    .email-body p:last-child {
      margin-bottom: 0;
    }
    .email-body a {
      color: #2563eb;
      text-decoration: none;
    }
    .email-body a:hover {
      text-decoration: underline;
    }
    .email-body ul,
    .email-body ol {
      margin: 16px 0;
      padding-left: 24px;
    }
    .email-body li {
      margin: 8px 0;
    }
    .email-body strong {
      font-weight: 600;
      color: #1f2937;
    }
    .email-body em {
      font-style: italic;
    }
    .email-body blockquote {
      border-left: 4px solid #e5e7eb;
      padding-left: 16px;
      margin: 16px 0;
      color: #6b7280;
      font-style: italic;
    }
    .email-footer {
      background-color: #f9fafb;
      padding: 24px 30px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
    }
    .email-footer-text {
      font-size: 14px;
      color: #6b7280;
      margin: 8px 0;
    }
    .email-footer-link {
      color: #2563eb;
      text-decoration: none;
    }
    .email-footer-link:hover {
      text-decoration: underline;
    }
    @media only screen and (max-width: 600px) {
      .email-content {
        padding: 30px 20px;
      }
      .email-footer {
        padding: 20px 15px;
      }
      .email-header {
        height: 100px;
      }
      .email-logo {
        max-height: 60px;
      }
      .email-union-name {
        font-size: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header with Union Branding -->
    <div class="email-header">
      ${
        union.coverPhotoUrl
          ? `<img src="${union.coverPhotoUrl}" alt="${union.name}" class="email-header-cover" />`
          : ''
      }
      <div class="email-header-overlay">
        <div class="email-logo-container">
          ${
            union.logoUrl
              ? `<img src="${union.logoUrl}" alt="${union.name}" class="email-logo" />`
              : `<h1 class="email-union-name">${union.name}</h1>`
          }
        </div>
      </div>
    </div>

    <!-- Email Content -->
    <div class="email-content">
      <p class="email-greeting">${greeting}</p>
      <div class="email-body">
        ${htmlContent}
      </div>
    </div>

    <!-- Footer -->
    <div class="email-footer">
      <p class="email-footer-text"><strong>${union.name}</strong></p>
      <p class="email-footer-text">
        Powered by <a href="https://uniontab.com" class="email-footer-link">UnionTab</a>
      </p>
      <p class="email-footer-text" style="font-size: 12px; margin-top: 12px;">
        © ${new Date().getFullYear()} ${union.name}. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return { text, html };
}
