import sendgrid from '@sendgrid/mail';

// Initialize SendGrid with API key
const apiKey = process.env.SENDGRID_API_KEY;
if (apiKey) {
  sendgrid.setApiKey(apiKey);
}

const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@uniontab.com';
const fromName = process.env.SENDGRID_FROM_NAME || 'UnionTab';

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Send an email using SendGrid
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!apiKey) {
    console.error('SendGrid API key not configured');
    return false;
  }

  try {
    await sendgrid.send({
      to: options.to,
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject: options.subject,
      text: options.text,
      html: options.html || options.text,
    });

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  baseUrl: string
): Promise<boolean> {
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
          <h1 style="color: #2563eb; margin-bottom: 20px;">Password Reset Request</h1>
          <p>You recently requested to reset your password for your UnionTab account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a>
          </div>
          <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
          <p style="background-color: #e9ecef; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 14px;">${resetUrl}</p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">This link will expire in 1 hour.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">UnionTab - Union Management Platform</p>
        </div>
      </body>
    </html>
  `;

  const text = `
Password Reset Request

You recently requested to reset your password for your UnionTab account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email.

---
UnionTab - Union Management Platform
  `;

  return sendEmail({
    to: email,
    subject: 'Reset Your Password - UnionTab',
    html,
    text,
  });
}

/**
 * Send 2FA verification code email
 */
export async function send2FACodeEmail(
  email: string,
  code: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
          <h1 style="color: #2563eb; margin-bottom: 20px;">Two-Factor Authentication</h1>
          <p>Your verification code is:</p>
          <div style="background-color: #fff; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
            <h2 style="color: #2563eb; font-size: 36px; letter-spacing: 8px; margin: 0;">${code}</h2>
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request this code, please contact support immediately.</p>
          <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">UnionTab - Union Management Platform</p>
        </div>
      </body>
    </html>
  `;

  const text = `
Two-Factor Authentication

Your verification code is: ${code}

This code will expire in 10 minutes.

If you didn't request this code, please contact support immediately.

---
UnionTab - Union Management Platform
  `;

  return sendEmail({
    to: email,
    subject: 'Your Verification Code - UnionTab',
    html,
    text,
  });
}

/**
 * Send member notification email
 */
export async function sendMemberNotification(
  email: string,
  subject: string,
  message: string,
  unionName: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
          <h1 style="color: #2563eb; margin-bottom: 20px;">${unionName}</h1>
          <h2 style="color: #333; margin-bottom: 20px;">${subject}</h2>
          <div style="background-color: #fff; padding: 20px; border-radius: 5px; margin: 20px 0;">
            ${message}
          </div>
          <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">UnionTab - Union Management Platform</p>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `${unionName}: ${subject}`,
    html,
    text: message,
  });
}
