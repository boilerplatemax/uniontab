'use client';

import { RegistrationShareWidget } from '../../registration-share-widget';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserPlus, Mail, CheckCircle, Clock } from 'lucide-react';
import { UnionNavbar } from '../../union-navbar';

interface InvitePageContentProps {
  unionName: string;
  localNumber?: string | null;
  registrationUrl: string;
  slug: string;
  membership: {
    user: { name: string | null };
    member: { role: string };
  };
  handleSignOut: () => Promise<void>;
  logoUrl?: string | null;
}

export default function InvitePageContent({
  unionName,
  localNumber,
  registrationUrl,
  slug,
  membership,
  handleSignOut,
  logoUrl,
}: InvitePageContentProps) {
  const fullUnionName = localNumber
    ? `${unionName} Local ${localNumber}`
    : unionName;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <UnionNavbar
        slug={slug}
        unionName={unionName}
        localNumber={localNumber}
        membership={membership}
        handleSignOut={handleSignOut}
        pendingMembersCount={0}
        announcementId={null}
      />

      {/* Spacing for fixed navbar */}
      <div className="h-14" />

      <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Invite New Members</h1>
        <p className="text-gray-600">
          Share your registration link with potential members to join {fullUnionName}
        </p>
      </div>

      <div className="space-y-6">
        {/* Registration Link Widget */}
        <RegistrationShareWidget
          slug={slug}
          unionName={unionName}
          localNumber={localNumber}
          logoUrl={logoUrl}
        />

        {/* Registration Process Information */}
        <Card>
          <CardHeader>
            <CardTitle>How Member Registration Works</CardTitle>
            <CardDescription>
              New members go through a verification and approval process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">1. Member Signs Up</h3>
                  <p className="text-sm text-gray-600">
                    New members create an account using their personal email address and password.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">2. Email Verification</h3>
                  <p className="text-sm text-gray-600">
                    Members receive a verification email and must click the link to verify their email address. This ensures authenticity and security.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">3. Pending Admin Approval</h3>
                  <p className="text-sm text-gray-600">
                    The member's application appears in the Members section with "Pending" status. Admins can review and approve or reject the application.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">4. Admin Decision Notification</h3>
                  <p className="text-sm text-gray-600">
                    Members receive an email notification when their application is approved or rejected. Approved members gain full access to the union platform.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg">Tips for Sharing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>Copy the link and share it via email, text message, or social media</li>
              <li>Generate PDF instructions to print and distribute at meetings or events</li>
              <li>Remind members to check their spam folder for verification emails</li>
              <li>Let members know their application requires admin approval</li>
              <li>Check the Members page regularly to approve new member applications</li>
            </ul>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}
