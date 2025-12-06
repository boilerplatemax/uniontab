import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/sendgrid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, message, role, unionName, localNumber } = body;

    // Validate required fields
    if (!name || !email || !message || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate role
    if (role !== 'executive' && role !== 'member') {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Create email content
    const subject = `New Contact Form Submission from ${name}`;

    const text = `
New Contact Form Submission

Name: ${name}
Email: ${email}
Role: ${role.charAt(0).toUpperCase() + role.slice(1)}
${unionName ? `Union Name: ${unionName}` : ''}
${localNumber ? `Local Number: ${localNumber}` : ''}

Message:
${message}

---
This message was sent from the UnionTab contact form.
Reply to this email to respond to ${name} at ${email}.
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
    .field {
      margin-bottom: 15px;
    }
    .field-label {
      font-weight: 600;
      color: #4b5563;
      margin-bottom: 5px;
    }
    .field-value {
      color: #1f2937;
    }
    .message-box {
      background-color: #f3f4f6;
      border-left: 4px solid #2563eb;
      padding: 15px;
      margin-top: 20px;
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
      <h1>New Contact Form Submission</h1>
    </div>
    <div class="content">
      <div class="field">
        <div class="field-label">Name:</div>
        <div class="field-value">${name}</div>
      </div>
      <div class="field">
        <div class="field-label">Email:</div>
        <div class="field-value"><a href="mailto:${email}">${email}</a></div>
      </div>
      <div class="field">
        <div class="field-label">Role:</div>
        <div class="field-value">${role.charAt(0).toUpperCase() + role.slice(1)}</div>
      </div>
      ${unionName ? `
      <div class="field">
        <div class="field-label">Union Name:</div>
        <div class="field-value">${unionName}</div>
      </div>
      ` : ''}
      ${localNumber ? `
      <div class="field">
        <div class="field-label">Local Number:</div>
        <div class="field-value">${localNumber}</div>
      </div>
      ` : ''}
      <div class="message-box">
        <div class="field-label">Message:</div>
        <div class="field-value" style="white-space: pre-wrap;">${message}</div>
      </div>
    </div>
    <div class="footer">
      <p>This message was sent from the UnionTab contact form.</p>
      <p>Reply to this email to respond to ${name}.</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    // Send email to info@uniontab.com
    await sendEmail({
      to: 'info@uniontab.com',
      subject,
      text,
      html,
    });

    return NextResponse.json(
      { success: true, message: 'Contact form submitted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing contact form:', error);
    return NextResponse.json(
      { error: 'Failed to process contact form' },
      { status: 500 }
    );
  }
}
