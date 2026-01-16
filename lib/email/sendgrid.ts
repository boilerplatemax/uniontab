import sgMail from '@sendgrid/mail';
import { db } from '@/lib/db/drizzle';
import { unionEmailDomains } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { checkRateLimit, incrementRateLimitCounters } from './rate-limits';
import { getEmailAddress } from './subdomain';
import { getContrastColor, DEFAULT_THEME_COLOR } from '@/lib/utils/color';

/**
 * Generate a darker shade of a hex color for gradient effects
 */
function getDarkerShade(hexColor: string, factor: number = 0.2): string {
  const hex = hexColor.replace('#', '');
  if (hex.length !== 6) return '#1e40af'; // Default darker blue

  const r = Math.max(0, Math.floor(parseInt(hex.substr(0, 2), 16) * (1 - factor)));
  const g = Math.max(0, Math.floor(parseInt(hex.substr(2, 2), 16) * (1 - factor)));
  const b = Math.max(0, Math.floor(parseInt(hex.substr(4, 2), 16) * (1 - factor)));

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Initialize SendGrid with API key
const apiKey = process.env.SENDGRID_API_KEY;
if (apiKey) {
  sgMail.setApiKey(apiKey);
}

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@uniontab.com';
const FROM_NAME = process.env.SENDGRID_FROM_NAME || 'UnionTab';

// Validate SendGrid configuration
if (apiKey && !process.env.SENDGRID_FROM_EMAIL) {
  console.warn(
    'Warning: SENDGRID_FROM_EMAIL not set. Using default. ' +
    'Make sure to verify this email in SendGrid: https://sendgrid.com/docs/for-developers/sending-email/sender-identity/'
  );
}

interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
  unionId?: number; // Optional: Use tenant-specific subdomain if verified
  fromLocalPart?: string; // Optional: Override FROM local part (default: 'notify')
}

/**
 * Get FROM email address for a union
 * Uses union's custom subdomain if available and not blocked, falls back to default.
 *
 * Note: We use the custom subdomain even if verification is still pending/failed,
 * as long as DNS records are created in Cloudflare. SendGrid can still send emails
 * from unverified domains - verification primarily affects DKIM signing which
 * improves deliverability but isn't required for sending.
 */
async function getFromEmail(
  unionId?: number,
  fromLocalPart: string = 'notify'
): Promise<{ email: string; name: string }> {
  // If no unionId, use default
  if (!unionId) {
    return {
      email: FROM_EMAIL,
      name: FROM_NAME,
    };
  }

  try {
    // Check if union has a configured email domain
    const emailDomain = await db
      .select()
      .from(unionEmailDomains)
      .where(eq(unionEmailDomains.unionId, unionId))
      .limit(1);

    // If domain exists and is not blocked, use it (regardless of verification status)
    // The subdomain DNS records should be set up in Cloudflare for sending to work
    if (emailDomain.length > 0 && !emailDomain[0].isBlocked) {
      console.log(`Using custom domain for union ${unionId}: ${emailDomain[0].subdomain} (verification: ${emailDomain[0].verificationStatus})`);
      return {
        email: getEmailAddress(emailDomain[0].subdomain, fromLocalPart),
        name: FROM_NAME,
      };
    }
  } catch (error) {
    console.error(`Failed to get email domain for union ${unionId}:`, error);
  }

  // Fall back to default
  return {
    email: FROM_EMAIL,
    name: FROM_NAME,
  };
}

/**
 * Send a transactional email
 * NOTE: Regular emails (password reset, verification, etc.) should NOT pass unionId
 * to ensure they use noreply@uniontab.com. Only mass emails should pass unionId
 * to use custom subdomains.
 */
