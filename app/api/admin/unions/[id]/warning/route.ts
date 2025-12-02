import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { unions, members, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth/session';
import { sendEmail } from '@/lib/email/sendgrid';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify user is webmaster
    const sessionCookie = request.headers.get('cookie')?.match(/session=([^;]+)/)?.[1];

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(sessionCookie);

    // Get user to check role
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!currentUser || currentUser.role !== 'webmaster') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const unionId = parseInt(params.id);

    // Get union details
    const [union] = await db
      .select()
      .from(unions)
      .where(eq(unions.id, unionId))
      .limit(1);

    if (!union) {
      return NextResponse.json({ error: 'Union not found' }, { status: 404 });
    }

    if (!union.email) {
      return NextResponse.json(
        { error: 'Union has no email address on file' },
        { status: 400 }
      );
    }

    // Get owner(s) to send warning
    const owners = await db
      .select({
        userName: users.name,
        userEmail: users.email,
      })
      .from(members)
      .innerJoin(users, eq(members.userId, users.id))
      .where(eq(members.unionId, unionId));

    // Calculate suspension date (2 weeks from now)
    const suspensionDate = new Date();
    suspensionDate.setDate(suspensionDate.getDate() + 14);
    const formattedDate = suspensionDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Format union display name with local number if available
    const unionDisplayName = union.localNumber
      ? `${union.publicName || union.name} (Local ${union.localNumber})`
      : union.publicName || union.name;

    // Send warning emails
    const emailPromises = [];

    // Send to union's primary email
    emailPromises.push(
      sendEmail({
        to: union.email,
        subject: `Action Required: ${unionDisplayName} Account Suspension Notice`,
        text: `Dear ${unionDisplayName} Team,

This is an important notice regarding your union account on UnionTab.

Due to recent inactivity on your account, your union "${unionDisplayName}" is scheduled to be suspended on ${formattedDate} (in 2 weeks).

To prevent suspension of your account, please log in and show activity on your union page. This can include:
- Creating or updating posts
- Adding events
- Updating your union information
- Engaging with your members

If your account is suspended, all data will be preserved but your union page will no longer be accessible to members. You can contact us to reactivate your account at any time.

If you believe you received this notice in error or have any questions, please contact us at info@uniontab.com.

Thank you for your attention to this matter.

Best regards,
The UnionTab Team`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; margin-bottom: 24px;">
              <h2 style="color: #92400E; margin: 0 0 8px 0;">⚠️ Action Required: Account Suspension Notice</h2>
            </div>

            <p>Dear ${unionDisplayName} Team,</p>

            <p>This is an important notice regarding your union account on UnionTab.</p>

            <div style="background-color: #FEE2E2; border: 1px solid #FCA5A5; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold; color: #991B1B;">
                Your union "${unionDisplayName}" is scheduled to be suspended on <strong>${formattedDate}</strong> (in 2 weeks).
              </p>
            </div>

            <h3>How to Prevent Suspension:</h3>
            <p>To prevent suspension of your account, please log in and show activity on your union page. This can include:</p>
            <ul>
              <li>Creating or updating posts</li>
              <li>Adding events</li>
              <li>Updating your union information</li>
              <li>Engaging with your members</li>
            </ul>

            <h3>What Happens if Your Account is Suspended?</h3>
            <p>If your account is suspended, all data will be preserved but your union page will no longer be accessible to members. You can contact us to reactivate your account at any time.</p>

            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;">

            <p style="color: #6B7280; font-size: 14px;">
              If you believe you received this notice in error or have any questions, please contact us at
              <a href="mailto:info@uniontab.com" style="color: #2563EB;">info@uniontab.com</a>.
            </p>

            <p>Best regards,<br>The UnionTab Team</p>
          </div>
        `,
      })
    );

    // Also send to individual member emails
    for (const owner of owners) {
      emailPromises.push(
        sendEmail({
          to: owner.userEmail,
          subject: `Action Required: ${unionDisplayName} Account Suspension Notice`,
          text: `Dear ${owner.userName},

This is an important notice regarding your union account on UnionTab.

Due to recent inactivity on your account, your union "${unionDisplayName}" is scheduled to be suspended on ${formattedDate} (in 2 weeks).

To prevent suspension of your account, please log in and show activity on your union page. This can include:
- Creating or updating posts
- Adding events
- Updating your union information
- Engaging with your members

If your account is suspended, all data will be preserved but your union page will no longer be accessible to members. You can contact us to reactivate your account at any time.

If you believe you received this notice in error or have any questions, please contact us at info@uniontab.com.

Thank you for your attention to this matter.

Best regards,
The UnionTab Team`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; margin-bottom: 24px;">
                <h2 style="color: #92400E; margin: 0 0 8px 0;">⚠️ Action Required: Account Suspension Notice</h2>
              </div>

              <p>Dear ${owner.userName},</p>

              <p>This is an important notice regarding your union account on UnionTab.</p>

              <div style="background-color: #FEE2E2; border: 1px solid #FCA5A5; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0; font-weight: bold; color: #991B1B;">
                  Your union "${unionDisplayName}" is scheduled to be suspended on <strong>${formattedDate}</strong> (in 2 weeks).
                </p>
              </div>

              <h3>How to Prevent Suspension:</h3>
              <p>To prevent suspension of your account, please log in and show activity on your union page. This can include:</p>
              <ul>
                <li>Creating or updating posts</li>
                <li>Adding events</li>
                <li>Updating your union information</li>
                <li>Engaging with your members</li>
              </ul>

              <h3>What Happens if Your Account is Suspended?</h3>
              <p>If your account is suspended, all data will be preserved but your union page will no longer be accessible to members. You can contact us to reactivate your account at any time.</p>

              <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;">

              <p style="color: #6B7280; font-size: 14px;">
                If you believe you received this notice in error or have any questions, please contact us at
                <a href="mailto:info@uniontab.com" style="color: #2563EB;">info@uniontab.com</a>.
              </p>

              <p>Best regards,<br>The UnionTab Team</p>
            </div>
          `,
        })
      );
    }

    // Wait for all emails to be sent
    const results = await Promise.allSettled(emailPromises);

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const failCount = results.filter((r) => r.status === 'rejected').length;

    console.log(
      `Sent warning emails for union ${union.name}: ${successCount} succeeded, ${failCount} failed`
    );

    return NextResponse.json({
      message: 'Warning emails sent successfully',
      sent: successCount,
      failed: failCount,
    });
  } catch (error) {
    console.error('Error sending warning:', error);
    return NextResponse.json(
      { error: 'Failed to send warning email' },
      { status: 500 }
    );
  }
}
