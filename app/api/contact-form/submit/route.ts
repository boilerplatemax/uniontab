import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { contactFormSubmissions, unionContactInfo, unions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sendEmail } from '@/lib/email/sendgrid';
import {
  checkRateLimit,
  getClientIp,
  contactFormRateLimit,
} from '@/lib/utils/rate-limit';

export async function POST(request: Request) {
  try {
    // Apply rate limiting first to prevent abuse
    const clientIp = getClientIp(request);
    const rateLimitResult = checkRateLimit(clientIp, contactFormRateLimit);

    if (!rateLimitResult.success) {
      const retryAfterSeconds = Math.ceil((rateLimitResult.retryAfterMs || 0) / 1000);
      return NextResponse.json(
        {
          error: 'Too many submissions. Please try again later.',
          retryAfter: retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfterSeconds.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          },
        }
      );
    }

    const { unionId, name, email, phone, subject, message } = await request.json();

    if (!unionId || !name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Get union and contact info
    const [union] = await db
      .select()
      .from(unions)
      .where(eq(unions.id, unionId))
      .limit(1);

    if (!union) {
      return NextResponse.json(
        { error: 'Union not found' },
        { status: 404 }
      );
    }

    const [contactInfo] = await db
      .select()
      .from(unionContactInfo)
      .where(eq(unionContactInfo.unionId, unionId))
      .limit(1);

    // Check if contact form is enabled
    if (contactInfo && !contactInfo.contactFormEnabled) {
      return NextResponse.json(
        { error: 'Contact form is disabled for this union' },
        { status: 400 }
      );
    }

    // Get the IP address
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : null;

    // Save the submission to the database
    const [submission] = await db
      .insert(contactFormSubmissions)
      .values({
        unionId,
        name,
        email,
        phone: phone || null,
        subject: subject || null,
        message,
        ipAddress,
      })
      .returning();

    // Send email notification if configured
    const recipientEmail = contactInfo?.contactFormEmail || union.email;
    const unionName = union.publicName || union.name;

    if (recipientEmail) {
      try {
        const emailSubject = subject
          ? `Contact Form: ${subject}`
          : `New Contact Form Submission from ${name}`;

        const text = `
New Contact Form Submission

From: ${name}
Email: ${email}
${phone ? `Phone: ${phone}` : ''}
${subject ? `Subject: ${subject}` : ''}

Message:
${message}

---
This message was sent via the contact form on your UnionTab page.
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
        <div class="field-label">From:</div>
        <div class="field-value">${name}</div>
      </div>
      <div class="field">
        <div class="field-label">Email:</div>
        <div class="field-value"><a href="mailto:${email}">${email}</a></div>
      </div>
      ${phone ? `
      <div class="field">
        <div class="field-label">Phone:</div>
        <div class="field-value">${phone}</div>
      </div>
      ` : ''}
      ${subject ? `
      <div class="field">
        <div class="field-label">Subject:</div>
        <div class="field-value">${subject}</div>
      </div>
      ` : ''}
      <div class="message-box">
        <div class="field-label">Message:</div>
        <div class="field-value" style="white-space: pre-wrap;">${message}</div>
      </div>
    </div>
    <div class="footer">
      <p>This message was sent via the contact form on your ${unionName} UnionTab page.</p>
      <p>Reply to this email to respond to ${name}.</p>
    </div>
  </div>
</body>
</html>
        `.trim();

        await sendEmail({
          to: recipientEmail,
          subject: emailSubject,
          text,
          html,
        });
      } catch (emailError) {
        console.error('Error sending contact form email:', emailError);
        // Don't fail the request if email fails - the submission is still saved
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Your message has been sent successfully',
      submission: { id: submission.id },
    });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