export async function sendEmail({ to, subject, text, html, unionId, fromLocalPart }: SendEmailOptions) {
  if (!apiKey) {
    console.error('SendGrid API key not configured');
    throw new Error('Email service not configured');
  }

  // Check rate limits if unionId is provided (mass emails only)
  if (unionId) {
    const rateLimitCheck = await checkRateLimit(unionId);

    if (!rateLimitCheck.allowed) {
      throw new Error(`Rate limit exceeded: ${rateLimitCheck.reason}`);
    }
  }

  // Get FROM email (subdomain for mass emails, default for regular emails)
  const fromEmail = await getFromEmail(unionId, fromLocalPart);

  try {
    await sgMail.send({
      to,
      from: fromEmail,
      subject,
      text,
      html,
    });

    console.log(`Email sent successfully to ${to} from ${fromEmail.email}`);

    // Increment rate limit counters if unionId is provided
    if (unionId) {
      await incrementRateLimitCounters(unionId);
    }
  } catch (error: any) {
    console.error('Error sending email:', error);
    if (error.response) {
      console.error('SendGrid error response:', error.response.body);
    }
    throw new Error('Failed to send email');
  }
}

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  name: string,
  unionInfo?: { name: string; localNumber: string | null } | null
) {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;

  // Include union info in subject line for better UX
  const unionName = unionInfo ? `${unionInfo.name}${unionInfo.localNumber ? ` Local ${unionInfo.localNumber}` : ''}` : 'UnionTab';
  const subject = `Reset Your Password - ${unionName}`;

  const text = `
Hi ${name},

You requested to reset your password for your ${unionInfo ? unionName : 'UnionTab'} account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this password reset, please ignore this email.

Thanks,
${unionInfo ? `The ${unionName} Team` : 'The UnionTab Team'}
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #f9fafb;
      border-radius: 8px;
      padding: 30px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #2563eb;
      margin: 0;
    }
    .content {
      background-color: white;
      border-radius: 8px;
      padding: 30px;
      margin-bottom: 20px;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background-color: #2563eb;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${unionInfo ? unionName : 'UnionTab'}</h1>
    </div>
    <div class="content">
      <h2>Reset Your Password</h2>
      <p>Hi ${name},</p>
      <p>You requested to reset your password for your ${unionInfo ? unionName : 'UnionTab'} account.</p>
      <p>Click the button below to reset your password:</p>
      <center>
        <a href="${resetUrl}" class="button" style="display: inline-block; padding: 12px 30px; background-color: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 6px; margin: 20px 0;">Reset Password</a>
      </center>
      <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
        Or copy and paste this link into your browser:<br>
        <a href="${resetUrl}" style="word-break: break-all;">${resetUrl}</a>
      </p>
      <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
        This link will expire in 1 hour.
      </p>
      <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
        If you didn't request this password reset, please ignore this email.
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} ${unionInfo ? unionName : 'UnionTab'}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  await sendEmail({ to: email, subject, text, html });
}

export async function sendEmailVerification(
  email: string,
  verificationToken: string,
  name: string,
  unionInfo?: { name: string; localNumber: string | null } | null
) {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const verificationUrl = `${baseUrl}/auth/verify-email?token=${verificationToken}`;

  const unionNameRaw = unionInfo ? `${unionInfo.name}${unionInfo.localNumber ? ` Local ${unionInfo.localNumber}` : ''}` : 'UnionTab';
  const unionName = unionInfo ? unionNameRaw.toUpperCase() : unionNameRaw;
  const subject = `Verify Your Email - ${unionName}`;

  const text = `
Hi ${name},

Thank you for signing up for ${unionName}!

Please verify your email address by clicking the link below:
${verificationUrl}

This link will expire in 24 hours.

IMPORTANT: After verifying your email, your membership application will need to be reviewed and approved by an administrator. You will receive another email once your application has been reviewed.

If you didn't create an account with ${unionName}, please ignore this email.

Thanks,
The ${unionName} Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #f9fafb;
      border-radius: 8px;
      padding: 30px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #2563eb;
      margin: 0;
    }
    .content {
      background-color: white;
      border-radius: 8px;
      padding: 30px;
      margin-bottom: 20px;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background-color: #2563eb;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .info-box {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${unionName}</h1>
    </div>
    <div class="content">
      <h2>Verify Your Email Address</h2>
      <p>Hi ${name},</p>
      <p>Thank you for signing up for ${unionName}! We're excited to have you on board.</p>
      <p>Please click the button below to verify your email address:</p>
      <center>
        <a href="${verificationUrl}" class="button" style="display: inline-block; padding: 12px 30px; background-color: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 6px; margin: 20px 0;">Verify Email Address</a>
      </center>
      <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
        Or copy and paste this link into your browser:<br>
        <a href="${verificationUrl}" style="word-break: break-all;">${verificationUrl}</a>
      </p>
      <div class="info-box">
        <p style="margin: 0; font-weight: 600; color: #92400e;">Next Steps:</p>
        <p style="margin: 10px 0 0 0; color: #92400e;">After verifying your email, your membership application will need to be reviewed and approved by an administrator. You will receive another email once your application has been reviewed.</p>
      </div>
      <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
        This link will expire in 24 hours.
      </p>
      <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
        If you didn't create an account with ${unionName}, please ignore this email.
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} ${unionName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  await sendEmail({ to: email, subject, text, html });
}

