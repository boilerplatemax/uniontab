import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
const apiKey = process.env.SENDGRID_API_KEY;
if (apiKey) {
  sgMail.setApiKey(apiKey);
}

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@uniontab.com';
const FROM_NAME = process.env.SENDGRID_FROM_NAME || 'UnionTab';

interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendEmail({ to, subject, text, html }: SendEmailOptions) {
  if (!apiKey) {
    console.error('SendGrid API key not configured');
    throw new Error('Email service not configured');
  }

  try {
    await sgMail.send({
      to,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      subject,
      text,
      html,
    });

    console.log(`Email sent successfully to ${to}`);
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
  name: string
) {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;

  const subject = 'Reset Your Password - UnionTab';

  const text = `
Hi ${name},

You requested to reset your password for your UnionTab account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this password reset, please ignore this email.

Thanks,
The UnionTab Team
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
      <h1>UnionTab</h1>
    </div>
    <div class="content">
      <h2>Reset Your Password</h2>
      <p>Hi ${name},</p>
      <p>You requested to reset your password for your UnionTab account.</p>
      <p>Click the button below to reset your password:</p>
      <center>
        <a href="${resetUrl}" class="button">Reset Password</a>
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
      <p>© ${new Date().getFullYear()} UnionTab. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  await sendEmail({ to: email, subject, text, html });
}