export async function sendMembershipApprovalEmail(
  email: string,
  name: string,
  unionInfo: { name: string; localNumber: string | null; slug: string }
) {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const unionUrl = `${baseUrl}/${unionInfo.slug}`;

  const unionName = `${unionInfo.name}${unionInfo.localNumber ? ` Local ${unionInfo.localNumber}` : ''}`.toUpperCase();
  const subject = `Membership Approved - ${unionName}`;

  const text = `
Hi ${name},

Great news! Your membership application for ${unionName} has been approved!

You now have full access to the union platform. Visit your union page:
${unionUrl}

Thank you for joining ${unionName}!

Best regards,
The ${unionName} Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #f9fafb;
      border-radius: 8px;
      padding: 30px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #2563eb;
      margin: 0;
    }
    .content {
      background-color: white;
      border-radius: 8px;
      padding: 30px;
      margin-bottom: 20px;
    }
    .success-box {
      background-color: #d1fae5;
      border-left: 4px solid #10b981;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background-color: #10b981;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${unionName}</h1>
    </div>
    <div class="content">
      <h2>🎉 Membership Approved!</h2>
      <p>Hi ${name},</p>
      <div class="success-box">
        <p style="margin: 0; font-weight: 600; color: #065f46;">Great news!</p>
        <p style="margin: 10px 0 0 0; color: #065f46;">Your membership application for ${unionName} has been approved!</p>
      </div>
      <p>You now have full access to the union platform, including:</p>
      <ul>
        <li>Union news and announcements</li>
        <li>Member resources and documents</li>
        <li>Event calendar and RSVP</li>
        <li>Community discussions</li>
      </ul>
      <p>Click the button below to access your union page:</p>
      <center>
        <a href="${unionUrl}" class="button" style="display: inline-block; padding: 12px 30px; background-color: #10b981; color: #ffffff !important; text-decoration: none; border-radius: 6px; margin: 20px 0;">Visit Union Page</a>
      </center>
      <p>Thank you for joining ${unionName}!</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} ${unionName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  await sendEmail({ to: email, subject, text, html });
}

export async function sendMembershipRejectionEmail(
  email: string,
  name: string,
  unionInfo: { name: string; localNumber: string | null }
) {
  const unionName = `${unionInfo.name}${unionInfo.localNumber ? ` Local ${unionInfo.localNumber}` : ''}`;
  const subject = `Membership Application Update - ${unionName}`;

  const text = `
Hi ${name},

Thank you for your interest in ${unionName}.

After reviewing your application, we are unable to approve your membership at this time.

If you have questions about this decision or believe this was a mistake, please contact the union administrators directly.

Best regards,
The ${unionName} Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #f9fafb;
      border-radius: 8px;
      padding: 30px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #2563eb;
      margin: 0;
    }
    .content {
      background-color: white;
      border-radius: 8px;
      padding: 30px;
      margin-bottom: 20px;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${unionName}</h1>
    </div>
    <div class="content">
      <h2>Membership Application Update</h2>
      <p>Hi ${name},</p>
      <p>Thank you for your interest in ${unionName}.</p>
      <p>After reviewing your application, we are unable to approve your membership at this time.</p>
      <p>If you have questions about this decision or believe this was a mistake, please contact the union administrators directly.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} ${unionName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  await sendEmail({ to: email, subject, text, html });
}

/**
 * Send a member invitation email
 * This is used to directly invite potential members via email
 */
export async function sendMemberInviteEmail(
  email: string,
  unionInfo: { name: string; localNumber: string | null; slug: string },
  inviterName?: string
) {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const signUpUrl = `${baseUrl}/${unionInfo.slug}/sign-up`;

  const unionName = `${unionInfo.name}${unionInfo.localNumber ? ` Local ${unionInfo.localNumber}` : ''}`.toUpperCase();
  const subject = `You're Invited to Join ${unionName}`;

  const invitedByText = inviterName ? `${inviterName} has invited you to join` : 'You have been invited to join';

  const text = `
${invitedByText} ${unionName}!

Join your fellow union members on our member platform where you can:
- Stay up-to-date with union news and announcements
- Access important documents and resources
- Connect with other members
- Participate in union events

Click the link below to sign up:
${signUpUrl}

After signing up, your membership will be reviewed and approved by an administrator.

If you have any questions, please contact your union representatives.

Best regards,
The ${unionName} Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #f9fafb;
      border-radius: 8px;
      padding: 30px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #2563eb;
      margin: 0;
    }
    .content {
      background-color: white;
      border-radius: 8px;
      padding: 30px;
      margin-bottom: 20px;
    }
    .invite-box {
      background-color: #dbeafe;
      border-left: 4px solid #2563eb;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background-color: #2563eb;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .benefits-list {
      margin: 15px 0;
      padding-left: 20px;
    }
    .benefits-list li {
      margin: 8px 0;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${unionName}</h1>
    </div>
    <div class="content">
      <h2>You're Invited!</h2>
      <div class="invite-box">
        <p style="margin: 0; font-weight: 600; color: #1e40af;">${invitedByText} ${unionName}!</p>
      </div>
      <p>Join your fellow union members on our member platform where you can:</p>
      <ul class="benefits-list">
        <li>Stay up-to-date with union news and announcements</li>
        <li>Access important documents and resources</li>
        <li>Connect with other members</li>
        <li>Participate in union events</li>
      </ul>
      <p>Click the button below to create your account:</p>
      <center>
        <a href="${signUpUrl}" class="button" style="display: inline-block; padding: 12px 30px; background-color: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 6px; margin: 20px 0;">Join Now</a>
      </center>
      <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
        Or copy and paste this link into your browser:<br>
        <a href="${signUpUrl}" style="word-break: break-all;">${signUpUrl}</a>
      </p>
      <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
        After signing up, your membership will be reviewed and approved by an administrator.
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} ${unionName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  await sendEmail({ to: email, subject, text, html });
}

interface SendMassEmailOptions {
  to: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  unionInfo: {
    id?: number; // Union ID for rate limiting and subdomain
    name: string;
    localNumber: string | null;
    logoUrl?: string | null;
    themeColor?: string | null; // Custom brand color for email header
  };
  attachments?: Array<{
    content?: string;
    filename: string;
    type?: string;
    disposition?: string;
    contentId?: string;
    url?: string;
  }>;
}

interface SendMeetingInviteOptions {
  to: string;
  memberName: string;
  meeting: {
    title: string;
    description: string | null;
    scheduledDate: Date;
    startTime: string;
    endTime: string | null;
    timezone: string;
    platform: string;
    meetingLink: string | null;
    meetingPassword: string | null;
  };
  unionInfo: {
    id?: number;
    name: string;
    localNumber: string | null;
    logoUrl?: string | null;
    slug: string;
    themeColor?: string | null; // Custom brand color for email header
  };
}

export async function sendMassEmail({
  to,
  subject,
  htmlContent,
  textContent,
  unionInfo,
  attachments,
}: SendMassEmailOptions) {
  if (!apiKey) {
    console.error('SendGrid API key not configured');
    throw new Error('Email service not configured');
  }

  // Check rate limits if unionId is provided
  if (unionInfo.id) {
    const rateLimitCheck = await checkRateLimit(unionInfo.id);

    if (!rateLimitCheck.allowed) {
      throw new Error(`Rate limit exceeded: ${rateLimitCheck.reason}`);
    }
  }

  // Get FROM email (subdomain or default)
  const fromEmail = await getFromEmail(unionInfo.id, 'notify');

  const unionName = `${unionInfo.name}${unionInfo.localNumber ? ` Local ${unionInfo.localNumber}` : ''}`;
  const unionNameUppercase = unionName.toUpperCase();

  // Get theme colors for email header
  const themeColor = unionInfo.themeColor || DEFAULT_THEME_COLOR;
  const darkerShade = getDarkerShade(themeColor);
  const headerTextColor = getContrastColor(themeColor);

  // Wrap the user's HTML content in a branded email template
  const brandedHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f9fafb;
    }
    .email-container {
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .email-header {
      background: linear-gradient(135deg, ${themeColor} 0%, ${darkerShade} 100%);
      color: ${headerTextColor};
      padding: 30px;
      text-align: center;
    }
    .email-header img {
      max-width: 150px;
      max-height: 80px;
      margin-bottom: 15px;
    }
    .email-header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .email-body {
      padding: 30px;
    }
    .email-body img {
      max-width: 100%;
      height: auto;
    }
    .email-body a {
      color: ${themeColor};
      text-decoration: none;
    }
    .email-body a:hover {
      text-decoration: underline;
    }
    .email-footer {
      background-color: #f9fafb;
      padding: 20px 30px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header" style="background: linear-gradient(135deg, ${themeColor} 0%, ${darkerShade} 100%); color: ${headerTextColor};">
      ${unionInfo.logoUrl ? `<img src="${unionInfo.logoUrl}" alt="${unionNameUppercase} Logo">` : ''}
      <h1 style="color: ${headerTextColor};">${unionNameUppercase}</h1>
    </div>
    <div class="email-body">
      ${htmlContent}
    </div>
    <div class="email-footer">
      <p>This email was sent by ${unionNameUppercase}</p>
      <p>© ${new Date().getFullYear()} ${unionNameUppercase}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  try {
    await sgMail.send({
      to,
      from: {
        email: fromEmail.email,
        name: unionNameUppercase,
      },
      subject,
      text: textContent,
      html: brandedHtml,
      attachments: attachments
        ?.filter((att) => att.content && att.type && att.filename)
        .map((att) => ({
          content: att.content!,
          filename: att.filename,
          type: att.type!,
          disposition: att.disposition || 'attachment',
          ...(att.contentId && { contentId: att.contentId }),
        })),
    });

    console.log(`Mass email sent successfully to ${to} from ${fromEmail.email}`);

    // Increment rate limit counters if unionId is provided
    if (unionInfo.id) {
      await incrementRateLimitCounters(unionInfo.id);
    }
  } catch (error: any) {
    console.error('Error sending mass email:', error);
    if (error.response) {
      console.error('SendGrid error response:', error.response.body);
    }
    throw new Error(`Failed to send email to ${to}: ${error.message}`);
  }
}

export async function sendMeetingInviteEmail({
  to,
  memberName,
  meeting,
  unionInfo,
}: SendMeetingInviteOptions) {
  if (!apiKey) {
    console.error('SendGrid API key not configured');
    throw new Error('Email service not configured');
  }

  // Check rate limits if unionId is provided
  if (unionInfo.id) {
    const rateLimitCheck = await checkRateLimit(unionInfo.id);
    if (!rateLimitCheck.allowed) {
      throw new Error(`Rate limit exceeded: ${rateLimitCheck.reason}`);
    }
  }

  // Get FROM email
  const fromEmail = await getFromEmail(unionInfo.id, 'meetings');

  const unionName = `${unionInfo.name}${unionInfo.localNumber ? ` Local ${unionInfo.localNumber}` : ''}`;
  const unionNameUppercase = unionName.toUpperCase();

  // Get theme colors for email header
  const themeColor = unionInfo.themeColor || DEFAULT_THEME_COLOR;
  const darkerShade = getDarkerShade(themeColor);
  const headerTextColor = getContrastColor(themeColor);

  // Format date and time
  const meetingDate = new Date(meeting.scheduledDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const startTimeFormatted = formatTime(meeting.startTime);
  const endTimeFormatted = meeting.endTime ? formatTime(meeting.endTime) : null;
  const timeRange = endTimeFormatted
    ? `${startTimeFormatted} - ${endTimeFormatted}`
    : startTimeFormatted;

  const platformName = meeting.platform === 'zoom' ? 'Zoom' :
                       meeting.platform === 'google_meet' ? 'Google Meet' :
                       'Video Conference';

  const subject = `Meeting Invitation: ${meeting.title} - ${unionName}`;

  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const meetingPageUrl = `${baseUrl}/${unionInfo.slug}/meetings`;

  const text = `
Hi ${memberName},

You are invited to a ${unionName} online meeting!

Meeting: ${meeting.title}
Date: ${meetingDate}
Time: ${timeRange} (${meeting.timezone})
Platform: ${platformName}
${meeting.meetingLink ? `Join Link: ${meeting.meetingLink}` : ''}
${meeting.meetingPassword ? `Password: ${meeting.meetingPassword}` : ''}

${meeting.description ? `About this meeting:\n${meeting.description}` : ''}

View all meetings: ${meetingPageUrl}

We hope to see you there!

Best regards,
The ${unionName} Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f9fafb;
    }
    .email-container {
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .email-header {
      background: linear-gradient(135deg, ${themeColor} 0%, ${darkerShade} 100%);
      color: ${headerTextColor};
      padding: 30px;
      text-align: center;
    }
    .email-header img {
      max-width: 100px;
      max-height: 60px;
      margin-bottom: 15px;
    }
    .email-header h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }
    .email-body {
      padding: 30px;
    }
    .meeting-card {
      background-color: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .meeting-title {
      font-size: 22px;
      font-weight: bold;
      color: ${darkerShade};
      margin-bottom: 15px;
    }
    .meeting-detail {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
      color: #374151;
    }
    .meeting-detail-icon {
      width: 20px;
      margin-right: 10px;
      color: ${themeColor};
    }
    .join-button {
      display: inline-block;
      padding: 14px 30px;
      background-color: ${themeColor};
      color: ${headerTextColor} !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .join-button:hover {
      background-color: ${darkerShade};
    }
    .password-box {
      background-color: #fef3c7;
      border: 1px solid #fbbf24;
      border-radius: 4px;
      padding: 10px 15px;
      margin: 15px 0;
      font-size: 14px;
    }
    .description {
      background-color: #f9fafb;
      border-radius: 4px;
      padding: 15px;
      margin-top: 20px;
    }
    .email-footer {
      background-color: #f9fafb;
      padding: 20px 30px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header" style="background: linear-gradient(135deg, ${themeColor} 0%, ${darkerShade} 100%); color: ${headerTextColor};">
      ${unionInfo.logoUrl ? `<img src="${unionInfo.logoUrl}" alt="${unionNameUppercase} Logo">` : ''}
      <h1 style="color: ${headerTextColor};">${unionNameUppercase}</h1>
    </div>
    <div class="email-body">
      <p>Hi ${memberName},</p>
      <p>You are invited to an online meeting!</p>

      <div class="meeting-card">
        <div class="meeting-title" style="color: ${darkerShade};">${meeting.title}</div>

        <div class="meeting-detail">
          <span class="meeting-detail-icon" style="color: ${themeColor};">&#128197;</span>
          <strong>${meetingDate}</strong>
        </div>

        <div class="meeting-detail">
          <span class="meeting-detail-icon" style="color: ${themeColor};">&#128336;</span>
          <span>${timeRange} (${meeting.timezone})</span>
        </div>

        <div class="meeting-detail">
          <span class="meeting-detail-icon" style="color: ${themeColor};">&#128187;</span>
          <span>${platformName}</span>
        </div>

        ${meeting.meetingLink ? `
        <center>
          <a href="${meeting.meetingLink}" class="join-button" style="background-color: ${themeColor}; color: ${headerTextColor};">Join Meeting</a>
        </center>
        ` : ''}

        ${meeting.meetingPassword ? `
        <div class="password-box">
          <strong>Meeting Password:</strong> ${meeting.meetingPassword}
        </div>
        ` : ''}
      </div>

      ${meeting.description ? `
      <div class="description">
        <strong>About this meeting:</strong>
        <p>${meeting.description}</p>
      </div>
      ` : ''}

      <p style="margin-top: 20px;">We hope to see you there!</p>

      <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
        <a href="${meetingPageUrl}" style="color: ${themeColor};">View all meetings</a>
      </p>
    </div>
    <div class="email-footer">
      <p>This invitation was sent by ${unionNameUppercase}</p>
      <p>&copy; ${new Date().getFullYear()} ${unionNameUppercase}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  try {
    await sgMail.send({
      to,
      from: {
        email: fromEmail.email,
        name: unionNameUppercase,
      },
      subject,
      text,
      html,
    });

    console.log(`Meeting invite sent successfully to ${to}`);

    // Increment rate limit counters if unionId is provided
    if (unionInfo.id) {
      await incrementRateLimitCounters(unionInfo.id);
    }
  } catch (error: any) {
    console.error('Error sending meeting invite:', error);
    if (error.response) {
      console.error('SendGrid error response:', error.response.body);
    }
    throw new Error(`Failed to send meeting invite to ${to}: ${error.message}`);
  }
}
